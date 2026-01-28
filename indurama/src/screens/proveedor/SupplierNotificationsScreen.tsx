/**
 * SupplierNotificationsScreen
 * Pantalla de notificaciones para proveedores que se muestra dentro del ResponsiveNavShell
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ResponsiveNavShell } from '../../components/ResponsiveNavShell';
import { NotificationService } from '../../services/notificationService';
import { AppNotification } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface SupplierNotificationsScreenProps {
    onNavigateToQuotations: () => void;
    onNavigateToProfile: () => void;
    onNavigateToNotifications: () => void;
    onLogout: () => void;
}

export const SupplierNotificationsScreen: React.FC<SupplierNotificationsScreenProps> = ({
    onNavigateToQuotations,
    onNavigateToProfile,
    onNavigateToNotifications,
    onLogout,
}) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const navItems = [
        { key: 'Dashboard', label: 'Inicio', iconName: 'home' as any, onPress: () => { } },
        { key: 'Quotations', label: 'Cotizaciones', iconName: 'pricetags-outline' as any, onPress: onNavigateToQuotations },
        { key: 'Profile', label: 'Perfil', iconName: 'person-outline' as any, onPress: onNavigateToProfile },
        { key: 'Logout', label: 'Salir', iconName: 'log-out-outline' as any, onPress: onLogout },
    ];

    const loadNotifications = async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const data = await NotificationService.getUserNotifications(user.id, 50);
            setNotifications(data);
        } catch (error) {
            console.error('Error cargando notificaciones:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            loadNotifications();
        }
    }, [user?.id]);

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await NotificationService.markAsRead(notificationId);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            );
        } catch (error) {
            console.error('Error marcando notificación como leída:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!user?.id) return;

        try {
            await NotificationService.markAllAsRead(user.id);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Error marcando todas como leídas:', error);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'quotation_invitation':
                return { name: 'mail-outline' as const, color: '#667eea' };
            case 'quotation_received':
                return { name: 'document-text-outline' as const, color: '#4CAF50' };
            case 'quotation_winner':
                return { name: 'trophy-outline' as const, color: '#FFD700' };
            case 'quotation_not_selected':
                return { name: 'close-circle-outline' as const, color: '#FF5252' };
            case 'request_status_change':
                return { name: 'sync-outline' as const, color: '#2196F3' };
            case 'supplier_selected':
                return { name: 'checkmark-circle-outline' as const, color: '#4CAF50' };
            default:
                return { name: 'notifications-outline' as const, color: '#757575' };
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins}m`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 7) return `Hace ${diffDays}d`;
        return date.toLocaleDateString('es-ES');
    };

    const renderNotification = ({ item }: { item: AppNotification }) => {
        const icon = getNotificationIcon(item.type);

        return (
            <TouchableOpacity
                style={[styles.notificationItem, !item.read && styles.unreadNotification]}
                onPress={() => handleMarkAsRead(item.id)}
            >
                <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
                    <Ionicons name={icon.name} size={24} color={icon.color} />
                </View>
                <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>{item.title}</Text>
                    <Text style={styles.notificationMessage} numberOfLines={2}>
                        {item.message}
                    </Text>
                    <Text style={styles.notificationTime}>{formatDate(item.createdAt)}</Text>
                </View>
                {!item.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
        );
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <ResponsiveNavShell
            currentScreen="Notifications"
            navItems={navItems}
            title="INDURAMA"
            logo={require('../../../assets/icono_indurama.png')}
            onNavigateToNotifications={onNavigateToNotifications}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Notificaciones</Text>
                        {unreadCount > 0 && (
                            <Text style={styles.unreadCount}>
                                {unreadCount} sin leer
                            </Text>
                        )}
                    </View>
                    {unreadCount > 0 && (
                        <TouchableOpacity
                            onPress={handleMarkAllAsRead}
                            style={styles.markAllButton}
                        >
                            <Text style={styles.markAllText}>Marcar todas</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Notifications List */}
                {notifications.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>No tienes notificaciones</Text>
                    </View>
                ) : (
                    <FlatList
                        data={notifications}
                        renderItem={renderNotification}
                        keyExtractor={item => item.id}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={() => {
                                    setRefreshing(true);
                                    loadNotifications();
                                }}
                            />
                        }
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </View>
        </ResponsiveNavShell>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#333',
    },
    unreadCount: {
        fontSize: 14,
        color: '#667eea',
        marginTop: 2,
    },
    markAllButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#f0f0f0',
        borderRadius: 6,
    },
    markAllText: {
        fontSize: 14,
        color: '#667eea',
        fontWeight: '600',
    },
    listContent: {
        paddingBottom: 20,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    unreadNotification: {
        backgroundColor: '#f8f9ff',
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
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    notificationMessage: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 4,
    },
    notificationTime: {
        fontSize: 12,
        color: '#999',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#667eea',
        marginLeft: 8,
        marginTop: 8,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 16,
    },
});
