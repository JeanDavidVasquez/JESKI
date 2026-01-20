import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Image,
    Dimensions,
    Platform,
    Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ResponsiveNavShell } from '../../components/ResponsiveNavShell';
import { useAuth } from '../../hooks/useAuth';
import { getUserRequests, getUserRequestStats, getRelativeTime, confirmReceipt } from '../../services/requestService';
import { Request, RequestStatus } from '../../types';
import { useResponsive, BREAKPOINTS } from '../../styles/responsive';

interface SolicitanteDashboardScreenProps {
    onNavigateToNewRequest: () => void;
    onNavigateToHistory: () => void;
    onNavigateToProfile: () => void;
    onNavigateToRequestDetail?: (requestId: string) => void;
}

export const SolicitanteDashboardScreen: React.FC<SolicitanteDashboardScreenProps> = ({
    onNavigateToNewRequest,
    onNavigateToHistory,
    onNavigateToProfile,
    onNavigateToRequestDetail,
}) => {
    const { user } = useAuth();
    const { isDesktopView, isMobileView } = useResponsive();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0
    });
    const [recentRequests, setRecentRequests] = useState<Request[]>([]);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);

    const loadDashboardData = async () => {
        if (!user?.id) return;

        try {
            const [statsData, requests] = await Promise.all([
                getUserRequestStats(user.id),
                getUserRequests(user.id)
            ]);

            setStats(statsData);
            setRecentRequests(requests.slice(0, 5));
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, [user?.id]);

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboardData();
    };

    const getTimelineStatus = (status: string) => {
        switch (status) {
            case 'pending': return 1;
            case 'in_progress': return 2;
            case 'quoting':
            case 'cotizacion': return 3;
            case 'awarded':
            case 'adjudicado': return 4;
            case 'completed': return 5;
            case 'rejected': return 1;
            default: return 0;
        }
    };

    const handleConfirmReceipt = async (requestId: string) => {
        if (!user?.id) return;
        const doConfirm = async () => {
            setConfirmingId(requestId);
            try {
                await confirmReceipt(requestId, user.id);
                loadDashboardData();
                if (Platform.OS === 'web') alert('¡Recepción confirmada!');
                else Alert.alert('Éxito', '¡Recepción confirmada!');
            } catch (error) {
                console.error('Error:', error);
                if (Platform.OS === 'web') alert('Error al confirmar.');
                else Alert.alert('Error', 'No se pudo confirmar.');
            } finally {
                setConfirmingId(null);
            }
        };

        if (Platform.OS === 'web') {
            if (confirm('¿Confirmas que recibiste conforme?')) await doConfirm();
        } else {
            Alert.alert(
                'Confirmar Recepción',
                '¿Confirmas que recibiste el producto/servicio?',
                [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sí, Recibí', onPress: doConfirm }]
            );
        }
    };

    const renderTimeline = (status: string) => {
        const steps = ['Solicitado', 'Aprobación', 'Gestión', 'Orden', 'Recepción'];
        const activeStep = getTimelineStatus(status);
        const isRejected = status === 'rejected';

        // Colors
        let progressColor = '#2196F3';
        if (status === 'quoting' || status === 'cotizacion') progressColor = '#F59E0B';
        if (status === 'awarded' || status === 'adjudicado' || status === 'completed') progressColor = '#9C27B0';
        if (status === 'rejected') progressColor = '#F44336';

        // === MOBILE OPTIMIZED TIMELINE ===
        if (isMobileView) {
            const currentStepName = steps[Math.max(0, activeStep - 1)];
            const stepPercentage = Math.min((activeStep / 5) * 100, 100);

            return (
                <View style={styles.mobileTimelineWrapper}>
                    <View style={styles.mobileTimelineHeader}>
                        <Text style={styles.mobileTimelineLabel}>Etapa actual:</Text>
                        <View style={[styles.mobileStatusPill, { backgroundColor: progressColor + '20' }]}>
                            <Text style={[styles.mobileStatusText, { color: progressColor }]}>
                                {isRejected ? 'RECHAZADO' : currentStepName}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.mobileTrackBg}>
                        <View style={[
                            styles.mobileTrackFill,
                            { width: `${stepPercentage}%`, backgroundColor: progressColor }
                        ]} />
                    </View>

                    <Text style={styles.mobileStepCount}>PASO {activeStep} DE 5</Text>
                </View>
            );
        }

        // === DESKTOP TIMELINE ===
        const progressRatio = Math.max(0, Math.min((activeStep - 1) / (steps.length - 1), 1));
        return (
            <View style={styles.timelineWrapper}>
                <View style={styles.timelineContainer}>
                    <View style={styles.trackWrapper}>
                        <View style={styles.timelineBase} />
                        <View style={[styles.timelineProgress, { width: `${progressRatio * 100}%`, backgroundColor: progressColor }]} />
                    </View>

                    {steps.map((step, index) => {
                        const isActive = index < activeStep;
                        const isCurrent = index === activeStep - 1;

                        let dotColor = '#E0E0E0';
                        let activeColor = '#2196F3';

                        if (status === 'quoting' || status === 'cotizacion') activeColor = '#F59E0B';
                        if (status === 'awarded' || status === 'adjudicado' || status === 'completed') activeColor = '#9C27B0';
                        if (status === 'rejected') activeColor = '#F44336';

                        if (isActive) dotColor = activeColor;
                        if (isCurrent && status === 'pending') dotColor = '#FFA726';
                        if (isCurrent && isRejected) dotColor = '#F44336';

                        const dotSize = isCurrent ? 14 : isActive ? 12 : 10;

                        return (
                            <View key={index} style={styles.timelineStep}>
                                <View style={[
                                    styles.timelineDot,
                                    { backgroundColor: dotColor, width: dotSize, height: dotSize, borderRadius: dotSize / 2 }
                                ]} />
                                <Text style={[
                                    styles.timelineLabel,
                                    isActive || isCurrent ? styles.timelineLabelActive : null
                                ]} numberOfLines={1}>
                                    {step}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    const getStatusBadge = (status: string) => {
        let label = 'EN PROCESO';
        let color = '#2196F3';
        if (status === 'pending') { label = 'ESPERANDO APROBACIÓN'; color = '#FFA726'; }
        if (status === 'in_progress') { label = 'EN GESTIÓN'; color = '#2196F3'; }
        if (status === 'quoting' || status === 'cotizacion') { label = 'COTIZANDO'; color = '#F59E0B'; }
        if (status === 'awarded' || status === 'adjudicado') { label = 'ADJUDICADA'; color = '#9C27B0'; }
        if (status === 'completed') { label = 'LISTO / COMPRA'; color = '#4CAF50'; }
        if (status === 'rejected') { label = 'RECHAZADA'; color = '#F44336'; }
        if (status === 'rectification_required') { label = 'CORRECCIÓN REQUERIDA'; color = '#FF9800'; }

        return (
            <View style={[styles.statusBadge, { borderColor: color }]}>
                <Text style={[styles.statusText, { color: color }]}>{label}</Text>
            </View>
        );
    };

    const displayName = user?.companyName || (user?.firstName ? `${user.firstName} ${user.lastName || ''} ` : user?.email?.split('@')[0]);

    const navItems = [
        { key: 'Dashboard', label: 'Dashboard', iconName: 'home' as const, onPress: () => { } },
        { key: 'NewRequest', label: 'Nueva Solicitud', iconName: 'add-circle' as const, onPress: onNavigateToNewRequest },
        { key: 'History', label: 'Historial', iconName: 'document-text' as const, onPress: onNavigateToHistory },
        { key: 'Profile', label: 'Perfil', iconName: 'person' as const, onPress: onNavigateToProfile },
    ];

    return (
        <ResponsiveNavShell
            currentScreen="Dashboard"
            navItems={navItems}
            logo={require('../../../assets/icono_indurama.png')}
        >
            <StatusBar style="dark" />

            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Bienvenido,</Text>
                    <Text style={styles.userName}>{displayName}</Text>
                    <Text style={styles.userRole}>{user?.department || 'Departamento no asignado'}</Text>
                </View>
                <Image
                    source={require('../../../assets/icono_indurama.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.contentWrapper, isDesktopView && styles.contentWrapperDesktop]}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#0D47A1" style={{ marginTop: 50 }} />
                    ) : (
                        <>
                            <View style={styles.actionBanner}>
                                <View style={styles.actionBannerContent}>
                                    <Text style={styles.actionTitle}>¿Qué necesitas hoy?</Text>
                                    <Text style={styles.actionSubtitle}>
                                        Gestione y realice seguimiento a sus solicitudes de necesidades
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={onNavigateToNewRequest}
                                    >
                                        <Ionicons name="add-circle" size={20} color="#1565C0" style={{ marginRight: 6 }} />
                                        <Text style={styles.actionButtonText}>Crear Nueva Solicitud</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.bannerCircle} />
                            </View>

                            <Text style={styles.sectionTitle}>Tu Resumen</Text>
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: '#0D47A1' }]}>{stats.inProgress}</Text>
                                    <Text style={styles.statLabel}>En Curso</Text>
                                    <Text style={styles.statSub}>Solicitudes activas</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: '#FFA726' }]}>{stats.pending}</Text>
                                    <Text style={styles.statLabel}>Atención</Text>
                                    <Text style={styles.statSub}>Requieren acción</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: '#4CAF50' }]}>{stats.completed}</Text>
                                    <Text style={styles.statLabel}>Listas</Text>
                                    <Text style={styles.statSub}>Últimos 30 días</Text>
                                </View>
                            </View>

                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Solicitudes Recientes</Text>
                                <TouchableOpacity onPress={onNavigateToHistory}>
                                    <Text style={styles.seeAllText}>Ver todas</Text>
                                </TouchableOpacity>
                            </View>

                            {recentRequests.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>No tienes solicitudes recientes</Text>
                                </View>
                            ) : (
                                <View style={isDesktopView ? styles.gridContainer : undefined}>
                                    {recentRequests.map((request) => (
                                        <View key={request.id} style={[
                                            styles.requestCard,
                                            isDesktopView && styles.requestCardDesktop
                                        ]}>
                                            <View style={styles.cardHeader}>
                                                <Text style={styles.cardCode}>{request.code}</Text>
                                                {getStatusBadge(request.status)}
                                            </View>

                                            <Text style={styles.cardTitle}>{request.description}</Text>
                                            <Text style={styles.cardSubtitle}>
                                                {request.claseBusqueda} · {request.tipoProyecto}
                                            </Text>

                                            {renderTimeline(request.status)}

                                            {(request.status === 'awarded' || (request.status as string) === 'adjudicado') && (
                                                <TouchableOpacity
                                                    style={styles.confirmReceiptButton}
                                                    onPress={() => handleConfirmReceipt(request.id)}
                                                    disabled={confirmingId === request.id}
                                                >
                                                    {confirmingId === request.id ? (
                                                        <ActivityIndicator color="#FFF" size="small" style={{ marginRight: 8 }} />
                                                    ) : (
                                                        <Ionicons name="checkmark-circle" size={18} color="#FFF" style={{ marginRight: 8 }} />
                                                    )}
                                                    <Text style={styles.confirmReceiptText}>
                                                        {confirmingId === request.id ? 'Confirmando...' : 'Confirmar Recepción'}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}

                                            <View style={styles.cardFooter}>
                                                <View style={styles.dateContainer}>
                                                    <Ionicons name="calendar-outline" size={16} color="#9E9E9E" style={{ marginRight: 6 }} />
                                                    <Text style={styles.dateText}>
                                                        {request.dueDate ? String(request.dueDate) : getRelativeTime(request.createdAt)}
                                                    </Text>
                                                </View>

                                                <TouchableOpacity
                                                    style={styles.detailsButton}
                                                    onPress={() => onNavigateToRequestDetail?.(request.id)}
                                                >
                                                    <Text style={styles.detailsButtonText}>Ver Detalles</Text>
                                                    <Ionicons name="arrow-forward" size={16} color="#1565C0" style={{ marginLeft: 4 }} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                            <View style={{ height: 40 }} />
                        </>
                    )}
                </View>
            </ScrollView>
        </ResponsiveNavShell>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    contentWrapper: { width: '100%' },
    contentWrapperDesktop: { maxWidth: 1200, alignSelf: 'center' },
    header: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    greeting: { fontSize: 14, color: '#666' },
    userName: { fontSize: 22, fontWeight: 'bold', color: '#212121' },
    userRole: { fontSize: 13, color: '#888', marginTop: 2 },
    logo: { width: 80, height: 40 },
    content: { flex: 1, padding: 20 },
    actionBanner: { backgroundColor: '#1565C0', borderRadius: 16, padding: 24, marginBottom: 24, position: 'relative', overflow: 'hidden', shadowColor: '#1565C0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
    actionBannerContent: { zIndex: 2 },
    bannerCircle: { position: 'absolute', right: -20, top: -20, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.1)', zIndex: 1 },
    actionTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
    actionSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 20, maxWidth: '80%' },
    actionButton: { backgroundColor: '#FFFFFF', borderRadius: 25, paddingVertical: 10, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
    actionButtonText: { color: '#1565C0', fontWeight: 'bold', fontSize: 14 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#212121', marginBottom: 16 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32, gap: 12 },
    statItem: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    statValue: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
    statLabel: { fontSize: 14, fontWeight: '600', color: '#333' },
    statSub: { fontSize: 11, color: '#999', marginTop: 2 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    seeAllText: { color: '#1565C0', fontWeight: '600', fontSize: 14 },

    // Grid System
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    requestCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
    requestCardDesktop: { width: '49%', marginBottom: 20 },

    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    cardCode: { fontSize: 12, color: '#9E9E9E', fontWeight: '600' },
    statusBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#212121', marginBottom: 4 },
    cardSubtitle: { fontSize: 13, color: '#757575', marginBottom: 20 },

    // Timeline Desktop
    timelineWrapper: { backgroundColor: 'rgba(21,101,192,0.06)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8, marginBottom: 24 },
    timelineContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, position: 'relative', minHeight: 46 },
    timelineStep: { alignItems: 'center', flex: 1 },
    timelineDot: { marginBottom: 4, zIndex: 2, borderWidth: 2, borderColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 2, elevation: 1, justifyContent: 'center', alignItems: 'center' },
    timelineLabel: { fontSize: 10, color: '#757575', textAlign: 'center' },
    timelineLabelActive: { color: '#2196F3', fontWeight: '600' },
    trackWrapper: { position: 'absolute', top: 18, left: 16, right: 16, height: 4, zIndex: 1 },
    timelineBase: { width: '100%', height: '100%', backgroundColor: '#E0E0E0', borderRadius: 2, position: 'absolute' },
    timelineProgress: { height: '100%', borderRadius: 2 },

    // Timeline Mobile
    mobileTimelineWrapper: { backgroundColor: '#F8F9FA', borderRadius: 12, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: '#EEE' },
    mobileTimelineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    mobileTimelineLabel: { fontSize: 12, color: '#666' },
    mobileStatusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    mobileStatusText: { fontSize: 11, fontWeight: 'bold' },
    mobileTrackBg: { height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, width: '100%', marginBottom: 6 },
    mobileTrackFill: { height: '100%', borderRadius: 3 },
    mobileStepCount: { fontSize: 10, color: '#999', textAlign: 'right' },

    confirmReceiptButton: { backgroundColor: '#4CAF50', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 12, marginBottom: 20 },
    confirmReceiptText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
    dateContainer: { flexDirection: 'row', alignItems: 'center' },
    dateText: { fontSize: 12, color: '#9E9E9E' },
    detailsButton: { flexDirection: 'row', alignItems: 'center' },
    detailsButtonText: { color: '#1565C0', fontWeight: '600', fontSize: 14 },
    emptyState: { alignItems: 'center', padding: 40, backgroundColor: '#FFF', borderRadius: 16 },
    emptyText: { color: '#999', fontSize: 16 },
});
