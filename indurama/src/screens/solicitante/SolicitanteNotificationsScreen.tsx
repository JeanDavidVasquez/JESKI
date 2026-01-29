import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ResponsiveNavShell } from '../../components/ResponsiveNavShell';
import { NotificationService } from '../../services/notificationService';
import { useAuth } from '../../hooks/useAuth';
import { AppNotification } from '../../types';

interface SolicitanteNotificationsScreenProps {
    onNavigateToDashboard: () => void;
    onNavigateToNewRequest: () => void;
    onNavigateToHistory: () => void;
    onNavigateToProfile: () => void;
    onNavigateToNotifications?: () => void;
}

export const SolicitanteNotificationsScreen: React.FC<SolicitanteNotificationsScreenProps> = ({
    onNavigateToDashboard,
    onNavigateToNewRequest,
    onNavigateToHistory,
    onNavigateToProfile,
    onNavigateToNotifications,
}) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const loadNotifications = async () => {
        if (!user?.id) {
            console.log('SolicitanteNotifications: No user ID');
            setLoading(false);
            return;
        }
        try {
            console.log('SolicitanteNotifications: Loading notifications for user', user.id);
            setLoading(true);
            const notifs = await NotificationService.getUserNotifications(user.id);
            console.log('SolicitanteNotifications: Loaded notifications', notifs.length);
            setNotifications(notifs);
            const count = notifs.filter(n => !n.read).length;
            setUnreadCount(count);
        } catch (error) {
            console.error('SolicitanteNotifications: Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, [user?.id]);

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await NotificationService.markAsRead(notificationId);
            loadNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!user?.id) return;
        try {
            await NotificationService.markAllAsRead(user.id);
            loadNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'quotation_awarded':
            case 'award':
            case 'supplier_selected': // Added
                return { name: 'trophy' as const, color: '#FFD700' };
            case 'quotation_invitation':
            case 'invitation':
                return { name: 'mail' as const, color: '#2196F3' };
            case 'request_created':
                return { name: 'add-circle' as const, color: '#2196F3' };
            case 'request_approved':
                return { name: 'checkmark-circle' as const, color: '#4CAF50' };
            case 'request_rejected':
                return { name: 'close-circle' as const, color: '#F44336' };
            case 'rectification_required': // Added
                return { name: 'alert-circle' as const, color: '#F57C00' };
            default:
                return { name: 'notifications' as const, color: '#9E9E9E' };
        }
    };

    const navItems = [
        { key: 'Dashboard', label: 'Dashboard', iconName: 'home' as const, onPress: onNavigateToDashboard },
        { key: 'NewRequest', label: 'Nueva Solicitud', iconName: 'add-circle' as const, onPress: onNavigateToNewRequest },
        { key: 'History', label: 'Historial', iconName: 'document-text' as const, onPress: onNavigateToHistory },
        { key: 'Profile', label: 'Perfil', iconName: 'person' as const, onPress: onNavigateToProfile },
    ];

    const formatNotificationDate = (dateVal: any) => {
        if (!dateVal) return '';

        let date: Date;

        // Handle Firestore Timestamp
        if (dateVal?.toDate) {
            date = dateVal.toDate();
        } else if (dateVal?.seconds) {
            // Handle raw Timestamp object if toDate is missing
            date = new Date(dateVal.seconds * 1000);
        } else {
            // Handle Date object, string or number
            date = new Date(dateVal);
        }

        // Check if date is valid
        if (isNaN(date.getTime())) return '';

        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const renderNotification = ({ item }: { item: AppNotification }) => {
        const icon = getNotificationIcon(item.type);
        return (
            <TouchableOpacity
                style={[styles.notificationItem, !item.read && styles.unreadItem]}
                onPress={() => handleMarkAsRead(item.id)}
            >
                <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
                    <Ionicons name={icon.name} size={24} color={icon.color} />
                </View>
                <View style={styles.contentContainer}>
                    <Text style={[styles.title, !item.read && styles.unreadTitle]}>
                        {item.title}
                    </Text>
                    <Text style={styles.message} numberOfLines={2}>
                        {item.message}
                    </Text>
                    <Text style={styles.timestamp}>
                        {formatNotificationDate(item.createdAt)}
                    </Text>
                </View>
                {!item.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
        );
    };

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
                {loading ? (
                    <ActivityIndicator size="large" color="#0D47A1" style={styles.loader} />
                ) : notifications.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="notifications-off-outline" size={64} color="#BDBDBD" />
                        <Text style={styles.emptyText}>No tienes notificaciones</Text>
                    </View>
                ) : (
                    <FlatList
                        data={notifications}
                        renderItem={renderNotification}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </ResponsiveNavShell>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#212121',
    },
    unreadCount: {
        fontSize: 14,
        color: '#757575',
        marginTop: 4,
    },
    markAllButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#0D47A1',
        borderRadius: 8,
    },
    markAllText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    loader: {
        marginTop: 40,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#9E9E9E',
        marginTop: 16,
    },
    listContent: {
        padding: 16,
    },
    notificationItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    unreadItem: {
        backgroundColor: '#E3F2FD',
        borderLeftWidth: 4,
        borderLeftColor: '#0D47A1',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    contentContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#212121',
        marginBottom: 4,
    },
    unreadTitle: {
        fontWeight: '700',
    },
    message: {
        fontSize: 14,
        color: '#757575',
        marginBottom: 8,
        lineHeight: 20,
    },
    timestamp: {
        fontSize: 12,
        color: '#9E9E9E',
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#0D47A1',
        marginLeft: 8,
        marginTop: 4,
    },
});
