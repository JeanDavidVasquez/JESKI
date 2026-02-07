import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

/**
 * RequestCard Component
 * Tarjeta reutilizable para mostrar solicitudes en cualquier pantalla.
 * Parte del Design System unificado de Indurama.
 */

interface RequestCardProps {
    /** Código de la solicitud (ej: "SOL-2025-042") */
    code: string;
    /** Título/descripción de la solicitud */
    title: string;
    /** Subtítulo adicional (ej: "Clase · Tipo") */
    subtitle?: string;
    /** Estado de la solicitud */
    status: string;
    /** Color del estado (opcional, se calcula automáticamente) */
    statusColor?: string;
    /** Fecha de la solicitud */
    date?: string;
    /** Callback al presionar la tarjeta */
    onPress?: () => void;
    /** Contenido adicional (ej: timeline, botones) */
    children?: React.ReactNode;
    /** Estilos adicionales */
    style?: ViewStyle;
}

// Mapeo de estados a colores usando theme tokens
const getStatusColor = (status: string): string => {
    const statusLower = status.toLowerCase();

    if (statusLower.includes('pending') || statusLower.includes('progreso') || statusLower.includes('in_progress')) {
        return theme.colors.primary;
    }
    if (statusLower.includes('quoting') || statusLower.includes('cotizacion') || statusLower.includes('warning')) {
        return theme.colors.warning;
    }
    if (statusLower.includes('awarded') || statusLower.includes('adjudicado')) {
        return '#9C27B0'; // Purple for awarded
    }
    if (statusLower.includes('completed') || statusLower.includes('completado')) {
        return theme.colors.success;
    }
    if (statusLower.includes('rejected') || statusLower.includes('rechazado')) {
        return theme.colors.error;
    }

    return theme.colors.primary;
};

export const RequestCard: React.FC<RequestCardProps> = ({
    code,
    title,
    subtitle,
    status,
    statusColor,
    date,
    onPress,
    children,
    style,
}) => {
    const resolvedStatusColor = statusColor || getStatusColor(status);

    const CardContent = (
        <>
            {/* Header: Code + Status + Date */}
            <View style={styles.header}>
                <Text style={styles.code}>{code}</Text>
                <View style={[styles.statusBadge, { borderColor: resolvedStatusColor }]}>
                    <Text style={[styles.statusText, { color: resolvedStatusColor }]}>
                        {status}
                    </Text>
                </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Subtitle */}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

            {/* Additional Content (timeline, buttons, etc) */}
            {children}

            {/* Footer */}
            {(date || onPress) && (
                <View style={styles.footer}>
                    {date && (
                        <View style={styles.dateContainer}>
                            <Ionicons
                                name="calendar-outline"
                                size={16}
                                color={theme.colors.text.muted}
                                style={styles.dateIcon}
                            />
                            <Text style={styles.dateText}>{date}</Text>
                        </View>
                    )}

                    {onPress && (
                        <TouchableOpacity
                            style={styles.detailsButton}
                            onPress={onPress}
                        >
                            <Text style={styles.detailsText}>Ver Detalles</Text>
                            <Ionicons
                                name="arrow-forward"
                                size={16}
                                color={theme.colors.primary}
                                style={styles.detailsIcon}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </>
    );

    if (onPress) {
        return (
            <TouchableOpacity
                style={[styles.container, style]}
                onPress={onPress}
                activeOpacity={0.7}
            >
                {CardContent}
            </TouchableOpacity>
        );
    }

    return (
        <View style={[styles.container, style]}>
            {CardContent}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing[5],
        marginBottom: theme.spacing[4],
        ...theme.shadows.base,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing[3],
    },
    code: {
        ...theme.typography.styles.caption,
        fontWeight: '600',
        color: theme.colors.text.muted,
    },
    statusBadge: {
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: theme.spacing[3],
        paddingVertical: theme.spacing[1],
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    title: {
        ...theme.typography.styles.bodyLargeSemibold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing[1],
    },
    subtitle: {
        ...theme.typography.styles.body,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing[5],
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: theme.spacing[4],
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.light,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateIcon: {
        marginRight: theme.spacing[1],
    },
    dateText: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.muted,
    },
    detailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailsText: {
        ...theme.typography.styles.bodySemibold,
        color: theme.colors.primary,
    },
    detailsIcon: {
        marginLeft: theme.spacing[1],
    },
});

export default RequestCard;
