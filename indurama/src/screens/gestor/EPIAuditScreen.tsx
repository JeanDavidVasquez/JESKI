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
    uploadSupplierEvidence,
} from '../../services/imagePickerService';
import { useResponsive } from '../../styles/responsive';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

// --- INTERFACES ---

interface EPIAuditScreenProps {
    submissionId: string;
    supplierId: string;
    gestorId: string;
    onNavigateBack?: () => void;
    onApproved?: () => void;
}

// Nuevo estado para controlar cada ítem
interface AuditItemState {
    status: 'pending' | 'valid' | 'invalid';
    finding: string;
    evidenceUrl?: string;
}

export const EPIAuditScreen: React.FC<EPIAuditScreenProps> = ({
    submissionId,
    supplierId,
    gestorId,
    onNavigateBack,
    onApproved
}) => {
    const { isDesktopView } = useResponsive();
    const [loading, setLoading] = useState(true);
    const [submission, setSubmission] = useState<any>(null);
    const [supplierData, setSupplierData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'calidad' | 'abastecimiento'>('calidad');
    const [processing, setProcessing] = useState(false);
    const [epiConfig, setEpiConfig] = useState<any>(null);

    // Upload State
    const [uploadingQuestion, setUploadingQuestion] = useState<string | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);

    // EPI Expiration Control State
    const [expirationDate, setExpirationDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [canRecalibrate, setCanRecalibrate] = useState(true);
    const [currentExpiresAt, setCurrentExpiresAt] = useState<Date | null>(null);

    // Audit State: Map questionId -> AuditItemState
    const [auditState, setAuditState] = useState<Record<string, AuditItemState>>({});

    useEffect(() => {
        loadData();
    }, [submissionId, supplierId]);

    const loadData = async () => {
        try {
            setLoading(true);

            // 1. Config
            const config = await EpiService.getEpiConfig();
            setEpiConfig(config);

            // 2. Submission
            let subData: any = null;

            if (submissionId) {
                const subDoc = await getDoc(doc(db, 'epi_submissions', submissionId));
                if (subDoc.exists()) {
                    subData = { id: subDoc.id, ...subDoc.data() };
                }
            }

            // Fallback to supplier_evaluations
            if (!subData) {
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
                }
            }

            if (subData) {
                setSubmission(subData);

                // --- INICIALIZACIÓN DEL ESTADO DE AUDITORÍA ---
                // Si ya existe una auditoría guardada (auditValidations), la cargamos.
                // Si NO, inicializamos todo en 'pending'.
                if (subData.auditValidations && Object.keys(subData.auditValidations).length > 0) {
                    setAuditState(subData.auditValidations);
                } else {
                    const initialAudit: Record<string, AuditItemState> = {};
                    [...(subData.qualityResponses || []), ...(subData.supplyResponses || [])].forEach((r: any) => {
                        // Inicializamos PENDIENTE, sin importar lo que dijo el proveedor
                        initialAudit[r.questionId] = {
                            status: 'pending',
                            finding: '',
                            evidenceUrl: null
                        };
                    });
                    setAuditState(initialAudit);
                }

                // Check Expiration Logic
                const expiresAt = subData.expiresAt?.toDate?.() || null;
                setCurrentExpiresAt(expiresAt);
                if (expiresAt && subData.status === 'approved') {
                    const now = new Date();
                    setCanRecalibrate(expiresAt < now);
                } else {
                    setCanRecalibrate(true);
                }
            }

            // 3. Supplier Data
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

    // --- CÁLCULO DE PUNTAJES EN TIEMPO REAL ---
    const scores = useMemo(() => {
        if (!submission || !epiConfig) return { originalScore: 0, auditScore: 0, delta: 0 };

        // 1. Score Original (Autoevaluación)
        let originalScore = submission.calculatedScore || 0;
        if (originalScore === 0) {
            const qualityResponses = submission.qualityResponses || [];
            const supplyResponses = submission.supplyResponses || [];
            const qualityTotal = Math.max(qualityResponses.length, 1);
            const supplyTotal = Math.max(supplyResponses.length, 1);

            const qualityYesCount = qualityResponses.filter((r: any) =>
                ['SI', 'CUMPLE', 'TRUE'].includes((r.answer || '').toUpperCase())
            ).length;
            const supplyYesCount = supplyResponses.filter((r: any) =>
                ['SI', 'CUMPLE', 'TRUE'].includes((r.answer || '').toUpperCase())
            ).length;

            const calidadScore = (qualityYesCount / qualityTotal) * 100;
            const abastecimientoScore = (supplyYesCount / supplyTotal) * 100;
            originalScore = (calidadScore + abastecimientoScore) / 2;
        }

        // 2. Score Auditoría (Solo cuenta los 'valid')
        const calcSectionAuditScore = (category: 'calidad' | 'abastecimiento'): number => {
            if (!epiConfig[category]) return 0;
            const sections = epiConfig[category].sections;
            let validCount = 0;
            let totalQuestions = 0;

            sections.forEach((section: any) => {
                section.questions.forEach((q: any) => {
                    totalQuestions++;
                    const audit = auditState[q.id];
                    // IMPORTANTE: Pending e Invalid valen 0. Solo Valid suma.
                    if (audit && audit.status === 'valid') {
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

    // --- HANDLERS ---

    const handleSetStatus = (questionId: string, status: 'valid' | 'invalid') => {
        setAuditState(prev => ({
            ...prev,
            [questionId]: { ...prev[questionId], status: status }
        }));
    };

    const handleFindingChange = (questionId: string, text: string) => {
        setAuditState(prev => ({
            ...prev,
            [questionId]: { ...prev[questionId], finding: text }
        }));
    };

    // --- UPLOAD HANDLERS ---
    const handleEvidenceUpload = (questionId: string) => {
        setCurrentQuestionId(questionId);
        setShowUploadModal(true);
    };

    const performUpload = async (sourceFn: () => Promise<any>) => {
        if (!currentQuestionId) return;
        const questionId = currentQuestionId;
        setShowUploadModal(false);

        try {
            setUploadingQuestion(questionId);
            const file = await sourceFn();
            if (file) {
                const url = await uploadSupplierEvidence(
                    supplierId,
                    'evidence',
                    `audit_${questionId}_${Date.now()}`,
                    file.uri,
                    file.name
                );
                setAuditState(prev => ({
                    ...prev,
                    [questionId]: { ...prev[questionId], evidenceUrl: url }
                }));
            }
        } catch (error) {
            console.error('Error uploading:', error);
        } finally {
            setUploadingQuestion(null);
        }
    };

    // --- GUARDAR AUDITORÍA ---
    const handleSaveAudit = async () => {
        try {
            setProcessing(true);

            // 1. Validar Pendientes
            const pendingItems = Object.entries(auditState).filter(([_, state]) => state.status === 'pending');
            if (pendingItems.length > 0) {
                Alert.alert('Auditoría Incompleta', `Quedan ${pendingItems.length} preguntas sin validar. Por favor revise todos los ítems.`);
                setProcessing(false);
                return;
            }

            // 2. Validar Hallazgos
            const invalidItems = Object.entries(auditState).filter(([_, state]) => state.status === 'invalid' && !state.finding.trim());
            if (invalidItems.length > 0) {
                Alert.alert('Faltan Observaciones', 'Debe ingresar el motivo del rechazo para todos los ítems marcados como "No Cumple".');
                setProcessing(false);
                return;
            }

            // 3. Calcular Score Final
            const calculateFinalCatScore = (category: 'calidad' | 'abastecimiento') => {
                if (!epiConfig) return 0;
                const sections = epiConfig[category].sections;
                let totalScore = 0;
                let maxPossible = 0;
                sections.forEach((section: any) => {
                    section.questions.forEach((q: any) => {
                        const points = category === 'calidad' ? 5 : 5.5;
                        const audit = auditState[q.id];
                        if (audit && audit.status === 'valid') totalScore += points;
                        maxPossible += points;
                    });
                });
                return maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0;
            };

            const calidadScore = calculateFinalCatScore('calidad');
            const abastecimientoScore = calculateFinalCatScore('abastecimiento');
            const newCalculatedScore = Math.round((calidadScore + abastecimientoScore) / 2);
            const newClassification = ScoringService.getClassification(newCalculatedScore);

            // 4. Guardar en Firebase
            const submissionRef = doc(db, 'epi_submissions', submissionId);
            await updateDoc(submissionRef, {
                calculatedScore: newCalculatedScore,
                calidadScore: Math.round(calidadScore),
                abastecimientoScore: Math.round(abastecimientoScore),
                classification: newClassification,
                auditValidations: auditState,
                auditedAt: new Date().toISOString(),
                auditedBy: gestorId,
            });

            // 5. Notificar / Aprobar / Rechazar
            if (newClassification === 'SALIR') {
                await SupplierResponseService.rejectEPI(
                    submissionId,
                    supplierId,
                    gestorId,
                    `Auditoría Completada: Clasificación SALIR. Score: ${newCalculatedScore}`
                );
                Alert.alert('Rechazado', 'El proveedor ha sido calificado como SALIR.');
            } else {
                await SupplierResponseService.approveEPI(
                    submissionId,
                    supplierId,
                    gestorId,
                    `Auditoría Completada: Clasificación ${newClassification}. Score: ${newCalculatedScore}`,
                    expirationDate || undefined,
                    newCalculatedScore,
                    newClassification
                );
                Alert.alert('Aprobado', `El proveedor ha sido calificado como ${newClassification}.`);
            }

            onApproved?.();

        } catch (error) {
            console.error('Error saving audit:', error);
            Alert.alert('Error', 'No se pudo guardar la auditoría');
        } finally {
            setProcessing(false);
        }
    };

    // --- RENDER ---
    const renderQuestionList = (category: 'calidad' | 'abastecimiento') => {
        if (!epiConfig || !epiConfig[category]) return <ActivityIndicator />;

        const sections = epiConfig[category].sections;
        const responses = category === 'calidad' ? submission?.qualityResponses : submission?.supplyResponses;

        return (
            <View style={isDesktopView ? { width: '100%', alignItems: 'center' } : undefined}>
                {sections.map((section: any, i: number) => (
                    <View key={i} style={[isDesktopView && { width: '100%', maxWidth: 1200, alignSelf: 'center' }]}>
                        <View style={isDesktopView ? { flexDirection: 'row', flexWrap: 'wrap', gap: 16 } : undefined}>
                            {section.questions.map((q: any, j: number) => {
                                const answerObj = responses?.find((r: any) => r.questionId === q.id);
                                const answerText = (answerObj?.answer || '').toUpperCase();
                                const isYes = ['SI', 'CUMPLE', 'TRUE'].includes(answerText);

                                // Estado Actual
                                const audit = auditState[q.id] || { status: 'pending', finding: '' };
                                const isPending = audit.status === 'pending';
                                const isValid = audit.status === 'valid';

                                return (
                                    <View key={j} style={[styles.questionCard, isDesktopView && { width: '48%', marginBottom: 0 }]}>
                                        <View style={styles.questionMain}>
                                            <Text style={styles.questionTitle}>{q.text}</Text>
                                            <View style={styles.pointsPill}>
                                                <Text style={styles.pointsPillText}>{category === 'calidad' ? '5.0' : '5.5'} pts</Text>
                                            </View>
                                        </View>

                                        {/* Comparación */}
                                        <View style={styles.comparisonContainer}>
                                            {/* Lado Proveedor */}
                                            <View style={styles.comparisonBox}>
                                                <Text style={styles.comparisonLabel}>PROVEEDOR</Text>
                                                <View style={[styles.statusBadge, isYes ? styles.bgGreenLight : styles.bgRedLight]}>
                                                    <Ionicons name={isYes ? "checkmark-circle" : "close-circle"} size={16} color={isYes ? "#10B981" : "#EF4444"} />
                                                    <Text style={[styles.statusText, isYes ? styles.textGreen : styles.textRed]}>
                                                        {isYes ? 'Cumple' : 'No Cumple'}
                                                    </Text>
                                                </View>
                                                {answerObj?.observation && (
                                                    <Text style={styles.obsText} numberOfLines={2}>"{answerObj.observation}"</Text>
                                                )}
                                            </View>

                                            <View style={{ justifyContent: 'center', paddingHorizontal: 8 }}>
                                                <Ionicons name="arrow-forward" size={20} color="#CBD5E1" />
                                            </View>

                                            {/* Lado Auditoría (ACTUALIZADO) */}
                                            <View style={styles.comparisonBox}>
                                                <Text style={styles.comparisonLabel}>AUDITORÍA</Text>

                                                {isPending ? (
                                                    <View style={styles.pendingActions}>
                                                        <View style={styles.pendingBadge}>
                                                            <Text style={styles.pendingText}>Pendiente</Text>
                                                        </View>
                                                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                                                            <TouchableOpacity
                                                                style={[styles.actionBtn, styles.btnValid]}
                                                                onPress={() => handleSetStatus(q.id, 'valid')}
                                                            >
                                                                <Ionicons name="checkmark" size={16} color="#FFF" />
                                                                <Text style={styles.btnText}>Validar</Text>
                                                            </TouchableOpacity>

                                                            <TouchableOpacity
                                                                style={[styles.actionBtn, styles.btnInvalid]}
                                                                onPress={() => handleSetStatus(q.id, 'invalid')}
                                                            >
                                                                <Ionicons name="alert-circle" size={16} color="#FFF" />
                                                                <Text style={styles.btnText}>Obs.</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                ) : (
                                                    <View style={styles.toggleWrapper}>
                                                        <Text style={[styles.validationLabelSmall, !isValid ? styles.textRed : { color: '#64748B' }]}>
                                                            {isValid ? 'Validado' : 'Rechazado'}
                                                        </Text>
                                                        <Switch
                                                            trackColor={{ false: "#FECACA", true: "#BBF7D0" }}
                                                            thumbColor={isValid ? "#16A34A" : "#DC2626"}
                                                            ios_backgroundColor="#FECACA"
                                                            onValueChange={(val) => handleSetStatus(q.id, val ? 'valid' : 'invalid')}
                                                            value={isValid}
                                                            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                                                        />
                                                    </View>
                                                )}
                                            </View>
                                        </View>

                                        {/* Hallazgo input (Solo si es inválido) */}
                                        {audit.status === 'invalid' && (
                                            <View style={styles.findingContainer}>
                                                <View style={styles.findingHeader}>
                                                    <Ionicons name="alert-circle" size={20} color="#DC2626" style={{ marginRight: 6 }} />
                                                    <Text style={styles.findingTitle}>Hallazgo de Auditoría (0 Puntos)</Text>
                                                </View>

                                                <TextInput
                                                    style={styles.findingInput}
                                                    placeholder="Describa el motivo del rechazo..."
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
                                                                [q.id]: { ...prev[q.id], evidenceUrl: null }
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
            <View style={[styles.scoreContainer, isDesktopView && { width: '100%', maxWidth: 1200, alignSelf: 'center', borderRadius: 16, marginBottom: 20 }]}>
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
                <View style={[styles.footerInner, isDesktopView && { maxWidth: 1200, alignSelf: 'center', width: '100%' }]}>
                    <TouchableOpacity
                        style={styles.datePickerCompact}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Ionicons name="calendar-outline" size={18} color="#003E85" />
                        <Text style={[styles.datePickerCompactText, !expirationDate && { color: '#9CA3AF' }]} numberOfLines={1}>
                            {expirationDate
                                ? expirationDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                                : 'Fecha control...'}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color="#64748B" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.saveButton, !canRecalibrate && styles.saveButtonDisabled]}
                        onPress={handleSaveAudit}
                        disabled={processing || !canRecalibrate}
                    >
                        {processing ? <ActivityIndicator color="#FFF" /> : (
                            <>
                                <Image source={require('../../../assets/icons/check.png')} style={styles.saveIcon} />
                                <Text style={styles.saveText}>
                                    {canRecalibrate ? 'Terminar Auditoría' : 'Vigente'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Date Picker Modal */}
            {showDatePicker && (
                Platform.OS === 'web' ? (
                    <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
                        <View style={styles.uploadModalOverlay}>
                            <View style={styles.uploadModalContent}>
                                <Text style={styles.uploadModalTitle}>Fecha de Próximo Control</Text>
                                <input
                                    type="date"
                                    min={new Date().toISOString().split('T')[0]}
                                    style={{
                                        padding: 12, fontSize: 16, borderRadius: 8, border: '1px solid #CBD5E1', width: '100%', marginTop: 16,    // Corregido: Usar marginTop
                                        marginBottom: 16
                                    }}
                                    onChange={(e: any) => {
                                        if (e.target.value) setExpirationDate(new Date(e.target.value));
                                    }}
                                />
                                <TouchableOpacity style={[styles.uploadCancelButton, { backgroundColor: '#003E85' }]} onPress={() => setShowDatePicker(false)}>
                                    <Text style={[styles.uploadCancelText, { color: '#FFF' }]}>Confirmar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                ) : (
                    <DateTimePicker
                        value={expirationDate || new Date()}
                        mode="date"
                        display="default"
                        minimumDate={new Date()}
                        onChange={(event: any, selectedDate?: Date) => {
                            setShowDatePicker(false);
                            if (selectedDate) setExpirationDate(selectedDate);
                        }}
                    />
                )
            )}

            {/* Upload Options Modal */}
            <Modal visible={showUploadModal} transparent animationType="fade" onRequestClose={() => setShowUploadModal(false)}>
                <View style={styles.uploadModalOverlay}>
                    <View style={styles.uploadModalContent}>
                        <Text style={styles.uploadModalTitle}>Subir Evidencia</Text>
                        <TouchableOpacity style={styles.uploadOption} onPress={() => performUpload(takePhoto)}>
                            <Text style={styles.uploadOptionIcon}>📷</Text>
                            <Text style={styles.uploadOptionText}>Tomar Foto</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.uploadOption} onPress={() => performUpload(pickFromGallery)}>
                            <Text style={styles.uploadOptionIcon}>🖼️</Text>
                            <Text style={styles.uploadOptionText}>Desde Galería</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.uploadOption} onPress={() => performUpload(pickDocument)}>
                            <Text style={styles.uploadOptionIcon}>📄</Text>
                            <Text style={styles.uploadOptionText}>Seleccionar Archivo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.uploadCancelButton} onPress={() => setShowUploadModal(false)}>
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
        backgroundColor: '#003E85',
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
        backgroundColor: '#1565C0',
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
        borderBottomColor: '#29B6F6',
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
    // Nuevos estilos para estado pendiente
    pendingActions: {
        alignItems: 'flex-start',
    },
    pendingBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    pendingText: {
        fontSize: 10,
        color: '#6B7280',
        fontWeight: '600',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    btnValid: {
        backgroundColor: '#10B981',
    },
    btnInvalid: {
        backgroundColor: '#EF4444',
    },
    btnText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: 'bold',
        marginLeft: 4,
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
        marginRight: 8
    },
    removeEvidenceBtn: {
        backgroundColor: '#EF4444',
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center'
    },
    footer: {
        backgroundColor: '#FFF',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    footerInner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    datePickerCompact: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#CBD5E1',
    },
    datePickerCompactText: {
        fontSize: 13,
        color: '#0F172A',
        flex: 1,
        marginLeft: 8,
        marginRight: 8,
    },
    saveButton: {
        flex: 1.2,
        backgroundColor: '#003E85',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: '#94A3B8',
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
        fontSize: 14,
    },
    uploadModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    uploadModalContent: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 320,
    },
    uploadModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 4,
        textAlign: 'center',
    },
    uploadModalSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 20,
        textAlign: 'center',
    },
    uploadOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        marginBottom: 12,
    },
    uploadOptionIcon: {
        fontSize: 24,
        marginRight: 16,
    },
    uploadOptionText: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
    },
    uploadCancelButton: {
        marginTop: 8,
        padding: 12,
        alignItems: 'center',
    },
    uploadCancelText: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default EPIAuditScreen;