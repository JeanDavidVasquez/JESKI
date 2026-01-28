/**
 * NotificationBell Component
 * Icono de campana de notificaciones con badge de contador
 */

import React, { useState, useEffect } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationService } from '../services/notificationService';
import { useAuth } from '../hooks/useAuth';

interface NotificationBellProps {
    onPress: () => void;
    color?: string;
    size?: number;
    userId?: string; // Optional userId to bypass auth context
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
    onPress,
    color = '#333',
    size = 24,
    userId,
}) => {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    // Use prop userId if available, otherwise fallback to context user
    const activeUserId = userId || user?.id;

    useEffect(() => {
        if (!activeUserId) return;

        const loadUnreadCount = async () => {
            try {
                const count = await NotificationService.getUnreadCount(activeUserId);
                setUnreadCount(count);
            } catch (error) {
                console.error('Error cargando contador de notificaciones:', error);
            }
        };

        loadUnreadCount();

        // Actualizar cada 30 segundos
        const interval = setInterval(loadUnreadCount, 30000);

        return () => clearInterval(interval);
    }, [activeUserId]);

    return (
        <TouchableOpacity onPress={onPress} style={styles.container}>
            <Ionicons
                name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
                size={size}
                color={color}
            />
            {unreadCount > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#FF5252',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
});
