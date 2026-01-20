import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Text,
    Dimensions,
    Platform,
    Image,
    TextInput,
    Modal,
    ActivityIndicator,
    Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { EpiService } from '../../services/epiService';
import { EpiConfig, EpiCategory } from '../../types/epi';
import { SupplierEvaluation, EvaluationResponse } from '../../types/evaluation';
import { ScoringService } from '../../services/scoringService';
import { SupplierResponseService } from '../../services/supplierResponseService';
import { useAuth } from '../../hooks/useAuth';
import {
    takePhoto,
    pickFromGallery,
    pickDocument,
    uploadSupplierEvidence,
} from '../../services/imagePickerService';

const { width } = Dimensions.get('window');

// Extended Question type for UI state
interface UIQuestion {
    id: string; // ID from config
    text: string;
    expectedEvidence?: string;
    maxPoints: number; // weight from config
    sectionId: string;
    selectedAnswer?: 'SI' | 'NO' | 'N/A';
    observation?: string;
    score?: number;
    evidenceUrl?: string; // File URL
}

interface UISection {
    id: string;
    title: string;
    questions: UIQuestion[];
}

interface SupplyQuestionnaireScreenProps {
    supplierId: string;
    onNavigateBack?: () => void;
    onComplete?: () => void;
    onNavigateToPhotoEvidence?: () => void;
    isLocked?: boolean; // NEW
}

