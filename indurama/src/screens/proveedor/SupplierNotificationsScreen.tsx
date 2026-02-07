/**
 * SupplierNotificationsScreen
 * Pantalla de notificaciones para proveedores usando estilos estandarizados
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ResponsiveNavShell } from '../../components/ResponsiveNavShell';
import { NotificationService } from '../../services/notificationService';
import { AppNotification } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { theme } from '../../styles/theme';
import {
    proveedorHeaderStyles,
    proveedorContentStyles,
    proveedorNotificationStyles,
    proveedorButtonStyles,
    proveedorGradientHeaderStyles,
    HEADER_GRADIENT_COLORS,
} from './proveedorStyles';

interface SupplierNotificationsScreenProps {
    onNavigateToQuotations: () => void;
    onNavigateToProfile: () => void;
    onNavigateToNotifications: () => void;
    onLogout: () => void;
    onNavigateToDashboard: () => void;
}

export const SupplierNotificationsScreen: React.FC<SupplierNotificationsScreenProps> = ({
    onNavigateToQuotations,
    onNavigateToProfile,
    onNavigateToNotifications,
    onLogout,
    onNavigateToDashboard,
}) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const { t } = useTranslation();

    const navItems = [
        { key: 'Dashboard', label: t('navigation.home'), iconName: 'home' as any, onPress: onNavigateToDashboard },
        { key: 'Quotations', label: t('navigation.quotations'), iconName: 'pricetags-outline' as any, onPress: onNavigateToQuotations },
        { key: 'Profile', label: t('navigation.profile'), iconName: 'person-outline' as any, onPress: onNavigateToProfile },
        { key: 'Logout', label: t('auth.logout'), iconName: 'log-out-outline' as any, onPress: onLogout },
    ];

    const loadNotifications = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const data = await NotificationService.getUserNotifications(user.id, 50);
            setNotifications(data);
        } catch (error) {
            console.error('Error loading notifications:', error);
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
            console.error('Error marking as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!user?.id) return;
        try {
            await NotificationService.markAllAsRead(user.id);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'quotation_invitation':
                return { name: 'mail-outline' as const, color: theme.colors.primary };
            case 'quotation_received':
                return { name: 'document-text-outline' as const, color: theme.colors.success };
            case 'quotation_winner':
                return { name: 'trophy-outline' as const, color: '#FFD700' };
            case 'quotation_not_selected':
                return { name: 'close-circle-outline' as const, color: theme.colors.error };
            case 'request_status_change':
                return { name: 'sync-outline' as const, color: theme.colors.primary };
            case 'supplier_selected':
                return { name: 'checkmark-circle-outline' as const, color: theme.colors.success };
            default:
                return { name: 'notifications-outline' as const, color: theme.colors.text.muted };
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

        if (diffMins < 1) return t('time.justNow');
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString('es-ES');
    };

    const getTranslatedTitle = (title: string) => {
        if (title === '¡Felicitaciones!' || title === '🏆 ¡Felicitaciones!') return t('notifications.congratulations');
        if (title === 'Resultado de Cotización') return t('notifications.quotationResult');
        if (title === 'Nueva Invitación a Cotizar') return t('notifications.newInvitation');
        if (title === 'Proveedor Seleccionado') return t('notifications.supplierSelected');
        if (title === 'Cotización Recibida') return t('notifications.quotationReceived');
        return title;
    };

    const getTranslatedMessage = (message: string) => {
        if (!message) return '';
        if (message.startsWith('Has sido invitado a cotizar')) {
            const code = message.split('#')[1]?.trim() || '';
            return t('notifications.invitationMessage', { code });
        }
        if (message.startsWith('Tu oferta fue seleccionada')) {
            const code = message.split('#')[1]?.trim() || '';
            return t('notifications.quotationWinnerMessage', { code });
        }
        if (message.startsWith('Gracias por participar')) {
            const parts = message.split('#');
            if (parts.length > 1) {
                const code = parts[1].split('.')[0].trim().split(' ')[0];
                return t('notifications.quotationRejectedMessage', { code });
            }
        }
        return message;
    };

    const renderNotification = ({ item }: { item: AppNotification }) => {
        const icon = getNotificationIcon(item.type);

        return (
            <TouchableOpacity
                style={[proveedorNotificationStyles.item, !item.read && proveedorNotificationStyles.unreadItem]}
                onPress={() => handleMarkAsRead(item.id)}
            >
                <View style={[proveedorNotificationStyles.iconContainer, { backgroundColor: icon.color + '20' }]}>
                    <Ionicons name={icon.name} size={24} color={icon.color} />
                </View>
                <View style={proveedorNotificationStyles.contentContainer}>
                    <Text style={[proveedorNotificationStyles.title, !item.read && proveedorNotificationStyles.unreadTitle]}>
                        {getTranslatedTitle(item.title)}
                    </Text>
                    <Text style={proveedorNotificationStyles.message} numberOfLines={2}>
                        {getTranslatedMessage(item.message)}
                    </Text>
                    <Text style={proveedorNotificationStyles.timestamp}>{formatDate(item.createdAt)}</Text>
                </View>
                {!item.read && <View style={proveedorNotificationStyles.unreadDot} />}
            </TouchableOpacity>
        );
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <ResponsiveNavShell
            currentScreen="Notifications"
            navItems={navItems}
            logo={require('../../../assets/icono_indurama.png')}
            onNavigateToNotifications={onNavigateToNotifications}
        >
            <View style={proveedorContentStyles.container}>
                <StatusBar style="light" />

                {/* Header con Gradiente */}
                <LinearGradient
                    colors={HEADER_GRADIENT_COLORS}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={proveedorGradientHeaderStyles.rowContainer}
                >
                    <View>
                        <Text style={proveedorGradientHeaderStyles.title}>{t('navigation.notifications')}</Text>
                        {unreadCount > 0 && (
                            <Text style={proveedorGradientHeaderStyles.subtitle}>
                                {unreadCount} {t('notifications.unread')}
                            </Text>
                        )}
                    </View>
                    {unreadCount > 0 && (
                        <TouchableOpacity
                            onPress={handleMarkAllAsRead}
                            style={proveedorGradientHeaderStyles.actionButton}
                        >
                            <Text style={proveedorGradientHeaderStyles.actionButtonText}>{t('notifications.markAllAsRead')}</Text>
                        </TouchableOpacity>
                    )}
                </LinearGradient>

                {/* Lista de Notificaciones */}
                {notifications.length === 0 ? (
                    <View style={proveedorContentStyles.emptyState}>
                        <Ionicons name="notifications-off-outline" size={64} color={theme.colors.text.muted} />
                        <Text style={proveedorContentStyles.emptyText}>{t('notifications.noNotifications')}</Text>
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
                                colors={[theme.colors.primary]}
                                tintColor={theme.colors.primary}
                            />
                        }
                        contentContainerStyle={proveedorContentStyles.listContent}
                    />
                )}
            </View>
        </ResponsiveNavShell>
    );
};
