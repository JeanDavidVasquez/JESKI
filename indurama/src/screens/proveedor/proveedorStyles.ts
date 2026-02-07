/**
 * Proveedor (Supplier) Shared Styles
 * 
 * Estilos estandarizados para TODAS las pantallas del rol Proveedor.
 * Usa el mismo patrón que solicitanteStyles.ts para consistencia.
 * 
 * NOTA: El Proveedor tiene headers con gradiente azul oscuro como
 * diferenciador visual del Solicitante (headers blancos).
 */

import { StyleSheet, Platform } from 'react-native';
import { theme } from '../../styles/theme';

/**
 * Header estandarizado para pantallas del Proveedor
 * Estilo: Header blanco con título azul (similar a Solicitante)
 */
export const proveedorHeaderStyles = StyleSheet.create({
    // Container del header (blanco, con borde inferior)
    container: {
        backgroundColor: theme.colors.white,
        paddingHorizontal: theme.spacing[5],
        paddingTop: 50,
        paddingBottom: theme.spacing[5],
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
    },

    // Para headers con fila (título + botón de acción)
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    // Título de página
    title: {
        fontSize: 24,
        fontWeight: '700' as const,
        color: theme.colors.primary,
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
});

/**
 * Header con gradiente azul para pantallas del Proveedor
 * Colores: ['#001F3F', '#003E85', '#0056B3']
 */
export const proveedorGradientHeaderStyles = StyleSheet.create({
    container: {
        paddingTop: Platform.OS === 'ios' ? 50 : 40,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    rowContainer: {
        paddingTop: Platform.OS === 'ios' ? 50 : 40,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    title: {
        fontSize: 18,
        fontWeight: '700' as const,
        color: theme.colors.white,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: theme.spacing[1],
    },
    actionButton: {
        backgroundColor: theme.colors.white,
        paddingHorizontal: theme.spacing[3],
        paddingVertical: theme.spacing[2],
        borderRadius: theme.borderRadius.base,
    },
    actionButtonText: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: '600' as const,
    },
});

export const HEADER_GRADIENT_COLORS: readonly [string, string, string] = ['#001F3F', '#003E85', '#0056B3'];

/**
 * Cards estandarizadas para invitaciones/cotizaciones
 */
export const proveedorCardStyles = StyleSheet.create({
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
 * Content container estandarizado
 */
export const proveedorContentStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.secondary,
    },
    listContent: {
        padding: theme.spacing[4],
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
    loader: {
        marginTop: 40,
    },
});

/**
 * Notificación item para lista de notificaciones
 */
export const proveedorNotificationStyles = StyleSheet.create({
    item: {
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
    title: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing[1],
    },
    unreadTitle: {
        fontWeight: '700' as const,
    },
    message: {
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

/**
 * Botones de acción
 */
export const proveedorButtonStyles = StyleSheet.create({
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
    secondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.primary,
        borderRadius: theme.borderRadius.base,
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[2],
    },
    secondaryText: {
        color: theme.colors.primary,
        fontSize: 14,
        fontWeight: '600' as const,
    },
});

/**
 * Colores de estado para cotizaciones
 */
export const quotationStatusColors = {
    pending: theme.colors.warning,
    viewed: theme.colors.primary,
    submitted: theme.colors.primary,
    winner: theme.colors.success,
    rejected: theme.colors.error,
    expired: theme.colors.text.muted,
} as const;

export const getQuotationStatusColor = (status: string, isWinner?: boolean): string => {
    if (isWinner) return theme.colors.success;
    return quotationStatusColors[status as keyof typeof quotationStatusColors] || theme.colors.primary;
};

/**
 * Tipografía estandarizada para pantallas del Proveedor
 * Usa theme.typography.styles para consistencia
 */
export const proveedorTypography = StyleSheet.create({
    // Títulos de página (h2)
    pageTitle: {
        ...theme.typography.styles.h2,
        color: theme.colors.text.primary,
    },
    // Títulos de sección (h3)
    sectionTitle: {
        ...theme.typography.styles.h3,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing[4],
    },
    // Títulos de cards (h4)
    cardTitle: {
        ...theme.typography.styles.h4,
        color: theme.colors.text.primary,
    },
    // Subtítulos
    subtitle: {
        ...theme.typography.styles.body,
        color: theme.colors.text.secondary,
    },
    // Cuerpo de texto
    body: {
        ...theme.typography.styles.body,
        color: theme.colors.text.secondary,
    },
    bodyLarge: {
        ...theme.typography.styles.bodyLarge,
        color: theme.colors.text.primary,
    },
    // Labels
    label: {
        ...theme.typography.styles.label,
        color: theme.colors.text.tertiary,
    },
    labelBold: {
        ...theme.typography.styles.labelBold,
        color: theme.colors.text.primary,
    },
    // Captions (fechas, timestamps)
    caption: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.muted,
    },
    // Texto de botón
    buttonText: {
        ...theme.typography.styles.button,
        color: theme.colors.white,
    },
    buttonTextSmall: {
        ...theme.typography.styles.buttonSmall,
        color: theme.colors.white,
    },
    // Código/ID
    code: {
        ...theme.typography.styles.captionBold,
        color: theme.colors.primary,
    },
    // Valores numéricos grandes (scores, contadores)
    statValue: {
        fontSize: 28,
        fontWeight: '700' as const,
        color: theme.colors.text.primary,
    },
    statLabel: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.muted,
        textAlign: 'center',
    },
});

/**
 * Estilos para items de perfil/menú
 */
export const proveedorProfileStyles = StyleSheet.create({
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.white,
        paddingVertical: theme.spacing[4],
        paddingHorizontal: theme.spacing[5],
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
    },
    menuSection: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing[4],
        ...theme.shadows.sm,
    },
    menuTitle: {
        fontSize: 12,
        color: theme.colors.text.muted,
        fontWeight: '600' as const,
        paddingHorizontal: theme.spacing[5],
        paddingTop: theme.spacing[4],
        paddingBottom: theme.spacing[2],
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    menuIcon: {
        width: 40,
        height: 40,
        borderRadius: theme.borderRadius.base,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing[4],
    },
    menuLabel: {
        ...theme.typography.styles.bodyLargeSemibold,
        color: theme.colors.text.primary,
        flex: 1,
    },
    menuDescription: {
        ...theme.typography.styles.body,
        color: theme.colors.text.secondary,
    },
    // Card de perfil
    profileCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing[6],
        marginBottom: theme.spacing[4],
        alignItems: 'center',
        ...theme.shadows.base,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing[4],
    },
    profileName: {
        ...theme.typography.styles.h3,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing[1],
    },
    profileEmail: {
        ...theme.typography.styles.body,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing[3],
    },
    statusBadge: {
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[2],
        borderRadius: theme.borderRadius.full,
    },
    statusText: {
        ...theme.typography.styles.captionBold,
        color: theme.colors.white,
    },
});

/**
 * Estilos para sección de score EPI
 */
export const proveedorScoreStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing[4],
        marginBottom: theme.spacing[4],
        ...theme.shadows.sm,
    },
    label: {
        ...theme.typography.styles.bodyLargeSemibold,
        color: theme.colors.text.primary,
    },
    sublabel: {
        ...theme.typography.styles.caption,
        color: theme.colors.primary,
    },
    scoreCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 3,
        borderColor: theme.colors.success,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreValue: {
        fontSize: 20,
        fontWeight: '700' as const,
        color: theme.colors.success,
    },
});
