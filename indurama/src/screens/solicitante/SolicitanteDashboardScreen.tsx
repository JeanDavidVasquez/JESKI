import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
    Platform,
    Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ResponsiveNavShell } from '../../components/ResponsiveNavShell';
import { StatCard } from '../../components/StatCard';
import { MainBanner } from '../../components/MainBanner';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { getUserRequests, getUserRequestStats, getRelativeTime, confirmReceipt, reportNonCompliance, getDeliveryDeadline } from '../../services/requestService';
import { Request, RequestStatus } from '../../types';
import { useResponsive, BREAKPOINTS } from '../../styles/responsive';
import { getSolicitanteNavItems } from '../../navigation/solicitanteItems';
import { theme } from '../../styles/theme';

interface SolicitanteDashboardScreenProps {
    onNavigateToNewRequest: () => void;
    onNavigateToHistory: () => void;
    onNavigateToProfile: () => void;
    onNavigateToRequestDetail?: (requestId: string) => void;
    onNavigateToNotifications?: () => void;
}

export const SolicitanteDashboardScreen: React.FC<SolicitanteDashboardScreenProps> = ({
    onNavigateToNewRequest,
    onNavigateToHistory,
    onNavigateToProfile,
    onNavigateToRequestDetail,
    onNavigateToNotifications,
}) => {
    const { user } = useAuth();
    const { t } = useLanguage();
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
    const [reportingId, setReportingId] = useState<string | null>(null);

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
            case 'reopened_noncompliance': return 4;
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
                if (Platform.OS === 'web') alert(t('solicitante.alerts.receiptConfirmed'));
                else Alert.alert(t('common.success'), t('solicitante.alerts.receiptConfirmed'));
            } catch (error) {
                console.error('Error:', error);
                if (Platform.OS === 'web') alert(t('solicitante.alerts.confirmError'));
                else Alert.alert(t('common.error'), t('solicitante.alerts.confirmError'));
            } finally {
                setConfirmingId(null);
            }
        };

        if (Platform.OS === 'web') {
            if (confirm(t('solicitante.alerts.confirmReceiptMessage'))) await doConfirm();
        } else {
            Alert.alert(
                t('solicitante.alerts.confirmReceiptTitle'),
                t('solicitante.alerts.confirmReceiptMessage'),
                [{ text: t('common.cancel'), style: 'cancel' }, { text: t('solicitante.alerts.yesReceived'), onPress: doConfirm }]
            );
        }
    };

    const handleReportNonCompliance = async (requestId: string) => {
        if (!user?.id) return;
        const doReport = async () => {
            setReportingId(requestId);
            try {
                await reportNonCompliance(requestId, user.id, 'Proveedor no entregó en el tiempo establecido');
                loadDashboardData();
                if (Platform.OS === 'web') alert(t('solicitante.alerts.nonComplianceReported'));
                else Alert.alert(t('nonCompliance.title'), t('solicitante.alerts.nonComplianceReported'));
            } catch (error) {
                console.error('Error:', error);
                if (Platform.OS === 'web') alert(t('solicitante.alerts.reportError'));
                else Alert.alert(t('common.error'), t('solicitante.alerts.reportError'));
            } finally {
                setReportingId(null);
            }
        };

        if (Platform.OS === 'web') {
            if (confirm(t('solicitante.alerts.reportMessage'))) await doReport();
        } else {
            Alert.alert(
                t('solicitante.alerts.reportTitle'),
                t('solicitante.alerts.reportMessage'),
                [{ text: t('common.cancel'), style: 'cancel' }, { text: t('solicitante.alerts.yesReport'), style: 'destructive', onPress: doReport }]
            );
        }
    };

    const renderTimeline = (status: string) => {
        const steps = [
            t('solicitante.timeline.requested'),
            t('solicitante.timeline.approval'),
            t('solicitante.timeline.management'),
            t('solicitante.timeline.order'),
            t('solicitante.timeline.reception')
        ];
        const activeStep = getTimelineStatus(status);
        const isRejected = status === 'rejected';

        // Colors - Using theme tokens
        let progressColor = theme.colors.primary;
        if (status === 'quoting' || status === 'cotizacion') progressColor = theme.colors.warning;
        if (status === 'awarded' || status === 'adjudicado' || status === 'completed') progressColor = '#9C27B0';
        if (status === 'rejected') progressColor = theme.colors.error;

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
                                {isRejected ? t('solicitante.status.rejected') : currentStepName}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.mobileTrackBg}>
                        <View style={[
                            styles.mobileTrackFill,
                            { width: `${stepPercentage}%`, backgroundColor: progressColor }
                        ]} />
                    </View>

                    <Text style={styles.mobileStepCount}>{t('time.stepOf', { current: activeStep, total: 5 })}</Text>
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
                        let activeColor = theme.colors.primary; // Using theme token

                        if (status === 'quoting' || status === 'cotizacion') activeColor = theme.colors.warning;
                        if (status === 'awarded' || status === 'adjudicado' || status === 'completed') activeColor = '#9C27B0';
                        if (status === 'rejected') activeColor = theme.colors.error;

                        if (isActive) dotColor = activeColor;
                        if (isCurrent && status === 'pending') dotColor = theme.colors.warning;
                        if (isCurrent && isRejected) dotColor = theme.colors.error;

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
        let label = t('solicitante.status.inProcess');
        let color = theme.colors.primary; // Using theme token
        if (status === 'pending') { label = t('solicitante.status.waitingApproval'); color = theme.colors.warning; }
        if (status === 'in_progress') { label = t('solicitante.status.inManagement'); color = theme.colors.primary; }
        if (status === 'quoting' || status === 'cotizacion') { label = t('solicitante.status.quoting'); color = theme.colors.warning; }
        if (status === 'awarded' || status === 'adjudicado') { label = t('solicitante.status.awarded'); color = '#9C27B0'; }
        if (status === 'completed') { label = t('solicitante.status.readyPurchase'); color = theme.colors.success; }
        if (status === 'rejected') { label = t('solicitante.status.rejected'); color = theme.colors.error; }
        if (status === 'rectification_required') { label = t('solicitante.status.correctionRequired'); color = theme.colors.warning; }
        if (status === 'reopened_noncompliance') { label = t('solicitante.status.reopened'); color = theme.colors.warning; }

        return (
            <View style={[styles.statusBadge, { borderColor: color }]}>
                <Text style={[styles.statusText, { color: color }]}>{label}</Text>
            </View>
        );
    };

    const displayName = user?.companyName || (user?.firstName ? `${user.firstName} ${user.lastName || ''} ` : user?.email?.split('@')[0]);

    const navItems = getSolicitanteNavItems(t, {
        onNavigateToDashboard: () => { },
        onNavigateToNewRequest: onNavigateToNewRequest,
        onNavigateToHistory: onNavigateToHistory,
        onNavigateToProfile: onNavigateToProfile,
    });

    return (
        <ResponsiveNavShell
            currentScreen="Dashboard"
            navItems={navItems}
            logo={require('../../../assets/icono_indurama.png')}
            onNavigateToNotifications={onNavigateToNotifications}
        >
            <StatusBar style="dark" />

            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>{t('solicitante.welcome')}</Text>
                    <Text style={styles.userName}>{displayName}</Text>
                    <View style={{ marginTop: 4 }}>
                        <Text style={styles.userRole}>
                            {user?.companyIdentifier ? user.companyIdentifier : t('solicitante.companyNotAssigned')}
                        </Text>
                        <Text style={[styles.userRole, { fontSize: 12, marginTop: 1 }]}>
                            {user?.department ? user.department : t('solicitante.departmentNotAssigned')}
                        </Text>
                    </View>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.contentWrapper, isDesktopView && styles.contentWrapperDesktop]}>
                    {loading ? (
                        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />
                    ) : (
                        <>
                            <MainBanner
                                title={t('solicitante.whatDoYouNeed')}
                                subtitle={t('solicitante.trackRequests')}
                                buttonText={t('solicitante.createNewRequest')}
                                onPress={onNavigateToNewRequest}
                                buttonIcon="add-circle"
                            />

                            <Text style={styles.sectionTitle}>{t('solicitante.yourSummary')}</Text>
                            <View style={styles.statsRow}>
                                <StatCard
                                    value={stats.inProgress}
                                    label={t('solicitante.inProgress')}
                                    subtitle={t('solicitante.activeRequests')}
                                    color={theme.colors.primary}
                                />
                                <StatCard
                                    value={stats.pending}
                                    label={t('solicitante.attention')}
                                    subtitle={t('solicitante.requireAction')}
                                    color={theme.colors.warning}
                                />
                                <StatCard
                                    value={stats.completed}
                                    label={t('solicitante.ready')}
                                    subtitle={t('solicitante.last30Days')}
                                    color={theme.colors.success}
                                />
                            </View>

                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>{t('solicitante.recentRequests')}</Text>
                                <TouchableOpacity onPress={onNavigateToHistory}>
                                    <Text style={styles.seeAllText}>{t('solicitante.viewAll')}</Text>
                                </TouchableOpacity>
                            </View>

                            {recentRequests.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>{t('solicitante.noRecentRequests')}</Text>
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

                                            {/* AWARDED: Show dual action buttons */}
                                            {(request.status === 'awarded' || (request.status as string) === 'adjudicado') && (
                                                <View style={styles.deliveryActionsContainer}>
                                                    <TouchableOpacity
                                                        style={styles.confirmReceiptButton}
                                                        onPress={() => handleConfirmReceipt(request.id)}
                                                        disabled={confirmingId === request.id}
                                                    >
                                                        {confirmingId === request.id ? (
                                                            <ActivityIndicator color="#FFF" size="small" style={{ marginRight: 6 }} />
                                                        ) : (
                                                            <Ionicons name="checkmark-circle" size={16} color="#FFF" style={{ marginRight: 6 }} />
                                                        )}
                                                        <Text style={styles.confirmReceiptText}>
                                                            {confirmingId === request.id ? t('solicitante.confirming') : t('requests.received')}
                                                        </Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        style={styles.reportNonComplianceButton}
                                                        onPress={() => handleReportNonCompliance(request.id)}
                                                        disabled={reportingId === request.id}
                                                    >
                                                        {reportingId === request.id ? (
                                                            <ActivityIndicator color="#FFF" size="small" style={{ marginRight: 6 }} />
                                                        ) : (
                                                            <Ionicons name="close-circle" size={16} color="#FFF" style={{ marginRight: 6 }} />
                                                        )}
                                                        <Text style={styles.reportNonComplianceText}>
                                                            {reportingId === request.id ? t('solicitante.reporting') : t('requests.notReceived')}
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}

                                            {/* REOPENED: Show info message */}
                                            {request.status === 'reopened_noncompliance' && (
                                                <View style={styles.reopenedInfoBanner}>
                                                    <Ionicons name="refresh-circle" size={18} color="#F59E0B" style={{ marginRight: 8 }} />
                                                    <Text style={styles.reopenedInfoText}>
                                                        {t('solicitante.alerts.gestorReadjudicating')}
                                                    </Text>
                                                </View>
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
                                                    <Text style={styles.detailsButtonText}>{t('solicitante.viewDetails')}</Text>
                                                    <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} style={{ marginLeft: 4 }} />
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
    container: { flex: 1, backgroundColor: theme.colors.background.secondary },
    contentWrapper: { width: '100%' },
    contentWrapperDesktop: { maxWidth: 1200, alignSelf: 'center' },
    header: { backgroundColor: theme.colors.white, paddingHorizontal: theme.spacing[5], paddingTop: 50, paddingBottom: theme.spacing[5], flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.colors.border.light },
    greeting: { fontSize: 14, color: theme.colors.text.secondary },
    userName: { fontSize: 22, fontWeight: '700', color: theme.colors.text.primary },
    userRole: { fontSize: 13, color: theme.colors.text.muted, marginTop: 2 },
    logo: { width: 80, height: 40 },
    content: { flex: 1, padding: theme.spacing[5] },
    actionBanner: { backgroundColor: theme.colors.primary, borderRadius: 16, padding: 24, marginBottom: 24, position: 'relative', overflow: 'hidden', shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
    actionBannerContent: { zIndex: 2 },
    bannerCircle: { position: 'absolute', right: -20, top: -20, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.1)', zIndex: 1 },
    actionTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
    actionSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 20, maxWidth: '80%' },
    actionButton: { backgroundColor: '#FFFFFF', borderRadius: 25, paddingVertical: 10, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
    actionButtonText: { color: theme.colors.primary, fontWeight: 'bold', fontSize: 14 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#212121', marginBottom: 16 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32, gap: 12 },
    statItem: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    statValue: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
    statLabel: { fontSize: 14, fontWeight: '600', color: '#333' },
    statSub: { fontSize: 11, color: '#999', marginTop: 2 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    seeAllText: { color: theme.colors.primary, fontWeight: '600', fontSize: 14 },

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
    timelineWrapper: { backgroundColor: 'rgba(0, 62, 133, 0.06)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8, marginBottom: 24 },
    timelineContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, position: 'relative', minHeight: 46 },
    timelineStep: { alignItems: 'center', flex: 1 },
    timelineDot: { marginBottom: 4, zIndex: 2, borderWidth: 2, borderColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 2, elevation: 1, justifyContent: 'center', alignItems: 'center' },
    timelineLabel: { fontSize: 10, color: '#757575', textAlign: 'center' },
    timelineLabelActive: { color: theme.colors.primary, fontWeight: '600' },
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

    confirmReceiptButton: { flex: 1, backgroundColor: '#4CAF50', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 12 },
    confirmReceiptText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
    dateContainer: { flexDirection: 'row', alignItems: 'center' },
    dateText: { fontSize: 12, color: '#9E9E9E' },
    detailsButton: { flexDirection: 'row', alignItems: 'center' },
    detailsButtonText: { color: theme.colors.primary, fontWeight: '600', fontSize: 14 },
    emptyState: { alignItems: 'center', padding: 40, backgroundColor: '#FFF', borderRadius: 16 },
    emptyText: { color: '#999', fontSize: 16 },

    // Dual action buttons for delivery confirmation
    deliveryActionsContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    reportNonComplianceButton: { flex: 1, backgroundColor: '#EF4444', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 12 },
    reportNonComplianceText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },

    // Reopened info banner
    reopenedInfoBanner: { backgroundColor: '#FFFBEB', flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#FDE68A' },
    reopenedInfoText: { flex: 1, color: '#92400E', fontSize: 13 },
});