export const SupplyQuestionnaireScreen: React.FC<SupplyQuestionnaireScreenProps> = ({
    supplierId: supplierIdProp,
    onNavigateBack,
    onComplete,
    onNavigateToPhotoEvidence
}) => {
    const { user } = useAuth();

    // Use prop or fallback to current user's ID
    const supplierId = supplierIdProp || user?.id;

    const [loading, setLoading] = useState(true);
    const [sections, setSections] = useState<UISection[]>([]);
    const [currentScore, setCurrentScore] = useState(0);
    const [evaluation, setEvaluation] = useState<any>(null);
    // Flattened list for progress calculation only
    const allQuestions = sections.flatMap(s => s.questions);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [saving, setSaving] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [uploading, setUploading] = useState(false); // NEW

    console.log('Mounting SupplyQuestionnaireScreen for supplier:', supplierId, 'user:', user?.id);

    useEffect(() => {
        if (!supplierId) {
            Alert.alert('Error', 'No se pudo identificar al proveedor. Por favor, intenta de nuevo.');
            onNavigateBack?.();
            return;
        }
        console.log('useEffect triggered');
        loadQuestions();
        loadLockStatus(); // NEW
    }, []);

    // NEW: Load lock status
    const loadLockStatus = async () => {
        try {
            if (!supplierId) return;
            const canEdit = await SupplierResponseService.canEditEPI(supplierId);
            setIsLocked(!canEdit);
            console.log('Supply questionnaire locked:', !canEdit);
        } catch (error) {
            console.error('Error loading lock status:', error);
        }
    };

    const loadQuestions = async () => {
        try {
            setLoading(true);
            const config = await EpiService.getEpiConfig();

            // Calculate points per question automatically using ScoringService
            const loadedSections: UISection[] = config.abastecimiento.sections.map(s => {
                const pointsPerQuestion = ScoringService.calculateQuestionPoints(s);
                return {
                    id: s.id,
                    title: s.title,
                    questions: s.questions.map(q => ({
                        id: q.id,
                        text: q.text,
                        expectedEvidence: q.evidenceDescription,
                        maxPoints: pointsPerQuestion, // AUTOMATIC CALCULATION
                        sectionId: s.id,
                        selectedAnswer: undefined,
                        observation: '',
                        score: 0
                    }))
                };
            });

            // Load existing evaluation if any
            const existingEval = await SupplierResponseService.getSupplierEvaluation(supplierId);
            if (existingEval) {
                setEvaluation(existingEval);
                setCurrentScore(existingEval.abastecimientoScore || 0);

                // Populate answers from existing responses
                const abastecimientoResponses = existingEval.responses.filter(r => r.category === 'abastecimiento');
                loadedSections.forEach(section => {
                    section.questions.forEach(question => {
                        const savedResponse = abastecimientoResponses.find(r => r.questionId === question.id);
                        if (savedResponse) {
                            // Map response answer to UI answer
                            const answer = savedResponse.answer === 'cumple' ? 'SI' :
                                savedResponse.answer === 'no_cumple' ? 'NO' : 'N/A';
                            question.selectedAnswer = answer;
                            question.score = savedResponse.pointsEarned || 0;
                            question.observation = savedResponse.note || '';
                            question.evidenceUrl = savedResponse.evidenceUrl; // Load evidence URL
                        }
                    });
                });

                console.log('✅ Loaded existing abastecimiento responses:', abastecimientoResponses.length);
            }

            setSections(loadedSections);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudieron cargar las preguntas');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSelect = async (sectionId: string, questionId: string, answer: 'SI' | 'NO' | 'N/A') => {
        // Update UI immediately
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                questions: s.questions.map(q => {
                    if (q.id !== questionId) return q;
                    let points = 0;
                    if (answer === 'SI') points = q.maxPoints;
                    return { ...q, selectedAnswer: answer, score: points };
                })
            };
        }));

        // Find question to get points
        const section = sections.find(s => s.id === sectionId);
        const question = section?.questions.find(q => q.id === questionId);
        if (!question) return;

        // Save response with SupplierResponseService (auto-updates score)
        try {
            const response = ScoringService.createResponse(
                questionId,
                sectionId,
                'abastecimiento',
                answer === 'SI' ? 'cumple' : 'no_cumple',
                question.maxPoints
            );
            // Include evidenceUrl if it exists
            if (question.evidenceUrl) {
                response.evidenceUrl = question.evidenceUrl;
            }

            await SupplierResponseService.saveResponse(supplierId, response);

            // Refresh score
            const updatedEval = await SupplierResponseService.getSupplierEvaluation(supplierId);
            if (updatedEval) {
                setCurrentScore(updatedEval.abastecimientoScore || 0);
            }
        } catch (error) {
            console.error('Error saving response:', error);
        }
    };

    const handleObservationChange = async (sectionId: string, questionId: string, text: string) => {
        // Update UI immediately
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                questions: s.questions.map(q => {
                    if (q.id !== questionId) return q;
                    return { ...q, observation: text };
                })
            };
        }));

        // Save observation to existing response if it exists
        try {
            const existingEval = await SupplierResponseService.getSupplierEvaluation(supplierId);
            if (existingEval) {
                const existingResponse = existingEval.responses.find(r => r.questionId === questionId);
                if (existingResponse) {
                    // Update existing response with new note
                    const updatedResponse = { ...existingResponse, note: text };
                    await SupplierResponseService.saveResponse(supplierId, updatedResponse);
                    console.log('✅ Observation saved for question:', questionId);
                }
            }
        } catch (error) {
            console.error('Error saving observation:', error);
        }
    };

    // State for upload modal
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [activeUploadQuestionId, setActiveUploadQuestionId] = useState<{ sectionId: string, questionId: string } | null>(null);

    const handleUploadEvidence = (sectionId: string, questionId: string) => {
        setActiveUploadQuestionId({ sectionId, questionId });
        setShowUploadModal(true);
    };

    const performUpload = async (type: 'camera' | 'gallery' | 'document') => {
        if (!supplierId || !activeUploadQuestionId) return;

        const { sectionId, questionId } = activeUploadQuestionId;

        try {
            setUploading(true);
            let media = null;

            if (type === 'camera') {
                media = await takePhoto();
            } else if (type === 'gallery') {
                media = await pickFromGallery();
            } else {
                media = await pickDocument();
            }

            if (!media) {
                setUploading(false);
                return;
            }

            const url = await uploadSupplierEvidence(
                supplierId,
                'supply',
                questionId,
                media.uri,
                media.name
            );

            // Update UI
            setSections(prev => prev.map(s => {
                if (s.id !== sectionId) return s;
                return {
                    ...s,
                    questions: s.questions.map(q => {
                        if (q.id !== questionId) return q;
                        return { ...q, evidenceUrl: url };
                    })
                };
            }));

            // Update persisted data
            const existingEval = await SupplierResponseService.getSupplierEvaluation(supplierId);
            if (existingEval) {
                const existingResponse = existingEval.responses.find(r => r.questionId === questionId);
                if (existingResponse) {
                    await SupplierResponseService.saveResponse(supplierId, {
                        ...existingResponse,
                        evidenceUrl: url
                    });
                } else {
                    // If response doesn't exist yet but we're uploading evidence, create a basic response or wait?
                    // usually covered by save response logic implicitly in some backends, but here we probably depend on answer existing.
                }
            }

            Alert.alert('Éxito', 'Evidencia subida correctamente');

        } catch (error) {
            console.error('Error uploading:', error);
            Alert.alert('Error', 'No se pudo subir el archivo');
        } finally {
            setUploading(false);
            setActiveUploadQuestionId(null);
        }
    };

    const handleSaveAndExit = async () => {
        if (!supplierId) {
            Alert.alert('Error', 'No se ha identificado al proveedor');
            return;
        }

        setSaving(true);
        try {
            // Since we're saving responses in real-time, just submit the evaluation
            await SupplierResponseService.submitEvaluation(supplierId);
            setShowSaveModal(true);
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', error.message || 'No se pudo guardar la evaluación');
        } finally {
            setSaving(false);
        }
    };

    // Calculate Progress
    const totalQuestions = allQuestions.length;
    const answeredQuestions = allQuestions.filter(q => q.selectedAnswer).length;

    // Get current question from flattened list
    const currentQuestion = allQuestions[currentQuestionIndex];
    const currentSection = sections.find(s => s.id === currentQuestion?.sectionId);

    // Navigation functions
    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < allQuestions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Full Width Header */}
            <View style={styles.fullWidthHeader}>
                <View style={styles.headerContentContainer}>
                    <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
                        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>Abastecimiento</Text>
                        <Text style={styles.headerSubtitle}>
                            Pregunta {currentQuestionIndex + 1} de {totalQuestions}
                        </Text>
                    </View>
                    <View style={styles.logoContainer}>
                        <Image source={require('../../../assets/icono_indurama.png')} style={styles.logoImage} resizeMode="contain" />
                    </View>
                </View>
            </View>

            {/* Full Width Stepper */}
            <View style={styles.fullWidthStepper}>
                <View style={styles.stepperContentContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.stepperScrollContent}
                    >
                        {allQuestions.map((q, index) => {
                            const isCompleted = q.selectedAnswer !== undefined;
                            const isCurrent = index === currentQuestionIndex;

                            return (
                                <View key={q.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <TouchableOpacity
                                        style={styles.stepItem}
                                        onPress={() => setCurrentQuestionIndex(index)}
                                    >
                                        <View style={[
                                            styles.stepCircle,
                                            isCompleted && styles.stepCircleCompleted,
                                            isCurrent && styles.stepCircleCurrent
                                        ]}>
                                            {isCompleted ? (
                                                <Ionicons name="checkmark" size={12} color="#FFF" />
                                            ) : (
                                                <Text style={[
                                                    styles.stepNumber,
                                                    isCurrent && styles.stepNumberCurrent
                                                ]}>{index + 1}</Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                    {index < allQuestions.length - 1 && (
                                        <View style={[
                                            styles.stepLine,
                                            isCompleted && styles.stepLineCompleted
                                        ]} />
                                    )}
                                </View>
                            );
                        })}
                    </ScrollView>
                    <View style={styles.scoreBadge}>
                        <Text style={styles.scoreLabel}>Puntaje:</Text>
                        <Text style={styles.scoreValue}>{Math.round(currentScore)}/100</Text>
                    </View>
                </View>
            </View>

            {/* Main Content */}
            <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {loading ? (
                        <ActivityIndicator size="large" color="#003E85" style={{ marginTop: 40 }} />
                    ) : sections.length === 0 ? (
                        <Text style={{ textAlign: 'center', marginTop: 20, color: '#64748B' }}>No hay preguntas disponibles.</Text>
                    ) : (
                        <View style={styles.questionContainer}>
                            {/* Locked Banner inside */}
                            {isLocked && (
                                <View style={styles.lockedBanner}>
                                    <Ionicons name="lock-closed" size={20} color="#D97706" />
                                    <Text style={styles.lockedText}>Evaluación enviada - Solo lectura</Text>
                                </View>
                            )}

                            <View style={styles.questionHeader}>
                                <Text style={styles.questionSection}>
                                    {currentSection?.title || 'Sección'}
                                </Text>
                                <View style={styles.pointsBadge}>
                                    <Text style={styles.pointsText}>{currentQuestion?.maxPoints || 0} pts</Text>
                                </View>
                            </View>

                            <Text style={styles.questionText}>{currentQuestion?.text}</Text>

                            {currentQuestion?.expectedEvidence && (
                                <View style={styles.evidenceHintContainer}>
                                    <Ionicons name="information-circle-outline" size={18} color="#003E85" />
                                    <Text style={styles.evidenceHint}>Evidencia esperada: {currentQuestion.expectedEvidence}</Text>
                                </View>
                            )}

                            {/* Answer Buttons */}
                            <View style={styles.answersSection}>
                                <Text style={styles.inputLabel}>Respuesta:</Text>
                                <View style={styles.answerButtonsContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.answerButton,
                                            styles.answerButtonYes,
                                            currentQuestion?.selectedAnswer === 'SI' && styles.answerButtonYesSelected,
                                            isLocked && styles.disabledButton
                                        ]}
                                        onPress={() => currentQuestion && handleAnswerSelect(currentQuestion.sectionId, currentQuestion.id, 'SI')}
                                        disabled={isLocked}
                                    >
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={24}
                                            color={currentQuestion?.selectedAnswer === 'SI' ? '#FFF' : '#22C55E'}
                                        />
                                        <Text style={[
                                            styles.answerButtonText,
                                            currentQuestion?.selectedAnswer === 'SI' && styles.answerButtonTextSelected
                                        ]}>SÍ</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.answerButton,
                                            styles.answerButtonNo,
                                            currentQuestion?.selectedAnswer === 'NO' && styles.answerButtonNoSelected,
                                            isLocked && styles.disabledButton
                                        ]}
                                        onPress={() => currentQuestion && handleAnswerSelect(currentQuestion.sectionId, currentQuestion.id, 'NO')}
                                        disabled={isLocked}
                                    >
                                        <Ionicons
                                            name="close-circle"
                                            size={24}
                                            color={currentQuestion?.selectedAnswer === 'NO' ? '#FFF' : '#EF4444'}
                                        />
                                        <Text style={[
                                            styles.answerButtonText,
                                            currentQuestion?.selectedAnswer === 'NO' && styles.answerButtonTextSelected
                                        ]}>NO</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.answerButton,
                                            styles.answerButtonNA,
                                            currentQuestion?.selectedAnswer === 'N/A' && styles.answerButtonNASelected,
                                            isLocked && styles.disabledButton
                                        ]}
                                        onPress={() => currentQuestion && handleAnswerSelect(currentQuestion.sectionId, currentQuestion.id, 'N/A')}
                                        disabled={isLocked}
                                    >
                                        <Ionicons
                                            name="remove-circle"
                                            size={24}
                                            color={currentQuestion?.selectedAnswer === 'N/A' ? '#FFF' : '#6B7280'}
                                        />
                                        <Text style={[
                                            styles.answerButtonText,
                                            currentQuestion?.selectedAnswer === 'N/A' && styles.answerButtonTextSelected
                                        ]}>N/A</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Observation / Evidence */}
                            <View style={styles.observationContainer}>
                                <Text style={styles.observationLabel}>
                                    <Ionicons name="document-text-outline" size={14} color="#64748B" /> Observación / Evidencia
                                </Text>
                                <TextInput
                                    style={[styles.observationInput, isLocked && styles.disabledInput]}
                                    value={currentQuestion?.observation || ''}
                                    onChangeText={(text) => currentQuestion && handleObservationChange(currentQuestion.sectionId, currentQuestion.id, text)}
                                    placeholder={isLocked ? "Sin observaciones" : "Escribe tu observación aquí..."}
                                    placeholderTextColor="#999"
                                    multiline
                                    numberOfLines={3}
                                    editable={!isLocked}
                                />

                                {/* Upload Button */}
                                {!isLocked && (
                                    <TouchableOpacity
                                        style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                                        onPress={() => currentQuestion && handleUploadEvidence(currentQuestion.sectionId, currentQuestion.id)}
                                        disabled={uploading}
                                    >
                                        <Ionicons name="cloud-upload-outline" size={20} color="#003E85" />
                                        <Text style={styles.uploadText}>
                                            {currentQuestion?.evidenceUrl ? 'Cambiar Evidencia' : 'Adjuntar Evidencia'}
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                {/* Evidence Preview */}
                                {currentQuestion?.evidenceUrl && (
                                    <View style={styles.evidencePreview}>
                                        <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                                        <Text style={styles.evidenceText}>Evidencia adjuntada</Text>
                                    </View>
                                )}
                            </View>

                        </View>
                    )}
                </ScrollView>
            </View>

            {/* Full Width Footer */}
            <View style={styles.fullWidthFooter}>
                <View style={styles.footerContentContainer}>
                    <TouchableOpacity
                        style={[styles.navButton, styles.prevButton, currentQuestionIndex === 0 && styles.navButtonDisabled]}
                        onPress={handlePrevious}
                        disabled={currentQuestionIndex === 0}
                    >
                        <Ionicons name="chevron-back" size={20} color={currentQuestionIndex === 0 ? '#CBD5E1' : '#003E85'} />
                        <Text style={[styles.navButtonText, currentQuestionIndex === 0 && styles.navButtonTextDisabled]}>Anterior</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.saveButton} onPress={handleSaveAndExit} disabled={saving}>
                        {saving ? <ActivityIndicator color="#003E85" /> : (
                            <>
                                <Ionicons name="save-outline" size={18} color="#003E85" />
                                <Text style={styles.saveButtonText}>Guardar</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {currentQuestionIndex < allQuestions.length - 1 ? (
                        <TouchableOpacity
                            style={[styles.navButton, styles.nextButton]}
                            onPress={handleNextQuestion}
                        >
                            <Text style={styles.nextButtonText}>Siguiente</Text>
                            <Ionicons name="chevron-forward" size={20} color="#FFF" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.navButton, styles.finishButton]}
                            onPress={onNavigateToPhotoEvidence || handleSaveAndExit}
                        >
                            <Text style={styles.nextButtonText}>Finalizar</Text>
                            <Ionicons name="checkmark" size={20} color="#FFF" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Modals */}
            <Modal
                visible={showUploadModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowUploadModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowUploadModal(false)}
                >
                    <TouchableOpacity activeOpacity={1} style={{ alignItems: 'center' }}>
                        <View style={styles.uploadModalContainer}>
                            <Text style={styles.uploadModalTitle}>Subir Evidencia</Text>
                            <TouchableOpacity
                                style={styles.uploadOptionButton}
                                onPress={() => { setShowUploadModal(false); performUpload('camera'); }}
                            >
                                <Text style={styles.uploadOptionText}>📷 Tomar Foto</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.uploadOptionButton}
                                onPress={() => { setShowUploadModal(false); performUpload('gallery'); }}
                            >
                                <Text style={styles.uploadOptionText}>🖼️ Desde Galería</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.uploadOptionButton}
                                onPress={() => { setShowUploadModal(false); performUpload('document'); }}
                            >
                                <Text style={styles.uploadOptionText}>📄 Seleccionar Archivo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.uploadCancelButton}
                                onPress={() => setShowUploadModal(false)}
                            >
                                <Text style={styles.uploadCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            <Modal
                visible={showSaveModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSaveModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Evaluación Guardada</Text>
                        <Text style={styles.modalMessage}>
                            Se ha registrado la evaluación de CALIDAD correctamente.
                        </Text>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => {
                                setShowSaveModal(false);
                                if (onComplete) onComplete();
                            }}
                        >
                            <Text style={styles.modalButtonText}>Continuar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F5F9',
    },
    fullWidthHeader: {
        width: '100%',
        backgroundColor: '#003E85',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingBottom: 24,
    },
    headerContentContainer: {
        width: '100%',
        maxWidth: 1024,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 13,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 4,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        width: 40,
        height: 40,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoImage: {
        width: 32,
        height: 32,
        tintColor: '#FFF'
    },

    // Stepper
    fullWidthStepper: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        alignItems: 'center',
    },
    stepperContentContainer: {
        width: '100%',
        maxWidth: 1024,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        gap: 20,
    },
    stepperScrollContent: {
        alignItems: 'center',
        paddingRight: 20,
    },
    stepItem: {
        padding: 4,
    },
    stepCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepCircleCompleted: {
        backgroundColor: '#003E85',
        borderColor: '#003E85',
    },
    stepCircleCurrent: {
        backgroundColor: '#EFF6FF',
        borderColor: '#003E85',
        borderWidth: 2,
    },
    stepNumber: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    stepNumberCurrent: {
        color: '#003E85',
    },
    stepLine: {
        width: 24,
        height: 2,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 4,
    },
    stepLineCompleted: {
        backgroundColor: '#003E85',
    },
    scoreBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 6
    },
    scoreLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600'
    },
    scoreValue: {
        fontSize: 14,
        color: '#003E85',
        fontWeight: '700'
    },

    // Content
    content: {
        flex: 1,
        width: '100%',
    },
    contentContainer: {
        width: '100%',
        alignItems: 'center',
        paddingTop: 24,
        paddingBottom: 100,
    },
    questionContainer: {
        width: '100%',
        maxWidth: 800,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12 },
            android: { elevation: 3 },
            web: { boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' },
        }),
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    questionSection: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    pointsBadge: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    pointsText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#003E85',
    },
    questionText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1E293B',
        lineHeight: 24,
        marginBottom: 16,
    },
    evidenceHintContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        padding: 12,
        borderRadius: 8,
        marginBottom: 24,
        gap: 8,
    },
    evidenceHint: {
        flex: 1,
        fontSize: 13,
        color: '#1E3A8A',
        lineHeight: 20,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 12,
    },
    answersSection: {
        marginBottom: 24,
    },
    answerButtonsContainer: {
        flexDirection: 'row',
        gap: 12,
        flexWrap: 'wrap',
    },
    answerButton: {
        flex: 1,
        minWidth: 100,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
        gap: 8,
    },
    answerButtonYes: {
        // base
    },
    answerButtonYesSelected: {
        backgroundColor: '#22C55E',
        borderColor: '#22C55E',
    },
    answerButtonNo: {
        // base
    },
    answerButtonNoSelected: {
        backgroundColor: '#EF4444',
        borderColor: '#EF4444',
    },
    answerButtonNA: {
        // base
    },
    answerButtonNASelected: {
        backgroundColor: '#64748B',
        borderColor: '#64748B',
    },
    answerButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    answerButtonTextSelected: {
        color: '#FFFFFF',
    },
    disabledButton: {
        opacity: 0.6,
    },

    observationContainer: {
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    observationLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 8,
    },
    observationInput: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#1E293B',
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 12,
    },
    disabledInput: {
        backgroundColor: '#F3F4F6',
        color: '#9CA3AF',
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 8,
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#DBEAFE',
        gap: 8,
    },
    uploadButtonDisabled: {
        opacity: 0.6,
    },
    uploadText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#003E85',
    },
    evidencePreview: {
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    evidenceText: {
        fontSize: 12,
        color: '#22C55E',
        fontWeight: '600',
    },
    lockedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF7ED',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FED7AA',
        gap: 8,
    },
    lockedText: {
        color: '#9A3412',
        fontSize: 14,
        fontWeight: '600',
    },

    // Footer
    fullWidthFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: -4 } },
            web: { boxShadow: '0 -4px 20px rgba(0,0,0,0.05)' },
            android: { elevation: 10 },
        }),
    },
    footerContentContainer: {
        width: '100%',
        maxWidth: 700,
        flexDirection: 'row',
        gap: 16,
        paddingHorizontal: 20,
        justifyContent: 'center',
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#FFFFFF',
        gap: 8,
        minWidth: 120,
    },
    prevButton: {
        // default
    },
    navButtonDisabled: {
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
    },
    navButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#003E85',
    },
    navButtonTextDisabled: {
        color: '#CBD5E1',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        backgroundColor: '#F0F9FF',
        borderWidth: 1,
        borderColor: '#BAE6FD',
        gap: 8,
    },
    saveButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#003E85',
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        backgroundColor: '#003E85',
        gap: 8,
        minWidth: 120,
    },
    finishButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        backgroundColor: '#22C55E',
        borderColor: '#22C55E',
        gap: 8,
        minWidth: 120,
    },
    nextButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    uploadModalContainer: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
    },
    uploadModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 20,
    },
    uploadOptionButton: {
        width: '100%',
        paddingVertical: 14,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        marginBottom: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    uploadOptionText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#334155',
    },
    uploadCancelButton: {
        marginTop: 8,
        paddingVertical: 10,
    },
    uploadCancelText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    modalContainer: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
            android: { elevation: 5 },
            web: { boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }
        }),
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#003E85',
        marginBottom: 12,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    modalButton: {
        backgroundColor: '#003E85',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
