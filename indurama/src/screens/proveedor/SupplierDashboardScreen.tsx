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
    useWindowDimensions,
    Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '../../hooks/useAuth';
import { QuotationService } from '../../services/quotationService';
import { NotificationService } from '../../services/notificationService';
import { SupplierResponseService } from '../../services/supplierResponseService';
import { QuotationInvitation } from '../../types';
import { ResponsiveNavShell } from '../../components/ResponsiveNavShell';

interface SupplierDashboardScreenProps {
    onNavigateToQuotations: () => void;
    onNavigateToProfile: () => void;
    onNavigateToNotifications: () => void;
    onNavigateToEPIStatus: () => void;
    onLogout: () => void;
    user?: any;
}

// Componente de Card Animada
const AnimatedCard: React.FC<{
    children: React.ReactNode;
    style?: any;
    onPress?: () => void;
    delay?: number;
}> = ({ children, style, onPress, delay = 0 }) => {
    const fadeAnim = new Animated.Value(0);
    const slideAnim = new Animated.Value(20);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const Component = onPress ? TouchableOpacity : View;

    return (
        <Animated.View
            style={[
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                },
                style,
            ]}
        >
            <Component onPress={onPress} activeOpacity={0.95} style={{ flex: 1 }}>
                {children}
            </Component>
        </Animated.View>
    );
};

