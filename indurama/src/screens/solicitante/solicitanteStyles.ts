/**
 * Solicitante Shared Styles
 * 
 * Estilos estandarizados para TODAS las pantallas del rol Solicitante.
 * Esto asegura consistencia visual en headers, cards, y tipografía.
 * 
 * IMPORTANTE: Todas las pantallas del Solicitante deben importar estos estilos
 * en lugar de definir sus propios estilos de header/cards.
 */

import { StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

/**
 * Header estandarizado para todas las pantallas del Solicitante
 */
export const solicitanteHeaderStyles = StyleSheet.create({
    // Container del header (blanco, con borde inferior)
    container: {
        backgroundColor: theme.colors.white,
        paddingHorizontal: theme.spacing[5],
        paddingTop: 50,
        paddingBottom: theme.spacing[5],
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
    },

    // Título de vista simple (Profile, History, Notifications)
    title: {
        fontSize: 24,
        fontWeight: '700' as const,
        color: theme.colors.primary, // Siempre azul Indurama #003E85
    },

    // Subtítulo opcional
    subtitle: {
        fontSize: 14,
        fontWeight: '400' as const,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing[1],
    },

    // Para Dashboard con saludo
    greeting: {
        fontSize: 14,
        fontWeight: '400' as const,
        color: theme.colors.text.secondary,
    },
    userName: {
        fontSize: 22,
        fontWeight: '700' as const,
        color: theme.colors.text.primary,
    },
    userRole: {
        fontSize: 13,
        fontWeight: '400' as const,
        color: theme.colors.text.muted,
        marginTop: 2,
    },
});

/**
 * Cards estandarizadas para solicitudes
 */
export const solicitanteCardStyles = StyleSheet.create({
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
        fontSize: 12,
        fontWeight: '600' as const,
        color: theme.colors.primary,
    },
    title: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing[1],
    },
    description: {
        fontSize: 14,
        fontWeight: '400' as const,
        color: theme.colors.text.secondary,
        lineHeight: 20,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: theme.spacing[4],
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.light,
    },
});

/**
 * Status badge estandarizado
 */
export const createStatusBadgeStyle = (color: string) => ({
    container: {
        borderWidth: 1,
        borderColor: color,
        borderRadius: 20,
        paddingHorizontal: theme.spacing[3],
        paddingVertical: theme.spacing[1],
        backgroundColor: color + '10',
    },
    text: {
        fontSize: 10,
        fontWeight: '700' as const,
        color: color,
    },
});

/**
 * Inputs estandarizados (búsqueda, formularios)
 */
export const solicitanteInputStyles = StyleSheet.create({
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.white,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        borderRadius: theme.borderRadius.lg,
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[3],
        ...theme.shadows.sm,
    },
    searchIcon: {
        marginRight: theme.spacing[3],
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: theme.colors.text.primary,
    },
});

/**
 * Filtros estandarizados (chips/tabs)
 */
export const solicitanteFilterStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[3],
        gap: theme.spacing[2],
        flexWrap: 'wrap',
    },
    chip: {
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[2],
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.gray[100],
    },
    chipActive: {
        backgroundColor: theme.colors.primary,
    },
    chipText: {
        fontSize: 12,
        fontWeight: '500' as const,
        color: theme.colors.text.secondary,
    },
    chipTextActive: {
        color: theme.colors.white,
        fontWeight: '600' as const,
    },
});

/**
 * Content container estandarizado
 */
export const solicitanteContentStyles = StyleSheet.create({
    container: {
        padding: theme.spacing[5],
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600' as const,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing[4],
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: theme.spacing[10],
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.xl,
    },
    emptyText: {
        fontSize: 14,
        color: theme.colors.text.muted,
        marginTop: theme.spacing[3],
    },
});

/**
 * Colores de estado estandarizados
 */
export const statusColors = {
    pending: theme.colors.warning,
    rectification_required: '#FF9800',
    in_progress: theme.colors.primary,
    quoting: theme.colors.warning,
    cotizacion: theme.colors.warning,
    awarded: '#9C27B0',
    adjudicado: '#9C27B0',
    completed: theme.colors.success,
    rejected: theme.colors.error,
} as const;

export const getStatusColor = (status: string): string => {
    return statusColors[status as keyof typeof statusColors] || theme.colors.primary;
};
