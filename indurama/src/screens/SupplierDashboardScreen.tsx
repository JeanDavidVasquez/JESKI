import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { SupplierResponseService } from '../services/supplierResponseService';
import { ScoringService } from '../services/scoringService';

interface SupplierDashboardScreenProps {
    onNavigateBack?: () => void;
    onNavigateToQuality?: () => void;
    onNavigateToSupply?: () => void;
}

export const SupplierDashboardScreen: React.FC<SupplierDashboardScreenProps> = ({
    onNavigateBack,
    onNavigateToQuality,
    onNavigateToSupply
}) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [evaluation, setEvaluation] = useState<any>(null);
    const [calidadScore, setCalidadScore] = useState(0);
    const [abastecimientoScore, setAbastecimientoScore] = useState(0);
    const [globalScore, setGlobalScore] = useState(0);
    const [classification, setClassification] = useState<any>(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const eval = await SupplierResponseService.getSupplierEvaluation(user.id);

            if (eval) {
                setEvaluation(eval);
                setCalidadScore(eval.calidadScore || 0);
                setAbastecimientoScore(eval.abastecimientoScore || 0);

                const global = ScoringService.calculateGlobalScore(
                    eval.calidadScore || 0,
                    eval.abastecimientoScore || 0
                );
                setGlobalScore(global);

                const classif = ScoringService.getClassification(global);
                setClassification(classif);

                setProgress(eval.progress || 0);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderCircularProgress = (score: number, label: string, color: string) => {
        const size = 120;
        const strokeWidth = 12;
        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const progress = (score / 100) * circumference;

        return (
            <View style={styles.circularContainer}>
                <View style={styles.circularProgress}>
                    {/* Background circle */}
                    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, borderWidth: strokeWidth, borderColor: '#E5E7EB' }]} />
                    {/* Progress arc - simplified as overlay */}
                    <View style={[styles.circleOverlay, { width: size, height: size, borderRadius: size / 2 }]}>
                        <Text style={styles.scoreText}>{Math.round(score)}</Text>
                        <Text style={styles.scoreMax}>/100</Text>
                    </View>
                </View>
                <Text style={styles.scoreLabel}>{label}</Text>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#004CA3" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                {onNavigateBack && (
                    <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
                        <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
                    </TouchableOpacity>
                )}
                <Text style={styles.headerTitle}>Mi Evaluación EPI</Text>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Global Score Card */}
                <View style={styles.globalCard}>
                    <Text style={styles.globalTitle}>Score Global</Text>
                    <Text style={styles.globalScore}>{Math.round(globalScore)}<Text style={styles.globalMax}>/100</Text></Text>

                    {classification && (
                        <View style={[styles.classificationBadge, { backgroundColor: ScoringService.getClassificationColor(classification.level) }]}>
                            <MaterialCommunityIcons
                                name={classification.level === 'CRECER' ? 'arrow-up-circle' : classification.level === 'MEJORAR' ? 'alert-circle' : 'close-circle'}
                                size={20}
                                color="#fff"
                            />
                            <Text style={styles.classificationText}>{classification.level}</Text>
                        </View>
                    )}

                    <Text style={styles.classificationDesc}>
                        {classification?.description || 'Completa tu evaluación para obtener tu clasificación'}
                    </Text>
                </View>

                {/* Progress */}
                <View style={styles.progressCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={styles.progressLabel}>Progreso de Evaluación</Text>
                        <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
                    </View>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                </View>

                {/* Scores by Category */}
                <View style={styles.scoresContainer}>
                    <TouchableOpacity onPress={onNavigateToQuality} style={styles.scoreCard}>
                        {renderCircularProgress(calidadScore, 'Calidad', '#10B981')}
                        <MaterialCommunityIcons name="chevron-right" size={24} color="#6B7280" style={{ marginTop: 40 }} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onNavigateToSupply} style={styles.scoreCard}>
                        {renderCircularProgress(abastecimientoScore, 'Abastecimiento', '#3B82F6')}
                        <MaterialCommunityIcons name="chevron-right" size={24} color="#6B7280" style={{ marginTop: 40 }} />
                    </TouchableOpacity>
                </View>

                {/* Actions */}
                {progress < 100 && (
                    <View style={styles.actionsCard}>
                        <Text style={styles.actionsTitle}>Acciones Pendientes</Text>
                        <Text style={styles.actionsDesc}>Completa todos los cuestionarios para obtener tu clasificación final</Text>

                        {calidadScore < 100 && (
                            <TouchableOpacity style={styles.actionButton} onPress={onNavigateToQuality}>
                                <MaterialCommunityIcons name="clipboard-text-outline" size={20} color="#004CA3" />
                                <Text style={styles.actionButtonText}>Completar Cuestionario de Calidad</Text>
                            </TouchableOpacity>
                        )}

                        {abastecimientoScore < 100 && (
                            <TouchableOpacity style={styles.actionButton} onPress={onNavigateToSupply}>
                                <MaterialCommunityIcons name="package-variant" size={20} color="#004CA3" />
                                <Text style={styles.actionButtonText}>Completar Cuestionario de Abastecimiento</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#004CA3',
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    globalCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        marginBottom: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    globalTitle: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 8,
    },
    globalScore: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    globalMax: {
        fontSize: 24,
        color: '#9CA3AF',
    },
    classificationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 16,
    },
    classificationText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    classificationDesc: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 12,
    },
    progressCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    progressLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    progressPercent: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#004CA3',
    },
    progressBar: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#004CA3',
        borderRadius: 4,
    },
    scoresContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    scoreCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    circularContainer: {
        alignItems: 'center',
    },
    circularProgress: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    circle: {
        position: 'absolute',
    },
    circleOverlay: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    scoreMax: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    scoreLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginTop: 12,
    },
    actionsCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
    },
    actionsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    actionsDesc: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 16,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#EFF6FF',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#004CA3',
        flex: 1,
    },
});

export default SupplierDashboardScreen;
