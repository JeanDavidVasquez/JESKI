/**
 * NotificationsScreen - Diseño Visual Mejorado
 * Mejoras: Cards con márgenes, gradientes, animaciones, mejor espaciado,
 * diseño más limpio y moderno tanto para móvil como web
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
    Platform,
    useWindowDimensions,
    Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NotificationService } from '../../services/notificationService';
import { AppNotification, NotificationType } from '../../types';
import { theme } from '../../styles/theme';

interface NotificationsScreenProps {
    userId: string;
    onNavigateBack: () => void;
    onNavigateToRequest?: (requestId: string) => void;
    onNavigateToQuotation?: (quotationId: string) => void;
}

// Componente de Notificación Animada
const AnimatedNotificationCard: React.FC<{
    notification: AppNotification;
    icon: { name: string; color: string };
    onPress: () => void;
    formatTime: (timestamp: any) => string;
    index: number;
}> = ({ notification, icon, onPress, formatTime, index }) => {
    const fadeAnim = new Animated.Value(0);
    const slideAnim = new Animated.Value(20);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay: index * 50,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                delay: index * 50,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
            }}
        >
            <TouchableOpacity
                style={[
                    styles.notificationCard,
                    !notification.read && styles.notificationCardUnread
                ]}
                onPress={onPress}
                activeOpacity={0.7}
            >
                <LinearGradient
                    colors={
                        notification.read
                            ? ['#FFFFFF', '#FAFAFA']
                            : ['#F0F9FF', '#E0F2FE']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardGradient}
                >
                    <View style={styles.cardContent}>
                        <View style={[styles.iconContainer, { backgroundColor: `${icon.color}15` }]}>
                            <LinearGradient
                                colors={[`${icon.color}40`, `${icon.color}20`]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.iconGradient}
                            >
                                <Ionicons name={icon.name as any} size={26} color={icon.color} />
                            </LinearGradient>
                        </View>

                        <View style={styles.notificationContent}>
                            <View style={styles.titleRow}>
                                <Text style={styles.notificationTitle} numberOfLines={1}>
                                    {notification.title}
                                </Text>
                                {!notification.read && <View style={styles.unreadDot} />}
                            </View>
                            <Text style={styles.notificationMessage} numberOfLines={2}>
                                {notification.message}
                            </Text>
                            <View style={styles.timeRow}>
                                <Ionicons name="time-outline" size={12} color="#94A3B8" />
                                <Text style={styles.notificationTime}>
                                    {formatTime(notification.createdAt)}
                                </Text>
                            </View>
                        </View>

                        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
};

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
    userId,
    onNavigateBack,
    onNavigateToRequest,
    onNavigateToQuotation,
}) => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    const { width: windowWidth } = useWindowDimensions();
    const isDesktop = windowWidth >= 1024;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;

    useEffect(() => {
        loadNotifications();
    }, [userId]);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const notifs = await NotificationService.getUserNotifications(userId);
            setNotifications(notifs);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadNotifications();
    };

    const handleMarkAllRead = async () => {
        try {
            await NotificationService.markAllAsRead(userId);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleNotificationPress = async (notification: AppNotification) => {
        if (!notification.read) {
            await NotificationService.markAsRead(notification.id);
            setNotifications(prev =>
                prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
            );
        }

        if (notification.relatedId) {
            if (notification.relatedType === 'request') {
                onNavigateToRequest?.(notification.relatedId);
            } else if (notification.relatedType === 'quotation') {
                onNavigateToQuotation?.(notification.relatedId);
            }
        }
    };

    const getNotificationIcon = (type: NotificationType): { name: string; color: string } => {
        switch (type) {
            case 'quotation_invitation':
                return { name: 'mail-outline', color: '#3B82F6' };
            case 'quotation_received':
                return { name: 'document-text-outline', color: '#10B981' };
            case 'quotation_winner':
                return { name: 'trophy-outline', color: '#F59E0B' };
            case 'quotation_not_selected':
                return { name: 'close-circle-outline', color: '#EF4444' };
            case 'request_status_change':
                return { name: 'refresh-outline', color: '#8B5CF6' };
            case 'supplier_selected':
                return { name: 'checkmark-circle-outline', color: '#10B981' };
            case 'comment_received':
                return { name: 'chatbubble-outline', color: '#EC4899' };
            default:
                return { name: 'notifications-outline', color: '#64748B' };
        }
    };

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Ahora mismo';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 7) return `Hace ${diffDays}d`;
        return date.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#003E85" />
                <Text style={styles.loadingText}>Cargando notificaciones...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header Mejorado */}
            <LinearGradient
                colors={['#001F3F', '#003E85', '#0056B3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, isDesktop && styles.headerWeb]}
            >
                <View style={[styles.headerContent, isDesktop && styles.headerContentWeb]}>
                    <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
                        <View style={styles.backButtonInner}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </View>
                    </TouchableOpacity>
                    
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>Notificaciones</Text>
                        {unreadCount > 0 && (
                            <View style={styles.headerBadge}>
                                <Text style={styles.headerBadgeText}>{unreadCount}</Text>
                            </View>
                        )}
                    </View>

                    {unreadCount > 0 ? (
                        <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllButton}>
                            <View style={styles.markAllButtonInner}>
                                <Ionicons name="checkmark-done" size={22} color="#FFF" />
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 44 }} />
                    )}
                </View>
            </LinearGradient>

            {/* Banner de no leídas mejorado */}
            {unreadCount > 0 && (
                <View style={styles.unreadBanner}>
                    <LinearGradient
                        colors={['#DBEAFE', '#BFDBFE']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.unreadBannerGradient}
                    >
                        <View style={styles.unreadBannerContent}>
                            <Ionicons name="mail-unread-outline" size={18} color="#003E85" />
                            <Text style={styles.unreadText}>
                                {unreadCount} notificación{unreadCount !== 1 ? 'es' : ''} sin leer
                            </Text>
                        </View>
                    </LinearGradient>
                </View>
            )}

            <ScrollView
                style={styles.content}
                contentContainerStyle={[
                    styles.contentContainer,
                    isDesktop && styles.contentContainerWeb
                ]}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh}
                        tintColor="#003E85"
                        colors={['#003E85']}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.listContainer, isDesktop && styles.listContainerWeb]}>
                    {notifications.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconContainer}>
                                <LinearGradient
                                    colors={['#F1F5F9', '#E2E8F0']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.emptyIconGradient}
                                >
                                    <Ionicons name="notifications-off-outline" size={50} color="#94A3B8" />
                                </LinearGradient>
                            </View>
                            <Text style={styles.emptyTitle}>Sin notificaciones</Text>
                            <Text style={styles.emptyText}>
                                Aquí aparecerán las notificaciones de tus{'\n'}
                                cotizaciones y solicitudes
                            </Text>
                        </View>
                    ) : (
                        <>
                            {notifications.map((notification, index) => {
                                const icon = getNotificationIcon(notification.type);
                                return (
                                    <AnimatedNotificationCard
                                        key={notification.id}
                                        notification={notification}
                                        icon={icon}
                                        onPress={() => handleNotificationPress(notification)}
                                        formatTime={formatTime}
                                        index={index}
                                    />
                                );
                            })}
                        </>
                    )}
                </View>
                <View style={{ height: 20 }} />
            </ScrollView>
        </View>
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
    header: {
        paddingTop: Platform.OS === 'ios' ? 50 : 40,
        paddingBottom: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerWeb: {
        paddingTop: 30,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    headerContentWeb: {
        maxWidth: 1200,
        width: '100%',
        alignSelf: 'center',
    },
    backButton: {
        width: 44,
    },
    backButtonInner: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            web: { backdropFilter: 'blur(10px)' },
            default: {}
        }),
    },
    headerCenter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    headerBadge: {
        backgroundColor: '#EF4444',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
        borderWidth: 2,
        borderColor: '#003E85',
    },
    headerBadgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    markAllButton: {
        width: 44,
    },
    markAllButtonInner: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            web: { backdropFilter: 'blur(10px)' },
            default: {}
        }),
    },
    unreadBanner: {
        overflow: 'hidden',
        marginTop: -10,
    },
    unreadBannerGradient: {
        paddingVertical: 14,
        paddingHorizontal: 20,
    },
    unreadBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        maxWidth: 1200,
        width: '100%',
        alignSelf: 'center',
    },
    unreadText: {
        color: '#003E85',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        flexGrow: 1,
        paddingTop: 20,
    },
    contentContainerWeb: {
        alignItems: 'center',
    },
    listContainer: {
        paddingHorizontal: 16,
        gap: 12,
    },
    listContainerWeb: {
        width: '100%',
        maxWidth: 800,
        paddingHorizontal: 20,
    },
    notificationCard: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 4,
    },
    notificationCardUnread: {
        shadowColor: "#003E85",
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 6,
    },
    cardGradient: {
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        gap: 14,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    iconGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationContent: {
        flex: 1,
        gap: 6,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        flex: 1,
        letterSpacing: 0.2,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#3B82F6',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
    },
    notificationMessage: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    notificationTime: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 100,
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        marginBottom: 24,
    },
    emptyIconGradient: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 10,
        letterSpacing: 0.3,
    },
    emptyText: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
    },
});

export default NotificationsScreen;