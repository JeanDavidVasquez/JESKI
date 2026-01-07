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
    Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SolicitanteBottomNav } from '../components/SolicitanteBottomNav';
import { useAuth } from '../hooks/useAuth';
import { getUserRequests, getUserRequestStats, getRelativeTime } from '../services/requestService';
import { Request } from '../types';

interface SolicitanteDashboardScreenProps {
    onNavigateToNewRequest: () => void;
    onNavigateToHistory: () => void;
    onNavigateToProfile: () => void;
    onNavigateToRequestDetail?: (requestId: string) => void;
}

const { width } = Dimensions.get('window');

export const SolicitanteDashboardScreen: React.FC<SolicitanteDashboardScreenProps> = ({
    onNavigateToNewRequest,
    onNavigateToHistory,
    onNavigateToProfile,
    onNavigateToRequestDetail,
}) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0
    });
    const [recentRequests, setRecentRequests] = useState<Request[]>([]);

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
        // Returns the active step index (0-3)
        switch (status) {
            case 'pending': return 1; // Solicitado OK, Waiting Aprobación
            case 'in_progress': return 2; // Aprobado OK, In Gestión
            case 'completed': return 4; // All Done
            case 'rejected': return 1; // Stuck at Aprobación
            default: return 0;
        }
    };

    const renderTimeline = (status: string) => {
        const steps = ['Solicitado', 'Aprobación', 'Gestión', 'Orden'];
        const activeStep = getTimelineStatus(status);
        const isRejected = status === 'rejected';

        // Progress ratio across the track (0 to 1)
        const progressRatio = Math.max(0, Math.min((activeStep - 1) / (steps.length - 1), 1));

        return (
            <View style={styles.timelineWrapper}>
                <View style={styles.timelineContainer}>
                    <View style={styles.timelineBase} />
                    <View style={[styles.timelineProgress, { width: `${progressRatio * 100}%` }]} />

                    {steps.map((step, index) => {
                        const isActive = index < activeStep;
                        const isCurrent = index === activeStep - 1;

                        let dotColor = '#E0E0E0';
                        if (isActive) dotColor = '#2196F3';
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
                                ]}>
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
        if (status === 'completed') { label = 'LISTO / COMPRA'; color = '#4CAF50'; }
        if (status === 'rejected') { label = 'RECHAZADA'; color = '#F44336'; }
        if (status === 'rectification_required') { label = 'CORRECCIÓN REQUERIDA'; color = '#FF9800'; } // Orange/Warning

        return (
            <View style={[styles.statusBadge, { borderColor: color }]}>
                <Text style={[styles.statusText, { color: color }]}>{label}</Text>
            </View>
        );
    };

    const displayName = user?.companyName || (user?.firstName ? `${user.firstName} ${user.lastName || ''} ` : user?.email?.split('@')[0]);

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Header Updated */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Bienvenido,</Text>
                    <Text style={styles.userName}>{displayName}</Text>
                    <Text style={styles.userRole}>{user?.department || 'Departamento no asignado'}</Text>
                </View>
                <Image
                    source={require('../../assets/icono_indurama.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {loading ? (
                    <ActivityIndicator size="large" color="#0D47A1" style={{ marginTop: 50 }} />
                ) : (
                    <>
                        {/* Blue Action Banner - RESTORED */}
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

                        {/* Stats Overview - RESTORED Horizontal Layout */}
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

                        {/* Recent Requests List */}
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
                            recentRequests.map((request) => (
                                <View key={request.id} style={styles.requestCard}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardCode}>{request.code}</Text>
                                        {getStatusBadge(request.status)}
                                    </View>

                                    <Text style={styles.cardTitle}>{request.description}</Text>
                                    <Text style={styles.cardSubtitle}>
                                        {request.claseBusqueda} · {request.tipoProyecto}
                                    </Text>

                                    {/* Timeline Component - RESTORED */}
                                    {renderTimeline(request.status)}

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
                            ))
                        )}

                        <View style={{ height: 40 }} />
                    </>
                )}
            </ScrollView>

            <SolicitanteBottomNav
                currentScreen="Dashboard"
                onNavigateToDashboard={() => { }}
                onNavigateToNewRequest={onNavigateToNewRequest}
                onNavigateToHistory={onNavigateToHistory}
                onNavigateToProfile={onNavigateToProfile}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    greeting: {
        fontSize: 14,
        color: '#666',
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#212121',
    },
    userRole: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    logo: {
        width: 80,
        height: 40,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    actionBanner: {
        backgroundColor: '#1565C0', // Indurama Blue
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
        shadowColor: '#1565C0',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    actionBannerContent: {
        zIndex: 2,
    },
    bannerCircle: {
        position: 'absolute',
        right: -20,
        top: -20,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.1)',
        zIndex: 1,
    },
    actionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    actionSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 20,
        maxWidth: '80%',
    },
    actionButton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
    },
    actionButtonText: {
        color: '#1565C0',
        fontWeight: 'bold',
        fontSize: 14,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212121',
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
        gap: 12,
    },
    statItem: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    statSub: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    seeAllText: {
        color: '#1565C0',
        fontWeight: '600',
        fontSize: 14,
    },
    requestCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardCode: {
        fontSize: 12,
        color: '#9E9E9E',
        fontWeight: '600',
    },
    statusBadge: {
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#212121',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#757575',
        marginBottom: 20,
    },
    timelineWrapper: {
        backgroundColor: 'rgba(21,101,192,0.06)',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 8,
        marginBottom: 24,
    },
    timelineContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        position: 'relative',
        minHeight: 46,
    },
    timelineStep: {
        alignItems: 'center',
        flex: 1,
    },
    timelineDot: {
        marginBottom: 8,
        zIndex: 2,
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timelineBase: {
        position: 'absolute',
        top: 18,
        left: 16,
        right: 16,
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        zIndex: 1,
    },
    timelineProgress: {
        position: 'absolute',
        top: 18,
        left: 16,
        height: 4,
        backgroundColor: '#2196F3',
        borderRadius: 2,
        zIndex: 2,
    },
    timelineLabel: {
        fontSize: 10,
        textAlign: 'center',
        marginTop: 2,
        color: '#999',
        letterSpacing: 0.2,
    },
    timelineLabelActive: {
        color: '#333',
        fontWeight: '600',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F5F5F5',
        paddingTop: 16,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 13,
        color: '#999',
    },
    detailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailsButtonText: {
        color: '#1565C0',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyState: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: '#999',
        fontStyle: 'italic',
    },
});