export const SupplierDashboardScreen: React.FC<SupplierDashboardScreenProps> = ({
    onNavigateToQuotations,
    onNavigateToProfile,
    onNavigateToNotifications,
    onNavigateToEPIStatus,
    onLogout,
    user: userProp,
}) => {
    const { user: contextUser } = useAuth();
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

    const { width: windowWidth } = useWindowDimensions();
    const isDesktop = windowWidth >= 1024;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;

    useEffect(() => {
        if (user?.id) {
            loadDashboardData();
        } else {
            const timer = setTimeout(() => {
                if (!user?.id) setLoading(false);
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
            const [invitations, quotations, unreadCount, epiSubmission] = await Promise.all([
                QuotationService.getProviderInvitations(user.id),
                QuotationService.getProviderQuotations(user.id),
                NotificationService.getUnreadCount(user.id),
                SupplierResponseService.getEPISubmission(user.id),
            ]);

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

    const navItems = [
        { key: 'Dashboard', label: 'Inicio', iconName: 'home' as any, onPress: () => { } },
        { key: 'Quotations', label: 'Cotizaciones', iconName: 'pricetags-outline' as any, onPress: onNavigateToQuotations },
        { key: 'Profile', label: 'Perfil', iconName: 'person-outline' as any, onPress: onNavigateToProfile },
        { key: 'Logout', label: 'Salir', iconName: 'log-out-outline' as any, onPress: onLogout },
    ];

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#003E85" />
                <Text style={styles.loadingText}>Cargando tu dashboard...</Text>
            </View>
        );
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return '#10B981';
        if (score >= 50) return '#F59E0B';
        return '#EF4444';
    };

    const getScoreGradient = (score: number) => {
        if (score >= 80) return ['#10B981', '#059669'];
        if (score >= 50) return ['#F59E0B', '#D97706'];
        return ['#EF4444', '#DC2626'];
    };

    const scoreColor = getScoreColor(stats.epiScore);
    const scoreGradient = getScoreGradient(stats.epiScore);

    return (
        <ResponsiveNavShell
            currentScreen="Dashboard"
            navItems={navItems}
            title="INDURAMA"
            logo={require('../../../assets/icono_indurama.png')}
            onNavigateToNotifications={onNavigateToNotifications}
        >
            <View style={styles.container}>
                <StatusBar style="light" />

                {/* CORRECCIÓN: Header movido DENTRO del ScrollView 
                   Esto evita que el contenido se sobreponga incorrectamente o se corte.
                */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingBottom: 40 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#003E85"
                            colors={['#003E85']}
                            progressViewOffset={Platform.OS === 'ios' ? 0 : 40}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header integrado en el scroll */}
                    <LinearGradient
                        colors={['#001F3F', '#003E85', '#0056B3']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.headerGradient, isDesktop && styles.headerWeb]}
                    >
                        <View style={[styles.contentConstraint, styles.headerFlex]}>
                            <View style={styles.greetingContainer}>
                                <Text style={styles.greeting}>Bienvenido de nuevo,</Text>
                                <Text style={styles.userName}>{displayName}</Text>
                                <View style={styles.statusDot}>
                                    <View style={styles.dotInner} />
                                </View>
                            </View>
                            <TouchableOpacity onPress={onNavigateToNotifications} style={styles.notificationButton}>
                                <View style={styles.notificationIconBg}>
                                    <Ionicons name="notifications" size={24} color="#FFF" />
                                </View>
                                {unreadNotifications > 0 && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>
                                            {unreadNotifications > 9 ? '9+' : unreadNotifications}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>

                    <View style={styles.contentConstraint}>

                        {/* Tarjeta EPI Score Rediseñada */}
                        <AnimatedCard delay={0}>
                            <TouchableOpacity
                                style={[styles.mainCard, isDesktop && styles.mainCardWeb]}
                                onPress={onNavigateToEPIStatus}
                                activeOpacity={0.95}
                            >
                                <LinearGradient
                                    colors={['#FFFFFF', '#F8FAFC']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.mainCardGradient}
                                >
                                    <View style={styles.mainCardInner}>
                                        <View style={styles.scoreInfoContainer}>
                                            <View style={styles.scoreBadge}>
                                                <LinearGradient
                                                    colors={['#003E85', '#0056B3']}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                    style={styles.scoreBadgeGradient}
                                                >
                                                    <Text style={styles.scoreBadgeText}>EPI SCORE</Text>
                                                </LinearGradient>
                                            </View>
                                            <Text style={styles.epiLabel}>Tu Calificación</Text>
                                            <Text style={styles.epiDescription}>
                                                Evaluación de Proveedores Indurama
                                            </Text>
                                            <View style={styles.scoreMetrics}>
                                                <View style={styles.metricItem}>
                                                    <Ionicons name="trending-up" size={16} color="#10B981" />
                                                    <Text style={styles.metricText}>Activo</Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Score Circle Mejorado */}
                                        <View style={styles.scoreContainer}>
                                            <View style={[styles.scoreRing, { borderColor: scoreColor + '20' }]}>
                                                <LinearGradient
                                                    colors={[scoreGradient[0], scoreGradient[1]]}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 1 }}
                                                    style={styles.scoreCircleInner}
                                                >
                                                    <Text style={styles.scoreValue} allowFontScaling={false}>
                                                        {Math.round(stats.epiScore)}
                                                    </Text>
                                                    <Text style={styles.scoreMax} allowFontScaling={false}>
                                                        /100
                                                    </Text>
                                                </LinearGradient>
                                            </View>
                                            <View style={[styles.scoreGlow, { backgroundColor: scoreColor + '15' }]} />
                                        </View>
                                    </View>

                                    <View style={styles.cardFooter}>
                                        <Text style={styles.footerText}>Ver análisis detallado</Text>
                                        <View style={styles.arrowContainer}>
                                            <Ionicons name="arrow-forward" size={20} color="#003E85" />
                                        </View>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        </AnimatedCard>

                        {/* Stats Cards Mejoradas */}
                        <Text style={styles.sectionTitle}>Resumen General</Text>
                        <View style={[
                            styles.statsRow,
                            isDesktop && styles.statsRowWeb,
                            isTablet && styles.statsRowTablet
                        ]}>
                            <AnimatedCard style={styles.statCard} delay={100}>
                                <TouchableOpacity
                                    style={styles.statCardInner}
                                    onPress={onNavigateToQuotations}
                                    activeOpacity={0.9}
                                >
                                    <LinearGradient
                                        colors={['#FFF7ED', '#FFEDD5']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.iconContainerGradient}
                                    >
                                        <Ionicons name="hourglass-outline" size={28} color="#F59E0B" />
                                    </LinearGradient>
                                    <Text style={styles.statNumber}>{stats.pendingInvitations}</Text>
                                    <Text style={styles.statSubtitle}>Pendientes</Text>
                                    <View style={[styles.statBar, { backgroundColor: '#FED7AA' }]}>
                                        <View style={[styles.statBarFill, { width: '60%', backgroundColor: '#F59E0B' }]} />
                                    </View>
                                </TouchableOpacity>
                            </AnimatedCard>

                            <AnimatedCard style={styles.statCard} delay={200}>
                                <TouchableOpacity
                                    style={styles.statCardInner}
                                    onPress={onNavigateToQuotations}
                                    activeOpacity={0.9}
                                >
                                    <LinearGradient
                                        colors={['#DBEAFE', '#BFDBFE']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.iconContainerGradient}
                                    >
                                        <Ionicons name="send-outline" size={28} color="#3B82F6" />
                                    </LinearGradient>
                                    <Text style={styles.statNumber}>{stats.submittedQuotations}</Text>
                                    <Text style={styles.statSubtitle}>Enviadas</Text>
                                    <View style={[styles.statBar, { backgroundColor: '#BFDBFE' }]}>
                                        <View style={[styles.statBarFill, { width: '80%', backgroundColor: '#3B82F6' }]} />
                                    </View>
                                </TouchableOpacity>
                            </AnimatedCard>

                            <AnimatedCard style={styles.statCard} delay={300}>
                                <TouchableOpacity
                                    style={styles.statCardInner}
                                    onPress={onNavigateToQuotations}
                                    activeOpacity={0.9}
                                >
                                    <LinearGradient
                                        colors={['#D1FAE5', '#A7F3D0']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.iconContainerGradient}
                                    >
                                        <Ionicons name="trophy-outline" size={28} color="#10B981" />
                                    </LinearGradient>
                                    <Text style={styles.statNumber}>{stats.wonQuotations}</Text>
                                    <Text style={styles.statSubtitle}>Ganadas</Text>
                                    <View style={[styles.statBar, { backgroundColor: '#A7F3D0' }]}>
                                        <View style={[styles.statBarFill, { width: '90%', backgroundColor: '#10B981' }]} />
                                    </View>
                                </TouchableOpacity>
                            </AnimatedCard>
                        </View>

                        {/* Invitaciones Recientes */}
                        <AnimatedCard delay={400}>
                            <View style={styles.recentSection}>
                                <View style={styles.sectionHeader}>
                                    <View>
                                        <Text style={styles.sectionTitle}>Invitaciones Recientes</Text>
                                        <Text style={styles.sectionSubtitle}>
                                            {recentInvitations.length} solicitudes activas
                                        </Text>
                                    </View>
                                    {recentInvitations.length > 0 && (
                                        <TouchableOpacity
                                            onPress={onNavigateToQuotations}
                                            style={styles.seeAllButton}
                                        >
                                            <Text style={styles.seeAllLink}>Ver todo</Text>
                                            <Ionicons name="arrow-forward" size={16} color="#003E85" />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {recentInvitations.length > 0 ? (
                                    recentInvitations.map((invitation, index) => (
                                        <TouchableOpacity
                                            key={invitation.id}
                                            style={[
                                                styles.invitationRow,
                                                index === recentInvitations.length - 1 && styles.invitationRowLast
                                            ]}
                                            onPress={onNavigateToQuotations}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.invitationContent}>
                                                <LinearGradient
                                                    colors={index === 0 ? ['#DBEAFE', '#BFDBFE'] : ['#F3F4F6', '#E5E7EB']}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 1 }}
                                                    style={styles.invitationIconBox}
                                                >
                                                    <Ionicons
                                                        name="document-text-outline"
                                                        size={22}
                                                        color={index === 0 ? '#003E85' : '#6B7280'}
                                                    />
                                                </LinearGradient>
                                                <View style={styles.invitationDetails}>
                                                    <Text style={styles.invitationId}>
                                                        Solicitud #{invitation.requestId.slice(-6).toUpperCase()}
                                                    </Text>
                                                    <View style={styles.invitationMeta}>
                                                        <View style={[
                                                            styles.statusBadge,
                                                            invitation.status === 'pending' && styles.statusBadgeNew
                                                        ]}>
                                                            <View style={styles.statusDotSmall} />
                                                            <Text style={styles.invitationStatus}>
                                                                {invitation.status === 'pending' ? 'Nueva' : 'Pendiente'}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>
                                            <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <View style={styles.emptyContainer}>
                                        <View style={styles.emptyIconContainer}>
                                            <LinearGradient
                                                colors={['#F3F4F6', '#E5E7EB']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={styles.emptyIconBg}
                                            >
                                                <Ionicons name="checkmark-done-outline" size={40} color="#9CA3AF" />
                                            </LinearGradient>
                                        </View>
                                        <Text style={styles.emptyText}>¡Todo al día!</Text>
                                        <Text style={styles.emptySubtext}>
                                            No tienes invitaciones pendientes por ahora.
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </AnimatedCard>
                    </View>
                </ScrollView>
            </View>
        </ResponsiveNavShell>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    contentConstraint: {
        width: '100%',
        maxWidth: 1200,
        alignSelf: 'center',
        paddingHorizontal: 20,
    },
    headerGradient: {
        paddingTop: Platform.OS === 'ios' ? 50 : 40,
        // CORRECCIÓN: Aumentado el padding inferior para asegurar espacio para la tarjeta flotante
        paddingBottom: 70,
        width: '100%',
        alignItems: 'center',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        // Eliminado position: relative innecesario en este contexto
    },
    headerWeb: {
        paddingTop: 30,
        paddingBottom: 80, // Más espacio en web
    },
    headerFlex: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    greetingContainer: {
        flex: 1,
        position: 'relative',
    },
    greeting: {
        fontSize: 15,
        color: '#93C5FD',
        fontWeight: '600',
        marginBottom: 6,
        letterSpacing: 0.3,
    },
    userName: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    statusDot: {
        position: 'absolute',
        top: 6,
        right: -12,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dotInner: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#FFFFFF',
    },
    notificationButton: {
        position: 'relative',
    },
    notificationIconBg: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        padding: 12,
        borderRadius: 16,
        ...Platform.select({
            web: { backdropFilter: 'blur(10px)' },
            default: {}
        }),
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#EF4444',
        borderRadius: 12,
        minWidth: 22,
        height: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#003E85',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 4,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: 'bold',
    },
    scrollView: {
        flex: 1,
    },

    // Tarjeta Principal EPI
    mainCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        marginTop: -30, // Se mantiene el margen negativo para el efecto visual
        shadowColor: "#003E85",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,
        marginBottom: 32,
        overflow: 'hidden',
    },
    mainCardWeb: {
        marginTop: -40,
    },
    mainCardGradient: {
        borderRadius: 28,
    },
    mainCardInner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 28,
    },
    scoreInfoContainer: {
        flex: 1,
        paddingRight: 16,
    },
    scoreBadge: {
        alignSelf: 'flex-start',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
        shadowColor: '#003E85',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    scoreBadgeGradient: {
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    scoreBadgeText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 11,
        letterSpacing: 1,
    },
    epiLabel: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 6,
        letterSpacing: 0.3,
    },
    epiDescription: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
        marginBottom: 12,
    },
    scoreMetrics: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    metricItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    metricText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10B981',
    },
    scoreContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreRing: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 8,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        zIndex: 2,
    },
    scoreCircleInner: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    scoreValue: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFF',
        lineHeight: 32,
        includeFontPadding: false,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    scoreMax: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.95)',
        fontWeight: '600',
        includeFontPadding: false,
    },
    scoreGlow: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        zIndex: 1,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 28,
        paddingVertical: 18,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    footerText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#003E85',
        letterSpacing: 0.2,
    },
    arrowContainer: {
        backgroundColor: '#DBEAFE',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Section Title
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 18,
        letterSpacing: 0.3,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
        fontWeight: '500',
    },

    // Stats Cards
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
        gap: 14,
    },
    statsRowWeb: {
        gap: 20,
    },
    statsRowTablet: {
        gap: 16,
    },
    statCard: {
        flex: 1,
    },
    statCardInner: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    iconContainerGradient: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statNumber: {
        fontSize: 32,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    statSubtitle: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
        marginBottom: 12,
        letterSpacing: 0.3,
    },
    statBar: {
        width: '100%',
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
        marginTop: 4,
    },
    statBarFill: {
        height: '100%',
        borderRadius: 2,
    },

    // Recent Section
    recentSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 4,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
    },
    seeAllLink: {
        fontSize: 14,
        fontWeight: '700',
        color: '#003E85',
        letterSpacing: 0.2,
    },
    invitationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 10,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.03,
                shadowRadius: 4,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    invitationRowLast: {
        borderBottomWidth: 0,
        marginBottom: 0,
    },
    invitationContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    invitationIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    invitationDetails: {
        flex: 1,
    },
    invitationId: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 6,
        letterSpacing: 0.2,
    },
    invitationMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 6,
    },
    statusBadgeNew: {
        backgroundColor: '#DBEAFE',
    },
    statusDotSmall: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#6B7280',
    },
    invitationStatus: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '600',
    },

    // Empty State
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 48,
        paddingHorizontal: 24,
    },
    emptyIconContainer: {
        marginBottom: 20,
    },
    emptyIconBg: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 8,
        letterSpacing: 0.3,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 20,
        maxWidth: 260,
    },
});

export default SupplierDashboardScreen;