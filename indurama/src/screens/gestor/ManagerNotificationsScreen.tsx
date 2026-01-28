import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ResponsiveNavShell } from '../../components/ResponsiveNavShell';
import { NotificationService } from '../../services/notificationService';
import { useAuth } from '../../hooks/useAuth';
import { AppNotification } from '../../types';
import { auth } from '../../services';
import { onAuthStateChanged } from 'firebase/auth';

interface ManagerNotificationsScreenProps {
    onNavigateToDashboard: () => void;
    onNavigateToRequests: () => void;
    onNavigateToSuppliers: () => void;
    onNavigateToProfile: () => void;
    onNavigateToNotifications?: () => void;
    currentUserOverride?: any; // New prop for bypass
}

export const ManagerNotificationsScreen: React.FC<ManagerNotificationsScreenProps> = ({
    onNavigateToDashboard,
    onNavigateToRequests,
    onNavigateToSuppliers,
    onNavigateToProfile,
    onNavigateToNotifications,
    currentUserOverride,
}) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    // --- FALLBACK AUTH LOGIC ---
    // If context user is missing, try to get it directly from Firebase Auth
    // This fixes the issue where reloading the page loses the context state temporarily
    const [fallbackUser, setFallbackUser] = useState<any>(null);
    // Priority: Prop > Context > Fallback > Auto-detect
    const activeUser = currentUserOverride || user || fallbackUser;

    useEffect(() => {
        // Listen for Firebase Auth state changes directly
        // This is crucial for page reloads where auth restores asynchronously
        console.log('ManagerNotifications: Setting up auth listener');
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                console.log('ManagerNotifications: Auth State Changed -> Found User:', firebaseUser.uid);
                setFallbackUser({ id: firebaseUser.uid, role: 'gestor' });
            } else {
                console.log('ManagerNotifications: Auth State Changed -> No User');
            }
        });

        return () => unsubscribe();
    }, []);

    const loadNotifications = async () => {
        // Use activeUser (either from context or fallback)
        const targetUserId = activeUser?.id;

        if (!targetUserId) {
            console.log('ManagerNotifications: No user ID available (Context or Firebase)');
            // Check one last time directly
            const directUser = auth.currentUser;
            if (directUser) {
                console.log('ManagerNotifications: LAST RESORT FOUND USER:', directUser.uid);
                // Call recursively or just set it and continue
                // Let's just create a local var to proceed
                // strict mode limitation prevents variable reassignment, so we'll just handle it in the next lines
            } else {
                return;
            }
        }

        const finalUserId = targetUserId || auth.currentUser?.uid;

        if (!finalUserId) {
            return;
        }

        try {
            console.log('ManagerNotifications: Loading notifications for user', finalUserId);
            setLoading(true);
            const notifs = await NotificationService.getUserNotifications(finalUserId);
            console.log('ManagerNotifications: Loaded', notifs.length, 'notifications');
            setNotifications(notifs);
            const count = notifs.filter(n => !n.read).length;
            setUnreadCount(count);

            // If we are functioning on fallback, force a re-render of user info if possible
            if (!user && !fallbackUser) {
                setFallbackUser({ id: finalUserId, role: 'gestor (autodetected)' });
            }

        } catch (error) {
            console.error('ManagerNotifications: Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Effect triggers when user ID changes (context or fallback)
    useEffect(() => {
        if (activeUser?.id) {
            loadNotifications();
        } else {
            // Try to load anyway, loadNotifications has internal fallback
            const timeout = setTimeout(() => {
                loadNotifications();
            }, 1000);
            return () => clearTimeout(timeout);
        }
    }, [activeUser?.id]);

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
            case 'new_request':
                return { name: 'document-text' as const, color: '#2196F3' };
            case 'quotation_submitted':
                return { name: 'pricetag' as const, color: '#FF9800' };
            case 'supplier_registered':
                return { name: 'people' as const, color: '#4CAF50' };
            case 'epi_submitted':
                return { name: 'clipboard' as const, color: '#9C27B0' };
            default:
                return { name: 'notifications' as const, color: '#9E9E9E' };
        }
    };

    const navItems = [
        { key: 'Dashboard', label: 'Dashboard', iconName: 'home' as const, onPress: onNavigateToDashboard },
        { key: 'Requests', label: 'Solicitudes', iconName: 'document-text' as const, onPress: onNavigateToRequests },
        { key: 'Suppliers', label: 'Proveedores', iconName: 'people' as const, onPress: onNavigateToSuppliers },
        { key: 'Profile', label: 'Perfil', iconName: 'person' as const, onPress: onNavigateToProfile },
    ];

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
                        {(() => {
                            if (!item.createdAt) return '';
                            const date = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
                            return date.toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                        })()}
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
