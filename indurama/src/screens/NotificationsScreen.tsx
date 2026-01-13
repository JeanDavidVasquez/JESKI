/**
 * NotificationsScreen - Pantalla de notificaciones in-app para todos los roles
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { NotificationService } from '../services/notificationService';
import { AppNotification, NotificationType } from '../types';
import { theme } from '../styles/theme';

interface NotificationsScreenProps {
    userId: string;
    onNavigateBack: () => void;
    onNavigateToRequest?: (requestId: string) => void;
    onNavigateToQuotation?: (quotationId: string) => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
    userId,
    onNavigateBack,
    onNavigateToRequest,
    onNavigateToQuotation,
}) => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

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
        // Marcar como leída
        if (!notification.read) {
            await NotificationService.markAsRead(notification.id);
            setNotifications(prev =>
                prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
            );
        }

        // Navegar según el tipo
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
                return { name: 'mail-outline', color: '#2196F3' };
            case 'quotation_received':
                return { name: 'document-text-outline', color: '#4CAF50' };
            case 'quotation_winner':
                return { name: 'trophy-outline', color: '#FFD700' };
            case 'quotation_not_selected':
                return { name: 'close-circle-outline', color: '#F44336' };
            case 'request_status_change':
                return { name: 'refresh-outline', color: '#FFA726' };
            case 'supplier_selected':
                return { name: 'checkmark-circle-outline', color: '#4CAF50' };
            case 'comment_received':
                return { name: 'chatbubble-outline', color: '#9C27B0' };
            default:
                return { name: 'notifications-outline', color: '#666' };
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

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 7) return `Hace ${diffDays}d`;
        return date.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notificaciones</Text>
                {unreadCount > 0 && (
                    <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllButton}>
                        <Ionicons name="checkmark-done" size={20} color="#FFF" />
                    </TouchableOpacity>
                )}
                {unreadCount === 0 && <View style={{ width: 40 }} />}
            </View>

            {/* Unread Count Banner */}
            {unreadCount > 0 && (
                <View style={styles.unreadBanner}>
                    <Text style={styles.unreadText}>
                        {unreadCount} notificación{unreadCount !== 1 ? 'es' : ''} sin leer
                    </Text>
                </View>
            )}

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {notifications.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="notifications-off-outline" size={64} color="#CCC" />
                        <Text style={styles.emptyTitle}>Sin notificaciones</Text>
                        <Text style={styles.emptyText}>
                            Aquí aparecerán las notificaciones de tus cotizaciones y solicitudes
                        </Text>
                    </View>
                ) : (
                    notifications.map(notification => {
                        const icon = getNotificationIcon(notification.type);
                        return (
                            <TouchableOpacity
                                key={notification.id}
                                style={[styles.notificationCard, !notification.read && styles.notificationCardUnread]}
                                onPress={() => handleNotificationPress(notification)}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: `${icon.color}20` }]}>
                                    <Ionicons name={icon.name as any} size={24} color={icon.color} />
                                </View>
                                <View style={styles.notificationContent}>
                                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                                    <Text style={styles.notificationMessage} numberOfLines={2}>
                                        {notification.message}
                                    </Text>
                                    <Text style={styles.notificationTime}>{formatTime(notification.createdAt)}</Text>
                                </View>
                                {!notification.read && <View style={styles.unreadDot} />}
                            </TouchableOpacity>
                        );
                    })
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
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
        backgroundColor: theme.colors.primary,
        paddingTop: Platform.OS === 'ios' ? 50 : 40,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    markAllButton: {
        padding: 8,
    },
    unreadBanner: {
        backgroundColor: '#E3F2FD',
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    unreadText: {
        color: theme.colors.primary,
        fontSize: 13,
        fontWeight: '500',
    },
    content: {
        flex: 1,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
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
        textAlign: 'center',
        marginTop: 8,
    },
    notificationCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    notificationCardUnread: {
        backgroundColor: '#F8FBFF',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    notificationMessage: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
        marginBottom: 6,
    },
    notificationTime: {
        fontSize: 11,
        color: '#999',
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.primary,
        alignSelf: 'center',
    },
});

export default NotificationsScreen;
