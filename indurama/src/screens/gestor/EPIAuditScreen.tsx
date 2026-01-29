import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    Image,
    ActivityIndicator,
    TextInput,
    Alert,
    Switch,
    Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { SupplierResponseService } from '../../services/supplierResponseService';
import { EpiService } from '../../services/epiService';
import { ScoringService } from '../../services/scoringService';
import { theme } from '../../styles/theme';
import {
    takePhoto,
    pickFromGallery,
    pickDocument,
    showUploadOptions,
    uploadSupplierEvidence,
    PickedMedia
} from '../../services/imagePickerService';
import { useResponsive, BREAKPOINTS } from '../../styles/responsive';
import { Ionicons } from '@expo/vector-icons';

interface EPIAuditScreenProps {
    submissionId: string;
    supplierId: string;
    gestorId: string;
    onNavigateBack?: () => void;
    onApproved?: () => void;
}

export const EPIAuditScreen: React.FC<EPIAuditScreenProps> = ({
    submissionId,
    supplierId,
    gestorId,
    onNavigateBack,
    onApproved
}) => {
    const { isDesktopView, width } = useResponsive();
    const [loading, setLoading] = useState(true);
    const [submission, setSubmission] = useState<any>(null);
    const [supplierData, setSupplierData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'calidad' | 'abastecimiento'>('calidad');
    const [processing, setProcessing] = useState(false);
    const [epiConfig, setEpiConfig] = useState<any>(null);
    const [uploadingQuestion, setUploadingQuestion] = useState<string | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);

    // Audit State: Map questionId -> { isValid: boolean, finding: string, evidenceUrl?: string }
    const [auditState, setAuditState] = useState<Record<string, { isValid: boolean, finding: string, evidenceUrl?: string }>>({});

    useEffect(() => {
        loadData();
    }, [submissionId, supplierId]);

    const loadData = async () => {
        try {
            setLoading(true);

            // 1. Config
            // const { EpiService } = await import('../services/epiService'); // REMOVE
            const config = await EpiService.getEpiConfig();
            setEpiConfig(config);

            // 2. Submission - try epi_submissions first, then supplier_evaluations
            let subData: any = null;

            // Try epi_submissions first
            if (submissionId) {
                const subDoc = await getDoc(doc(db, 'epi_submissions', submissionId));
                if (subDoc.exists()) {
                    subData = { id: subDoc.id, ...subDoc.data() };
                    console.log('Loaded from epi_submissions:', subData);
                }
            }

            // Fallback to supplier_evaluations
            if (!subData) {
                console.log('No epi_submission found, trying supplier_evaluations...');
                const evalDoc = await getDoc(doc(db, 'supplier_evaluations', supplierId));
                if (evalDoc.exists()) {
                    const evalData = evalDoc.data();
                    subData = {
                        id: evalDoc.id,
                        supplierId: supplierId,
                        status: evalData.status || 'draft',
                        calculatedScore: evalData.globalScore ?? evalData.calculatedScore ?? 0,
                        calidadScore: evalData.calidadScore ?? 0,
                        abastecimientoScore: evalData.abastecimientoScore ?? 0,
                        qualityResponses: evalData.responses?.filter((r: any) => r.category === 'calidad') || [],
                        supplyResponses: evalData.responses?.filter((r: any) => r.category === 'abastecimiento') || [],
                        photoEvidence: evalData.photoEvidence || [],
                    };
                    console.log('Loaded from supplier_evaluations:', subData);
                }
            }

            if (subData) {
                setSubmission(subData);

                // Initialize audit state
                const initialAudit: any = {};
                [...(subData.qualityResponses || []), ...(subData.supplyResponses || [])].forEach((r: any) => {
                    const isYes = r.answer === 'SI' || r.answer === 'CUMPLE';
                    initialAudit[r.questionId] = { isValid: isYes, finding: '' };
                });
                setAuditState(initialAudit);
            }

            // 3. Supplier
            const userDoc = await getDoc(doc(db, 'users', supplierId));
            if (userDoc.exists()) {
                setSupplierData(userDoc.data());
            }

        } catch (error) {
            console.error('Error loading audit data:', error);
            Alert.alert('Error', 'No se pudieron cargar los datos');
        } finally {
            setLoading(false);
        }
    };

    // Calculate Scores in Real-time
    const scores = useMemo(() => {
        if (!submission || !epiConfig) return { originalScore: 0, auditScore: 0, delta: 0 };

        // First calculate original score from responses if not available
        let originalScore = submission.calculatedScore || 0;

        if (originalScore === 0) {
            // Calculate from responses
            const qualityResponses = submission.qualityResponses || [];
            const supplyResponses = submission.supplyResponses || [];

            const qualityYesCount = qualityResponses.filter((r: any) =>
                r.answer?.toUpperCase() === 'SI' || r.answer?.toUpperCase() === 'CUMPLE'
            ).length;
            const supplyYesCount = supplyResponses.filter((r: any) =>
                r.answer?.toUpperCase() === 'SI' || r.answer?.toUpperCase() === 'CUMPLE'
            ).length;

            const qualityTotal = Math.max(qualityResponses.length, 1);
            const supplyTotal = Math.max(supplyResponses.length, 1);

            const calidadScore = (qualityYesCount / qualityTotal) * 100;
            const abastecimientoScore = (supplyYesCount / supplyTotal) * 100;
            originalScore = (calidadScore + abastecimientoScore) / 2;
        }

        // Helper to calc section audit score (returns percentage 0-100)
        const calcSectionAuditScore = (category: 'calidad' | 'abastecimiento'): number => {
            if (!epiConfig[category]) return 0;
            const sections = epiConfig[category].sections;
            let validCount = 0;
            let totalQuestions = 0;

            sections.forEach((section: any) => {
                section.questions.forEach((q: any) => {
                    totalQuestions++;

                    // Apply Audit Validation
                    const audit = auditState[q.id];
                    // Default: if no audit state, use supplier's original answer
                    const responses = category === 'calidad' ? submission.qualityResponses : submission.supplyResponses;
                    const response = responses?.find((r: any) => r.questionId === q.id);
                    const supplierSaidYes = response?.answer?.toUpperCase() === 'SI' || response?.answer?.toUpperCase() === 'CUMPLE';

                    // If auditor hasn't touched this question, use supplier's answer
                    // If auditor marked it, use auditor's validation
                    const isValid = audit ? audit.isValid : supplierSaidYes;

                    if (isValid) {
                        validCount++;
                    }
                });
            });

            return totalQuestions > 0 ? (validCount / totalQuestions) * 100 : 0;
        };

        const calidadAuditScore = calcSectionAuditScore('calidad');
        const abastecimientoAuditScore = calcSectionAuditScore('abastecimiento');
        const auditScore = (calidadAuditScore + abastecimientoAuditScore) / 2;

        return {
            originalScore: Math.round(originalScore),
            auditScore: Math.round(auditScore),
            delta: Math.round(auditScore - originalScore)
        };
    }, [submission, epiConfig, auditState]);


    const handleToggleValidation = (questionId: string, value: boolean) => {
        setAuditState(prev => ({
            ...prev,
            [questionId]: { ...prev[questionId], isValid: value }
        }));
    };

    const handleFindingChange = (questionId: string, text: string) => {
        setAuditState(prev => ({
            ...prev,
            [questionId]: { ...prev[questionId], finding: text }
        }));
    };

    // Handle evidence upload for a specific question - opens modal
    const handleEvidenceUpload = (questionId: string) => {
        setCurrentQuestionId(questionId);
        setShowUploadModal(true);
    };

    // Upload from camera
    const handleUploadFromCamera = async () => {
        if (!currentQuestionId) return;
        const questionId = currentQuestionId;
        setShowUploadModal(false);

        try {
            setUploadingQuestion(questionId);
            const photo = await takePhoto();
            if (photo) {
                const url = await uploadSupplierEvidence(
                    supplierId,
                    'evidence',
                    `audit_${questionId}`,
                    photo.uri,
                    photo.name
                );
                setAuditState(prev => ({
                    ...prev,
                    [questionId]: { ...prev[questionId], evidenceUrl: url }
                }));
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
        } finally {
            setUploadingQuestion(null);
        }
    };

    // Upload from gallery
    const handleUploadFromGallery = async () => {
        if (!currentQuestionId) return;
        const questionId = currentQuestionId;
        setShowUploadModal(false);

        try {
            setUploadingQuestion(questionId);
            const image = await pickFromGallery();
            if (image) {
                const url = await uploadSupplierEvidence(
                    supplierId,
                    'evidence',
                    `audit_${questionId}`,
                    image.uri,
                    image.name
                );
                setAuditState(prev => ({
                    ...prev,
                    [questionId]: { ...prev[questionId], evidenceUrl: url }
                }));
            }
        } catch (error) {
            console.error('Error uploading image:', error);
        } finally {
            setUploadingQuestion(null);
        }
    };

    // Upload document
    const handleUploadDocument = async () => {
        if (!currentQuestionId) return;
        const questionId = currentQuestionId;
        setShowUploadModal(false);

        try {
            setUploadingQuestion(questionId);
            const file = await pickDocument();
            if (file) {
                const url = await uploadSupplierEvidence(
                    supplierId,
                    'evidence',
                    `audit_${questionId}`,
                    file.uri,
                    file.name
                );
                setAuditState(prev => ({
                    ...prev,
                    [questionId]: { ...prev[questionId], evidenceUrl: url }
                }));
            }
        } catch (error) {
            console.error('Error uploading document:', error);
        } finally {
            setUploadingQuestion(null);
        }
    };

    const handleSaveAudit = async () => {
        try {
            setProcessing(true);

            // Validate that all "No Cumple" have findings
            const invalidItems = Object.entries(auditState).filter(([_, state]) => !state.isValid && !state.finding.trim());
            if (invalidItems.length > 0) {
                Alert.alert('Faltan Evidencias', 'Debe ingresar la evidencia del hallazgo para todos los ítems marcados como "No Cumple".');
                setProcessing(false);
                return;
            }

            // Calculate new category scores
            const calidadScore = calculateCategoryScore('calidad');
            const abastecimientoScore = calculateCategoryScore('abastecimiento');
            const newCalculatedScore = Math.round((calidadScore + abastecimientoScore) / 2);

            // Determine new classification
            const newClassification = ScoringService.getClassification(newCalculatedScore);

            // Update submission document with new scores
            const submissionRef = doc(db, 'epi_submissions', submissionId);

            await updateDoc(submissionRef, {
                calculatedScore: newCalculatedScore,
                calidadScore: Math.round(calidadScore),
                abastecimientoScore: Math.round(abastecimientoScore),
                classification: newClassification,
                auditValidations: auditState, // Save audit state for reference
                auditedAt: new Date().toISOString(),
                auditedBy: gestorId,
            });

            // Status Logic based on Classification
            // SALIR -> Rejected
            // MEJORAR/CRECER -> Approved
            if (newClassification === 'SALIR') {
                await SupplierResponseService.rejectEPI(
                    submissionId,
                    supplierId,
                    gestorId,
                    `Auditoría Completada: Clasificación SALIR. Score: ${newCalculatedScore}`
                );
                Alert.alert('Auditoría Completada', 'El proveedor ha sido calificado como SALIR (Rechazado).');
            } else {
                await SupplierResponseService.approveEPI(
                    submissionId,
                    supplierId,
                    gestorId,
                    `Auditoría Completada: Clasificación ${newClassification}. Score: ${newCalculatedScore}`
                );
                Alert.alert('Auditoría Completada', `El proveedor ha sido calificado como ${newClassification} (Aprobado).`);
            }

            onApproved?.();

        } catch (error) {
            console.error('Error saving audit:', error);
            Alert.alert('Error', 'No se pudo guardar la auditoría');
        } finally {
            setProcessing(false);
        }
    };

    // Helper function to calculate category score
    const calculateCategoryScore = (category: 'calidad' | 'abastecimiento'): number => {
        if (!epiConfig) return 0;

        const sections = epiConfig[category].sections;
        let totalScore = 0;
        let totalQuestions = 0;

        sections.forEach((section: any) => {
            section.questions.forEach((q: any) => {
                const responses = category === 'calidad' ? submission.qualityResponses : submission.supplyResponses;
                const response = responses?.find((r: any) => r.questionId === q.id);
                const points = category === 'calidad' ? 5 : 5.5;

                const audit = auditState[q.id];
                const isValid = audit ? audit.isValid : true;

                if (isValid) {
                    totalScore += points;
                }
                totalQuestions++;
            });
        });

        // Normalize to 0-100 scale
        const maxPossible = totalQuestions * (category === 'calidad' ? 5 : 5.5);
        return maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0;
    };

    const renderQuestionList = (category: 'calidad' | 'abastecimiento') => {
        if (!epiConfig || !epiConfig[category]) return <ActivityIndicator />;

        const sections = epiConfig[category].sections;
        const responses = category === 'calidad' ? submission?.qualityResponses : submission?.supplyResponses;

        return (
            <View style={isDesktopView ? { width: '100%', alignItems: 'center' } : undefined}>
                {sections.map((section: any, i: number) => (
                    <View key={i} style={[isDesktopView && { width: '100%', maxWidth: 1200, alignSelf: 'center' }]}>
                        {/* Section Header if needed, but usually redundant with category tab */}

                        <View style={isDesktopView ? { flexDirection: 'row', flexWrap: 'wrap', gap: 16 } : undefined}>
                            {section.questions.map((q: any, j: number) => {
                                const answerObj = responses?.find((r: any) => r.questionId === q.id);
                                const answerText = (answerObj?.answer || '').toUpperCase();
                                const isYes = answerText === 'SI' || answerText === 'CUMPLE' || answerText === 'TRUE';
                                const points = isYes ? (category === 'calidad' ? 5 : 5.5) : 0;
                                const audit = auditState[q.id] || { isValid: true, finding: '' };

                                return (
                                    <View key={j} style={[styles.questionCard, isDesktopView && { width: '48%', marginBottom: 0 }]}>
                                        <View style={styles.questionMain}>
                                            <Text style={styles.questionTitle}>{q.text}</Text>
                                            <View style={styles.pointsPill}>
                                                <Text style={styles.pointsPillText}>{category === 'calidad' ? '5.0' : '5.5'} pts</Text>
                                            </View>
                                        </View>

                                        {/* Row: Supplier Declaration vs Validation */}
                                        <View style={styles.comparisonContainer}>
                                            {/* Left: Supplier */}
                                            <View style={styles.comparisonBox}>
                                                <Text style={styles.comparisonLabel}>PROVEEDOR</Text>
                                                <View style={[styles.statusBadge, isYes ? styles.bgGreenLight : styles.bgRedLight]}>
                                                    <Ionicons name={isYes ? "checkmark-circle" : "close-circle"} size={16} color={isYes ? "#10B981" : "#EF4444"} />
                                                    <Text style={[styles.statusText, isYes ? styles.textGreen : styles.textRed]}>
                                                        {isYes ? 'Cumple' : 'No Cumple'}
                                                    </Text>
                                                </View>
                                                {answerObj?.observation && (
                                                    <Text style={styles.obsText} numberOfLines={2}>
                                                        "{answerObj.observation}"
                                                    </Text>
                                                )}
                                            </View>

                                            {/* Divider Arrow */}
                                            <View style={{ justifyContent: 'center', paddingHorizontal: 8 }}>
                                                <Ionicons name="arrow-forward" size={20} color="#CBD5E1" />
                                            </View>

                                            {/* Right: Audit Validation */}
                                            <View style={styles.comparisonBox}>
                                                <Text style={styles.comparisonLabel}>AUDITORÍA</Text>
                                                <View style={styles.toggleWrapper}>
                                                    <Text style={[styles.validationLabelSmall, !audit.isValid ? styles.textRed : { color: '#64748B' }]}>
                                                        {audit.isValid ? 'Validado' : 'Rechazado'}
                                                    </Text>
                                                    <Switch
                                                        trackColor={{ false: "#FECACA", true: "#BBF7D0" }}
                                                        thumbColor={audit.isValid ? "#16A34A" : "#DC2626"}
                                                        ios_backgroundColor="#FECACA"
                                                        onValueChange={(val) => handleToggleValidation(q.id, val)}
                                                        value={audit.isValid}
                                                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                                                    />
                                                </View>
                                            </View>
                                        </View>

                                        {/* Recalibration / Finding Section - Only if Invalid */}
                                        {!audit.isValid && (
                                            <View style={styles.findingContainer}>
                                                <View style={styles.findingHeader}>
                                                    <Ionicons name="alert-circle" size={20} color="#DC2626" style={{ marginRight: 6 }} />
                                                    <Text style={styles.findingTitle}>Hallazgo de Auditoría (0 Puntos)</Text>
                                                </View>

                                                <TextInput
                                                    style={styles.findingInput}
                                                    placeholder="Describa el motivo del rechazo o hallazgo..."
                                                    multiline
                                                    value={audit.finding}
                                                    onChangeText={(text) => handleFindingChange(q.id, text)}
                                                />

                                                <TouchableOpacity
                                                    style={styles.evidenceButton}
                                                    onPress={() => handleEvidenceUpload(q.id)}
                                                    disabled={uploadingQuestion === q.id}
                                                >
                                                    {uploadingQuestion === q.id ? (
                                                        <ActivityIndicator size="small" color="#003E85" />
                                                    ) : (
                                                        <Ionicons name={audit.evidenceUrl ? "image" : "camera"} size={18} color="#003E85" style={{ marginRight: 8 }} />
                                                    )}
                                                    <Text style={styles.evidenceButtonText}>
                                                        {audit.evidenceUrl ? 'Cambiar Evidencia' : 'Adjuntar Evidencia'}
                                                    </Text>
                                                </TouchableOpacity>

                                                {audit.evidenceUrl && (
                                                    <View style={styles.evidenceThumbnailBox}>
                                                        <Image source={{ uri: audit.evidenceUrl }} style={styles.evidenceThumbnail} />
                                                        <TouchableOpacity
                                                            style={styles.removeEvidenceBtn}
                                                            onPress={() => setAuditState(prev => ({
                                                                ...prev,
                                                                [q.id]: { ...prev[q.id], evidenceUrl: undefined }
                                                            }))}
                                                        >
                                                            <Ionicons name="close" size={14} color="#FFF" />
                                                        </TouchableOpacity>
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                ))}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <View style={[styles.headerContent, isDesktopView && { width: '100%', maxWidth: 1200, alignSelf: 'center', paddingHorizontal: 0 }]}>
                    <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
                        <Image source={require('../../../assets/icons/arrow-left.png')} style={styles.backIcon} />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>Auditoría</Text>
                        <Text style={styles.headerSubtitle}>
                            Proveedor: {supplierData?.companyName || 'Proveedor'}
                        </Text>
                    </View>
                    <Image source={require('../../../assets/icono_indurama.png')} style={styles.logo} resizeMode="contain" />
                </View>
            </View>

            {/* Score Card */}
            <View style={[styles.scoreContainer, isDesktopView && {
                width: '100%',
                maxWidth: 1200,
                alignSelf: 'center',
                borderRadius: 16,
                marginBottom: 20
            }]}>
                <View style={styles.scoreItem}>
                    <Text style={styles.scoreLabel}>AUTOEVALUACIÓN</Text>
                    <Text style={styles.scoreValueAuto}>{scores.originalScore}</Text>
                </View>

                <View style={[styles.scoreMiddle, isDesktopView && { flexDirection: 'row', gap: 10 }]}>
                    <Text style={styles.recalibratingText}>Recalibrando</Text>
                    <Image source={require('../../../assets/icons/arrow-right.png')} style={styles.arrowIcon} />
                </View>

                <View style={styles.scoreItem}>
                    <Text style={styles.scoreLabelAudit}>PUNTUACIÓN AUDITORÍA</Text>
                    <Text style={styles.scoreValueAudit}>{scores.auditScore}</Text>
                    <View style={[styles.deltaBadge, scores.delta >= 0 ? styles.bgGreen : styles.bgRed]}>
                        <Text style={styles.deltaText}>{scores.delta > 0 ? '+' : ''}{scores.delta} Pts</Text>
                    </View>
                </View>
            </View>

            {/* Tabs */}
            <View style={[styles.tabs, isDesktopView && { justifyContent: 'center' }]}>
                <View style={{ flexDirection: 'row', width: '100%', maxWidth: 1200 }}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'calidad' && styles.tabActive]}
                        onPress={() => setActiveTab('calidad')}
                    >
                        <Text style={styles.tabText}>CALIDAD</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'abastecimiento' && styles.tabActive]}
                        onPress={() => setActiveTab('abastecimiento')}
                    >
                        <Text style={styles.tabText}>ABASTECIMIENTO</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={isDesktopView ? { alignItems: 'center', paddingTop: 30 } : undefined}
            >
                {renderQuestionList(activeTab)}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <View style={[isDesktopView && { width: '100%', maxWidth: 1200, alignSelf: 'center' }]}>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSaveAudit} disabled={processing}>
                        {processing ? <ActivityIndicator color="#FFF" /> : (
                            <>
                                <Image source={require('../../../assets/icons/check.png')} style={styles.saveIcon} />
                                <Text style={styles.saveText}>Guardar Auditoría</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Upload Options Modal */}
            <Modal
                visible={showUploadModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowUploadModal(false)}
            >
                <View style={styles.uploadModalOverlay}>
                    <View style={styles.uploadModalContent}>
                        <Text style={styles.uploadModalTitle}>Subir Evidencia</Text>
                        <Text style={styles.uploadModalSubtitle}>Selecciona una opción</Text>

                        <TouchableOpacity style={styles.uploadOption} onPress={handleUploadFromCamera}>
                            <Text style={styles.uploadOptionIcon}>📷</Text>
                            <Text style={styles.uploadOptionText}>Tomar Foto</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.uploadOption} onPress={handleUploadFromGallery}>
                            <Text style={styles.uploadOptionIcon}>🖼️</Text>
                            <Text style={styles.uploadOptionText}>Desde Galería</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.uploadOption} onPress={handleUploadDocument}>
                            <Text style={styles.uploadOptionIcon}>📄</Text>
                            <Text style={styles.uploadOptionText}>Seleccionar Archivo</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.uploadCancelButton}
                            onPress={() => setShowUploadModal(false)}
                        >
                            <Text style={styles.uploadCancelText}>Cancelar</Text>
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
        backgroundColor: '#F3F4F6',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#003E85', // Darker Blue
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 16,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    backButton: {
        padding: 4,
    },
    backIcon: {
        width: 24,
        height: 24,
        tintColor: '#FFF',
    },
    headerCenter: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#BBDEFB',
    },
    logo: {
        width: 60,
        height: 35,
    },
    scoreContainer: {
        backgroundColor: '#1565C0', // Medium Blue
        margin: 16,
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    scoreItem: {
        alignItems: 'center',
    },
    scoreLabel: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
        opacity: 0.9,
    },
    scoreValueAuto: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#BBDEFB',
    },
    scoreMiddle: {
        alignItems: 'center',
    },
    recalibratingText: {
        color: '#FFF',
        fontSize: 10,
        marginBottom: 4,
    },
    arrowIcon: {
        width: 24,
        height: 24,
        tintColor: '#FFF',
    },
    scoreLabelAudit: {
        color: '#4ADE80',
        fontSize: 12,
        fontWeight: 'bold',
        textAlign: 'center',
        maxWidth: 100,
    },
    scoreValueAudit: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#FFF',
    },
    deltaBadge: {
        paddingHorizontal: 12,
        paddingVertical: 2,
        borderRadius: 10,
        marginTop: -4,
    },
    bgGreen: { backgroundColor: '#2E7D32' },
    bgRed: { backgroundColor: '#C62828' },
    deltaText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#003E85',
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: '#29B6F6', // Light Blue Highlight
    },
    tabText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    questionCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 0, // Reset padding for inner structure
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        overflow: 'hidden'
    },
    questionMain: {
        padding: 16,
        paddingBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    questionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        flex: 1,
        marginRight: 10
    },
    pointsPill: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DBEAFE'
    },
    pointsPillText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1D4ED8'
    },
    comparisonContainer: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        backgroundColor: '#F9FAFB'
    },
    comparisonBox: {
        flex: 1,
        padding: 12
    },
    comparisonLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#9CA3AF',
        marginBottom: 6,
        letterSpacing: 0.5
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 6
    },
    bgGreenLight: { backgroundColor: '#ECFDF5' },
    bgRedLight: { backgroundColor: '#FEF2F2' },
    statusText: {
        marginLeft: 6,
        fontWeight: '600',
        fontSize: 13
    },
    textGreen: { color: '#10B981' },
    textRed: { color: '#EF4444' },
    obsText: {
        fontSize: 12,
        color: '#6B7280',
        fontStyle: 'italic',
        marginTop: 4
    },
    toggleWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        padding: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    validationLabelSmall: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4
    },
    findingContainer: {
        padding: 16,
        backgroundColor: '#FEF2F2',
        borderTopWidth: 1,
        borderTopColor: '#FCA5A5'
    },
    findingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10
    },
    findingTitle: {
        color: '#DC2626',
        fontWeight: 'bold',
        fontSize: 13
    },
    findingInput: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: 8,
        padding: 10,
        fontSize: 13,
        minHeight: 60,
        textAlignVertical: 'top',
        marginBottom: 12
    },
    evidenceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DBEAFE',
        borderStyle: 'dashed'
    },
    evidenceButtonText: {
        color: '#003E85',
        fontWeight: '600',
        fontSize: 13
    },
    evidenceThumbnailBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        backgroundColor: '#FFF',
        borderRadius: 8,
        padding: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    evidenceThumbnail: {
        width: 40,
        height: 40,
        borderRadius: 4,
        marginRight: 10,
        backgroundColor: '#F3F4F6'
    },
    removeEvidenceBtn: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#9CA3AF',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 'auto'
    },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    saveButton: {
        backgroundColor: '#000',
        borderRadius: 12,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveIcon: {
        width: 20,
        height: 20,
        tintColor: '#FFF',
        marginRight: 8,
    },
    saveText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },

    uploadModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadModalContent: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 24,
        width: '85%',
        maxWidth: 350,
    },
    uploadModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 4,
    },
    uploadModalSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 20,
    },
    uploadOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        marginBottom: 12,
    },
    uploadOptionIcon: {
        fontSize: 24,
        marginRight: 16,
    },
    uploadOptionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    uploadCancelButton: {
        marginTop: 8,
        padding: 16,
        alignItems: 'center',
    },
    uploadCancelText: {
        fontSize: 16,
        color: '#EF4444',
        fontWeight: '600',
    },
});
