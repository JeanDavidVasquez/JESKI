/**
 * Gestor (Manager) Shared Styles
 * 
 * Estilos estandarizados para las pantallas del rol Gestor.
 * Sigue el mismo patrón de solicitanteStyles.ts y proveedorStyles.ts.
 */

import { StyleSheet, Platform } from 'react-native';
import { theme } from '../../styles/theme';

/**
 * Header estandarizado para pantallas del Gestor
 */
export const gestorHeaderStyles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.white,
        paddingHorizontal: theme.spacing[5],
        paddingTop: 24,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
    },
    title: {
        fontSize: 24,
        fontWeight: '800' as const,
        color: '#111827',
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '400' as const,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing[1],
    },
});

/**
 * Inputs estandarizados (búsqueda)
 */
export const gestorInputStyles = StyleSheet.create({
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
 * Filtros estandarizados (chips)
 */
export const gestorFilterStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
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
 * Card estandarizada para solicitudes del Gestor
 */
export const gestorCardStyles = StyleSheet.create({
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
    priorityBadge: {
        paddingHorizontal: theme.spacing[3],
        paddingVertical: theme.spacing[1],
        borderRadius: theme.borderRadius.full,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: '700' as const,
    },
    dateText: {
        fontSize: 12,
        color: theme.colors.text.muted,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing[3],
        paddingBottom: theme.spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.gray[100],
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing[3],
    },
    avatarText: {
        color: theme.colors.primary,
        fontWeight: '700' as const,
        fontSize: 14,
    },
    userName: {
        fontSize: 13,
        fontWeight: '600' as const,
        color: theme.colors.text.primary,
    },
    department: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    title: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing[3],
        lineHeight: 22,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionButtonText: {
        fontSize: 13,
        fontWeight: '600' as const,
        color: theme.colors.primary,
    },
});

/**
 * Content container estandarizado
 */
export const gestorContentStyles = StyleSheet.create({
    container: {
        padding: theme.spacing[5],
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
 * Botones de acción
 */
export const gestorButtonStyles = StyleSheet.create({
    primary: {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.base,
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[2],
    },
    primaryText: {
        color: theme.colors.white,
        fontSize: 14,
        fontWeight: '600' as const,
    },
});

/**
 * Colores de estado estandarizados
 */
export const statusColors = {
    pending: theme.colors.primary, // Blue for Fase 1
    in_progress: theme.colors.success, // Green for Fase 2
    quoting: theme.colors.warning, // Amber for Fase 3
    cotizacion: theme.colors.warning,
    awarded: '#9C27B0', // Purple for Fase 4
    adjudicado: '#9C27B0',
    completed: theme.colors.gray[500],
    rejected: theme.colors.error,
} as const;

export const getStatusColor = (status: string): string => {
    return statusColors[status as keyof typeof statusColors] || theme.colors.text.muted;
};

/**
 * Estilos para Notificaciones
 */
export const gestorNotificationStyles = StyleSheet.create({
    item: {
        flexDirection: 'row',
        padding: theme.spacing[4],
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing[3],
        alignItems: 'center',
        ...theme.shadows.sm,
    },
    unreadItem: {
        backgroundColor: theme.colors.primary + '05', // Ligero tinte azul
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.primary,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing[4],
    },
    contentContainer: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    unreadTitle: {
        fontWeight: '700',
        color: theme.colors.primary,
    },
    message: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },
    timestamp: {
        fontSize: 11,
        color: theme.colors.text.muted,
        marginTop: 4,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.error,
        marginLeft: theme.spacing[2],
    },
});

export const getNotificationColor = (type: string): string => {
    switch (type) {
        case 'new_request': return theme.colors.primary;
        case 'quotation_submitted': return theme.colors.warning;
        case 'supplier_registered': return theme.colors.success;
        case 'epi_submitted': return '#9C27B0'; // Purple
        case 'alert': return theme.colors.error;
        default: return theme.colors.gray[500];
    }
};
