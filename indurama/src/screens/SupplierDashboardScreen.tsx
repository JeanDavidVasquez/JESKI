/**
 * SupplierDashboardScreen - Dashboard principal para proveedores con EPI completado
 */
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
    Platform,
    Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { QuotationService } from '../services/quotationService';
import { NotificationService } from '../services/notificationService';
import { SupplierResponseService } from '../services/supplierResponseService';
import { QuotationInvitation, Quotation } from '../types';

interface SupplierDashboardScreenProps {
    onNavigateToQuotations: () => void;
    onNavigateToProfile: () => void;
    onNavigateToNotifications: () => void;
    onNavigateToEPIStatus: () => void;
    onLogout: () => void;
    user?: any; // Fallback user prop
}

const { width } = Dimensions.get('window');

export const SupplierDashboardScreen: React.FC<SupplierDashboardScreenProps> = ({
    onNavigateToQuotations,
    onNavigateToProfile,
    onNavigateToNotifications,
    onNavigateToEPIStatus,
    onLogout,
    user: userProp,
}) => {
    const { user: contextUser } = useAuth();
    // Use prop user if available (from navigation), otherwise context user
    const user = userProp || contextUser;

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [stats, setStats] = useState({
        pendingInvitations: 0,
        submittedQuotations: 0,
        wonQuotations: 0,
        epiScore: 0,
    });
    const [recentInvitations, setRecentInvitations] = useState<QuotationInvitation[]>([]);

    useEffect(() => {
        if (user?.id) {
            loadDashboardData();
        } else {
            // If no user immediately, wait a bit or stop loading
            const timer = setTimeout(() => {
                if (!user?.id) {
                    console.warn('Dashboard: No user found after timeout');
                    setLoading(false);
                }
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [user?.id]);

    const loadDashboardData = async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Cargar datos en paralelo
            const [invitations, quotations, unreadCount, epiSubmission] = await Promise.all([
                QuotationService.getProviderInvitations(user.id),
                QuotationService.getProviderQuotations(user.id),
                NotificationService.getUnreadCount(user.id),
                SupplierResponseService.getEPISubmission(user.id),
            ]);

            // Calcular estadísticas
            const pending = invitations.filter(i => i.status === 'pending' || i.status === 'viewed');
            const submitted = quotations.filter(q => q.status === 'submitted');
            const won = quotations.filter(q => q.isWinner);

            setStats({
                pendingInvitations: pending.length,
                submittedQuotations: submitted.length,
                wonQuotations: won.length,
                epiScore: epiSubmission?.calculatedScore || user?.epiScore || 0,
            });

            setRecentInvitations(pending.slice(0, 3));
            setUnreadNotifications(unreadCount);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboardData();
    };

    const displayName = user?.companyName || user?.firstName || 'Proveedor';

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#003E85" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.greeting}>Bienvenido,</Text>
                        <Text style={styles.userName}>{displayName}</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity onPress={onNavigateToNotifications} style={styles.notificationButton}>
                            <Ionicons name="notifications-outline" size={24} color="#FFF" />
                            {unreadNotifications > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <Image
                            source={require('../../assets/icono_indurama.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>
                </View>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {/* EPI Score Card */}
                <TouchableOpacity style={styles.epiCard} onPress={onNavigateToEPIStatus}>
                    <View style={styles.epiCardContent}>
                        <View>
                            <Text style={styles.epiLabel}>Tu Score EPI</Text>
                            <Text style={styles.epiDescription}>Evaluación de Proveedores Indurama</Text>
                        </View>
                        <View style={styles.scoreCircle}>
                            <Text style={styles.scoreValue}>{Math.round(stats.epiScore)}</Text>
                            <Text style={styles.scoreMax}>/100</Text>
                        </View>
                    </View>
                    <View style={styles.epiFooter}>
                        <Text style={styles.epiFooterText}>Ver detalle de mi evaluación</Text>
                        <Ionicons name="chevron-forward" size={20} color="#003E85" />
                    </View>
                </TouchableOpacity>

                {/* Stats Grid */}
                <Text style={styles.sectionTitle}>Resumen de Cotizaciones</Text>
                <View style={styles.statsGrid}>
                    <TouchableOpacity style={styles.statCard} onPress={onNavigateToQuotations}>
                        <View style={[styles.statIcon, { backgroundColor: '#FFF3E0' }]}>
                            <Ionicons name="mail-outline" size={24} color="#FF9800" />
                        </View>
                        <Text style={styles.statValue}>{stats.pendingInvitations}</Text>
                        <Text style={styles.statLabel}>Pendientes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.statCard} onPress={onNavigateToQuotations}>
                        <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
                            <Ionicons name="document-text-outline" size={24} color="#2196F3" />
                        </View>
                        <Text style={styles.statValue}>{stats.submittedQuotations}</Text>
                        <Text style={styles.statLabel}>Enviadas</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.statCard} onPress={onNavigateToQuotations}>
                        <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
                            <Ionicons name="trophy-outline" size={24} color="#4CAF50" />
                        </View>
                        <Text style={styles.statValue}>{stats.wonQuotations}</Text>
                        <Text style={styles.statLabel}>Ganadas</Text>
                    </TouchableOpacity>
                </View>

                {/* Recent Invitations */}
                {recentInvitations.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Invitaciones Pendientes</Text>
                            <TouchableOpacity onPress={onNavigateToQuotations}>
                                <Text style={styles.seeAllText}>Ver todas</Text>
                            </TouchableOpacity>
                        </View>

                        {recentInvitations.map(invitation => (
                            <TouchableOpacity key={invitation.id} style={styles.invitationCard} onPress={onNavigateToQuotations}>
                                <View style={styles.invitationIcon}>
                                    <Ionicons name="pricetag-outline" size={24} color="#003E85" />
                                </View>
                                <View style={styles.invitationContent}>
                                    <Text style={styles.invitationTitle}>
                                        Solicitud #{invitation.requestId.slice(-6).toUpperCase()}
                                    </Text>
                                    <Text style={styles.invitationDate}>
                                        {invitation.status === 'pending' ? 'Nueva invitación' : 'Pendiente de cotizar'}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={24} color="#CCC" />
                            </TouchableOpacity>
                        ))}
                    </>
                )}

                {/* Empty State */}
                {recentInvitations.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="pricetags-outline" size={64} color="#CCC" />
                        <Text style={styles.emptyTitle}>Sin invitaciones pendientes</Text>
                        <Text style={styles.emptyText}>
                            Cuando te inviten a cotizar, aparecerán aquí
                        </Text>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem}>
                    <Ionicons name="home" size={24} color="#003E85" />
                    <Text style={[styles.navLabel, styles.navLabelActive]}>Inicio</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem} onPress={onNavigateToQuotations}>
                    <Ionicons name="pricetags-outline" size={24} color="#666" />
                    <Text style={styles.navLabel}>Cotizaciones</Text>
                    {stats.pendingInvitations > 0 && (
                        <View style={styles.navBadge}>
                            <Text style={styles.navBadgeText}>{stats.pendingInvitations}</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem} onPress={onNavigateToProfile}>
                    <Ionicons name="person-outline" size={24} color="#666" />
                    <Text style={styles.navLabel}>Perfil</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem} onPress={onLogout}>
                    <Ionicons name="log-out-outline" size={24} color="#666" />
                    <Text style={styles.navLabel}>Salir</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#003E85',
        paddingTop: Platform.OS === 'ios' ? 50 : 40,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFF',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    notificationButton: {
        position: 'relative',
        padding: 8,
    },
    badge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#F44336',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    logo: {
        width: 40,
        height: 40,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    epiCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    epiCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    epiLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    epiDescription: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
    },
    scoreCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    scoreMax: {
        fontSize: 12,
        color: '#4CAF50',
    },
    epiFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    epiFooterText: {
        fontSize: 14,
        color: '#003E85',
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        marginTop: 8,
    },
    seeAllText: {
        fontSize: 14,
        color: '#003E85',
        fontWeight: '500',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    invitationCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        alignItems: 'center',
    },
    invitationIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    invitationContent: {
        flex: 1,
    },
    invitationTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    invitationDate: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 16,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
    },
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
        position: 'relative',
    },
    navLabel: {
        fontSize: 11,
        color: '#666',
        marginTop: 4,
    },
    navLabelActive: {
        color: '#003E85',
        fontWeight: '600',
    },
    navBadge: {
        position: 'absolute',
        top: 2,
        right: '25%',
        backgroundColor: '#F44336',
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    navBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
});

export default SupplierDashboardScreen;
