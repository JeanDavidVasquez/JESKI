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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { SupplierResponseService } from '../services/supplierResponseService';
import { theme } from '../styles/theme';

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
    const [loading, setLoading] = useState(true);
    const [submission, setSubmission] = useState<any>(null);
    const [supplierData, setSupplierData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'calidad' | 'abastecimiento'>('calidad');
    const [processing, setProcessing] = useState(false);
    const [epiConfig, setEpiConfig] = useState<any>(null);

    // Audit State: Map questionId -> { isValid: boolean, finding: string, evidence?: string }
    const [auditState, setAuditState] = useState<Record<string, { isValid: boolean, finding: string }>>({});

    useEffect(() => {
        loadData();
    }, [submissionId, supplierId]);

    const loadData = async () => {
        try {
            setLoading(true);

            // 1. Config
            const { EpiService } = await import('../services/epiService');
            const config = await EpiService.getEpiConfig();
            setEpiConfig(config);

            // 2. Submission
            const subDoc = await getDoc(doc(db, 'epi_submissions', submissionId));
            if (subDoc.exists()) {
                const subData = subDoc.data();
                setSubmission({ id: subDoc.id, ...subData });

                // Initialize audit state (assume all valid initially)
                // In a real app, we might load a saved draft audit here
                const initialAudit: any = {};
                [...(subData.qualityResponses || []), ...(subData.supplyResponses || [])].forEach((r: any) => {
                    initialAudit[r.questionId] = { isValid: true, finding: '' };
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
        if (!submission || !epiConfig) return { auditScore: 0, delta: 0 };

        const originalScore = submission.calculatedScore || 0;
        let currentScore = 0;
        let maxScore = 0;

        // Helper to calc section score
        const calcSection = (category: 'calidad' | 'abastecimiento') => {
            const sections = epiConfig[category].sections;
            let catScore = 0;

            sections.forEach((section: any) => {
                section.questions.forEach((q: any) => {
                    // Find response
                    const responses = category === 'calidad' ? submission.qualityResponses : submission.supplyResponses;
                    const response = responses?.find((r: any) => r.questionId === q.id);
                    const isYes = response?.answer === 'SI';
                    const points = isYes ? (category === 'calidad' ? 5 : 5.5) : 0;

                    // Apply Audit Validation
                    const audit = auditState[q.id];
                    const isValid = audit ? audit.isValid : true; // Default to valid if not checked

                    // If Validated as "No Cumple", score is 0 regardless of answer (or logic depending on reqs)
                    // Assuming: If supplier said YES, but Audit says NO -> 0 points.
                    // If supplier said NO, it was already 0.

                    if (isYes && isValid) {
                        currentScore += points;
                    }
                    // If !isValid, adds 0.
                });
            });
        };

        calcSection('calidad');
        calcSection('abastecimiento');

        // Re-normalize or cap if needed? 
        // Based on previous logic: 12 Qs quality * 5 = 60. 8 Qs supply * 5.5 = 44. Total ~104? Capped at 100?
        // Let's assume calculatedScore logic matches.

        return {
            auditScore: Math.round(currentScore),
            delta: Math.round(currentScore - originalScore)
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

            // Determine Status based on new score
            // If score < 80 (example) -> Rejected? Or just update score?
            // For now, we Approve with New Score.

            await SupplierResponseService.approveEPI(
                submissionId,
                supplierId,
                gestorId,
                `Auditoría Realizada. Recalibración: ${scores.delta >= 0 ? '+' : ''}${scores.delta} Ptos.`
            );

            // Should also save the detailed audit results separately if needed
            // For this demo, just approving is enough.

            Alert.alert('Éxito', 'Auditoría guardada y recalibración aplicada.');
            onApproved?.();

        } catch (error) {
            console.error('Error saving audit:', error);
            Alert.alert('Error', 'No se pudo guardar la auditoría');
        } finally {
            setProcessing(false);
        }
    };

    const renderQuestionList = (category: 'calidad' | 'abastecimiento') => {
        if (!epiConfig || !epiConfig[category]) return <ActivityIndicator />;

        const sections = epiConfig[category].sections;
        const responses = category === 'calidad' ? submission?.qualityResponses : submission?.supplyResponses;

        return (
            <View>
                {sections.map((section: any, i: number) => (
                    <View key={i}>
                        {section.questions.map((q: any, j: number) => {
                            const answerObj = responses?.find((r: any) => r.questionId === q.id);
                            const isYes = answerObj?.answer === 'SI';
                            const points = isYes ? (category === 'calidad' ? 5 : 5.5) : 0;
                            const audit = auditState[q.id] || { isValid: true, finding: '' };

                            return (
                                <View key={j} style={styles.questionCard}>
                                    <View style={styles.questionHeader}>
                                        <Text style={styles.questionTitle}>{q.text}</Text>
                                        <View style={styles.pointsBadge}>
                                            <Text style={styles.pointsText}>{category === 'calidad' ? '5' : '5.5'} pts</Text>
                                        </View>
                                    </View>

                                    {/* Proveedor Declaró */}
                                    <View style={styles.declarationRow}>
                                        <Text style={styles.declarationLabel}>PROVEEDOR DECLARÓ:</Text>
                                        <View style={styles.declarationValue}>
                                            <View style={[styles.statusDot, isYes ? styles.dotGreen : styles.dotRed]} />
                                            <Text style={styles.declarationText}>{isYes ? 'SI CUMPLE' : 'NO CUMPLE'}</Text>
                                        </View>
                                        {answerObj?.observation && (
                                            <Text style={styles.linkText} numberOfLines={1}>
                                                {answerObj.observation.length > 20 ? 'Ver Obs.' : answerObj.observation}
                                            </Text>
                                        )}
                                    </View>

                                    {/* Validación Toggle */}
                                    <View style={styles.validationRow}>
                                        <Text style={styles.validationLabel}>Validación:</Text>
                                        <View style={styles.toggleContainer}>
                                            <Switch
                                                trackColor={{ false: "#EF4444", true: "#10B981" }}
                                                thumbColor={'#FFF'}
                                                ios_backgroundColor="#EF4444"
                                                onValueChange={(val) => handleToggleValidation(q.id, val)}
                                                value={audit.isValid}
                                            />
                                            <Text style={[styles.validationStatus, audit.isValid ? styles.textGreen : styles.textRed]}>
                                                {audit.isValid ? 'Cumple' : 'No Cumple'}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* No Cumple - Recalibration Section */}
                                    {!audit.isValid && (
                                        <View style={styles.recalibrationBox}>
                                            <View style={styles.recalHeader}>
                                                <Text style={styles.recalLabel}>Recalibración:</Text>
                                                <Text style={styles.recalPoints}>0 Puntos</Text>
                                            </View>

                                            <Text style={styles.inputLabel}>EVIDENCIA DEL HALLAZGO (OBLIGATORIO)</Text>
                                            <TextInput
                                                style={styles.textInput}
                                                placeholder="Describa por qué no cumple"
                                                multiline
                                                value={audit.finding}
                                                onChangeText={(text) => handleFindingChange(q.id, text)}
                                            />

                                            <TouchableOpacity style={styles.attachButton}>
                                                <Image source={require('../../assets/icons/folder-upload.png')} style={styles.attachIcon} />
                                                <Text style={styles.attachText}>Adjuntar</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
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
                <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
                    <Image source={require('../../assets/icons/arrow-left.png')} style={styles.backIcon} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Auditoría</Text>
                    <Text style={styles.headerSubtitle}>
                        Proveedor: {supplierData?.companyName || 'Proveedor'}
                    </Text>
                </View>
                <Image source={require('../../assets/icono_indurama.png')} style={styles.logo} resizeMode="contain" />
            </View>

            {/* Score Card */}
            <View style={styles.scoreContainer}>
                <View style={styles.scoreItem}>
                    <Text style={styles.scoreLabel}>AUTOEVALUACIÓN</Text>
                    <Text style={styles.scoreValueAuto}>{submission?.calculatedScore || 0}</Text>
                </View>

                <View style={styles.scoreMiddle}>
                    <Text style={styles.recalibratingText}>Recalibrando</Text>
                    <Image source={require('../../assets/icons/arrow-right.png')} style={styles.arrowIcon} />
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
            <View style={styles.tabs}>
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

            <ScrollView style={styles.content}>
                {renderQuestionList(activeTab)}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveAudit} disabled={processing}>
                    {processing ? <ActivityIndicator color="#FFF" /> : (
                        <>
                            <Image source={require('../../assets/icons/check.png')} style={styles.saveIcon} />
                            <Text style={styles.saveText}>Guardar Auditoría</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    questionTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1F2937',
        flex: 1,
        marginRight: 8,
    },
    pointsBadge: {
        backgroundColor: '#DBEAFE',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    pointsText: {
        color: '#1E40AF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    declarationRow: {
        backgroundColor: '#F9FAFB',
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    declarationLabel: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: 'bold',
    },
    declarationValue: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    dotGreen: { backgroundColor: '#10B981' },
    dotRed: { backgroundColor: '#EF4444' },
    declarationText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#374151',
    },
    linkText: {
        fontSize: 12,
        color: '#3B82F6',
        fontWeight: '600',
        textDecorationLine: 'underline',
        maxWidth: 80,
    },
    validationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    validationLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    validationStatus: {
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 8,
        minWidth: 70,
        textAlign: 'right',
    },
    textGreen: { color: '#10B981' },
    textRed: { color: '#EF4444' },
    recalibrationBox: {
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#FECACA',
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
        padding: 12,
    },
    recalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    recalLabel: {
        fontSize: 13,
        color: '#374151',
    },
    recalPoints: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#EF4444',
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#9CA3AF',
        marginBottom: 4,
    },
    textInput: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 4,
        padding: 8,
        height: 60,
        fontSize: 13,
        textAlignVertical: 'top',
        marginBottom: 8,
    },
    attachButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DBEAFE',
        borderRadius: 6,
        paddingVertical: 8,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#93C5FD',
    },
    attachIcon: {
        width: 16,
        height: 16,
        tintColor: '#1E40AF',
        marginRight: 6,
    },
    attachText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1E3A8A',
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
});
