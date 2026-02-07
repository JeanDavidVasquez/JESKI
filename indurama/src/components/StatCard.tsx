import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../styles/theme';

/**
 * StatCard Component
 * Tarjeta reutilizable para mostrar estadísticas (In Progress, Attention, Ready, etc.)
 * Parte del Design System unificado de Indurama
 */

interface StatCardProps {
    /** Valor numérico a mostrar */
    value: number | string;
    /** Etiqueta principal debajo del valor */
    label: string;
    /** Subtítulo/descripción adicional */
    subtitle?: string;
    /** Color del valor (acepta tokens del theme o hex directo) */
    color?: string;
    /** Estilos adicionales del contenedor */
    style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
    value,
    label,
    subtitle,
    color = theme.colors.primary,
    style,
}) => {
    return (
        <View style={[styles.container, style]}>
            <Text style={[styles.value, { color }]}>{value}</Text>
            <Text style={styles.label}>{label}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing[4],
        ...theme.shadows.base,
    },
    value: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    subtitle: {
        fontSize: 11,
        color: theme.colors.text.muted,
        marginTop: 2,
    },
});

export default StatCard;
