import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ResponsiveNavShell } from '../../components/ResponsiveNavShell';
import { NotificationService } from '../../services/notificationService';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { AppNotification } from '../../types';
import { getSolicitanteNavItems } from '../../navigation/solicitanteItems';
import { theme } from '../../styles/theme';
import { solicitanteHeaderStyles } from './solicitanteStyles';

/**
 * Pantalla de Notificaciones para Solicitante
 * Refactorizada con header estandarizado del Design System
 */

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
    const { t, currentLanguage } = useLanguage();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const loadNotifications = async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const notifs = await NotificationService.getUserNotifications(user.id);
            setNotifications(notifs);
            const count = notifs.filter(n => !n.read).length;
            setUnreadCount(count);
        } catch (error) {
            console.error('Error loading notifications:', error);
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
            case 'quotation_winner':
            case 'supplier_selected':
                return { name: 'trophy' as const, color: '#FFD700' };
            case 'quotation_invitation':
            case 'invitation':
                return { name: 'mail' as const, color: theme.colors.primary };
            case 'request_created':
                return { name: 'add-circle' as const, color: theme.colors.primary };
            case 'request_approved':
                return { name: 'checkmark-circle' as const, color: theme.colors.success };
            case 'request_rejected':
                return { name: 'close-circle' as const, color: theme.colors.error };
            case 'rectification_required':
                return { name: 'alert-circle' as const, color: theme.colors.warning };
            default:
                return { name: 'notifications' as const, color: theme.colors.text.muted };
        }
    };

    const navItems = getSolicitanteNavItems(t, {
        onNavigateToDashboard,
        onNavigateToNewRequest,
        onNavigateToHistory,
        onNavigateToProfile,
    });

    const formatNotificationDate = (dateVal: any) => {
        if (!dateVal) return '';
        let date: Date;
        if (dateVal?.toDate) {
            date = dateVal.toDate();
        } else if (dateVal?.seconds) {
            date = new Date(dateVal.seconds * 1000);
        } else {
            date = new Date(dateVal);
        }
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString(currentLanguage === 'es' ? 'es-ES' : 'en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getLocalizedContent = (item: AppNotification) => {
        if (item.type === 'supplier_selected' || item.type === 'quotation_winner') {
            const match = item.message.match(/Se seleccionó a (.+) para tu solicitud #(.+)/) ||
                item.message.match(/Selected (.+) for request #(.+)/);
            if (match) {
                return {
                    title: t('appNotifications.providerSelectedTitle'),
                    message: t('appNotifications.providerSelectedMessage', { supplier: match[1], code: match[2] })
                };
            }
        }
        if (item.type === 'request_created') {
            const match = item.message.match(/Has creado exitosamente la solicitud ([^.]+)/);
            if (match) {
                return {
                    title: t('appNotifications.requestCreatedTitle'),
                    message: t('appNotifications.requestCreatedMessage', { code: match[1] })
                };
            }
        }
        if (item.type === 'request_approved') {
            const match = item.message.match(/Tu solicitud (.+) ha sido validada/);
            if (match) {
                return {
                    title: t('appNotifications.requestValidatedTitle'),
                    message: t('appNotifications.requestValidatedMessage', { code: match[1] })
                };
            }
        }
        return { title: item.title, message: item.message };
    };

    const renderNotification = ({ item }: { item: AppNotification }) => {
        const icon = getNotificationIcon(item.type);
        const { title, message } = getLocalizedContent(item);

        return (
            <TouchableOpacity
                style={[styles.notificationItem, !item.read && styles.unreadItem]}
                onPress={() => handleMarkAsRead(item.id)}
            >
                <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
                    <Ionicons name={icon.name} size={24} color={icon.color} />
                </View>
                <View style={styles.contentContainer}>
                    <Text style={[styles.notificationTitle, !item.read && styles.unreadTitle]}>
                        {title}
                    </Text>
                    <Text style={styles.notificationMessage} numberOfLines={2}>
                        {message}
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
            logo={require('../../../assets/icono_indurama.png')}
            onNavigateToNotifications={onNavigateToNotifications}
        >
            {/* Header Estandarizado */}
            <View style={[solicitanteHeaderStyles.container, styles.headerRow]}>
                <View>
                    <Text style={solicitanteHeaderStyles.title}>{t('appNotifications.title')}</Text>
                    {unreadCount > 0 && (
                        <Text style={solicitanteHeaderStyles.subtitle}>
                            {t('appNotifications.unread', { count: unreadCount })}
                        </Text>
                    )}
                </View>
                {unreadCount > 0 && (
                    <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
                        <Text style={styles.markAllText}>{t('appNotifications.markAllRead')}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Lista de Notificaciones */}
            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
            ) : notifications.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="notifications-off-outline" size={64} color={theme.colors.text.muted} />
                    <Text style={styles.emptyText}>{t('appNotifications.emptyList')}</Text>
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
        </ResponsiveNavShell>
    );
};

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    markAllButton: {
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[2],
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.base,
    },
    markAllText: {
        color: theme.colors.white,
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
        color: theme.colors.text.muted,
        marginTop: theme.spacing[4],
    },
    listContent: {
        padding: theme.spacing[4],
    },
    notificationItem: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing[4],
        marginBottom: theme.spacing[3],
        flexDirection: 'row',
        alignItems: 'flex-start',
        ...theme.shadows.sm,
    },
    unreadItem: {
        backgroundColor: '#E3F2FD',
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing[3],
    },
    contentContainer: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing[1],
    },
    unreadTitle: {
        fontWeight: '700',
    },
    notificationMessage: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing[2],
        lineHeight: 20,
    },
    timestamp: {
        fontSize: 12,
        color: theme.colors.text.muted,
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.primary,
        marginLeft: theme.spacing[2],
        marginTop: theme.spacing[1],
    },
});
