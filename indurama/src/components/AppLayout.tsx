import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ViewStyle,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ResponsiveNavShell } from './ResponsiveNavShell';
import { useResponsive } from '../styles/responsive';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

/**
 * AppLayout Component
 * Contenedor universal para todas las pantallas de la aplicación.
 * Proporciona estructura consistente: header, contenido scrollable, y navegación.
 * Parte del Design System unificado de Indurama.
 */

interface NavItem {
    key: string;
    label: string;
    iconName: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
}

interface AppLayoutProps {
    children: React.ReactNode;

    // Header Configuration
    /** Título de la página (ej: "Dashboard", "Historial") */
    title?: string;
    /** Saludo para el usuario (ej: "Bienvenido") - solo en Dashboard */
    greeting?: string;
    /** Nombre del usuario para mostrar */
    userName?: string;
    /** Subtítulo o descripción adicional */
    subtitle?: string;
    /** Metadata adicional (ej: empresa, departamento) */
    metadata?: string[];

    // Navigation
    /** Nombre de la pantalla actual para marcar activa en nav */
    currentScreen: string;
    /** Items de navegación */
    navItems: NavItem[];
    /** Callback para navegación a notificaciones */
    onNavigateToNotifications?: () => void;
    /** Logo para el sidebar */
    logo?: any;

    // Content Options
    /** Habilitar pull-to-refresh */
    refreshing?: boolean;
    /** Callback para refresh */
    onRefresh?: () => void;
    /** Estilos adicionales para el contenedor de contenido */
    contentStyle?: ViewStyle;
    /** Mostrar header (default: true) */
    showHeader?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
    children,
    title,
    greeting,
    userName,
    subtitle,
    metadata = [],
    currentScreen,
    navItems,
    onNavigateToNotifications,
    logo,
    refreshing = false,
    onRefresh,
    contentStyle,
    showHeader = true,
}) => {
    const { isDesktopView } = useResponsive();

    const renderHeader = () => {
        if (!showHeader) return null;

        // Dashboard-style header with greeting
        if (greeting && userName) {
            return (
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>{greeting}</Text>
                        <Text style={styles.userName}>{userName}</Text>
                        {metadata.length > 0 && (
                            <View style={styles.metadataContainer}>
                                {metadata.map((item, index) => (
                                    <Text key={index} style={styles.metadataText}>
                                        {item}
                                    </Text>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            );
        }

        // Simple title header for other pages
        if (title) {
            return (
                <View style={styles.header}>
                    <Text style={styles.pageTitle}>{title}</Text>
                    {subtitle && (
                        <Text style={styles.subtitle}>{subtitle}</Text>
                    )}
                </View>
            );
        }

        return null;
    };

    return (
        <ResponsiveNavShell
            currentScreen={currentScreen}
            navItems={navItems}
            logo={logo}
            onNavigateToNotifications={onNavigateToNotifications}
        >
            <StatusBar style="dark" />

            {renderHeader()}

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.contentContainer,
                    contentStyle,
                ]}
                refreshControl={
                    onRefresh ? (
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[theme.colors.primary]}
                            tintColor={theme.colors.primary}
                        />
                    ) : undefined
                }
                showsVerticalScrollIndicator={false}
            >
                <View style={[
                    styles.contentWrapper,
                    isDesktopView && styles.contentWrapperDesktop,
                ]}>
                    {children}
                </View>
            </ScrollView>
        </ResponsiveNavShell>
    );
};

const styles = StyleSheet.create({
    // Header Styles
    header: {
        backgroundColor: theme.colors.white,
        paddingHorizontal: theme.spacing[5],
        paddingTop: 50,
        paddingBottom: theme.spacing[5],
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
    },
    greeting: {
        ...theme.typography.styles.body,
        color: theme.colors.text.secondary,
    },
    userName: {
        fontSize: 22,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    metadataContainer: {
        marginTop: theme.spacing[1],
    },
    metadataText: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.muted,
        marginTop: 1,
    },
    pageTitle: {
        ...theme.typography.styles.h2,
        color: theme.colors.text.primary,
    },
    subtitle: {
        ...theme.typography.styles.body,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing[1],
    },

    // Content Styles
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        padding: theme.spacing[5],
        paddingBottom: theme.spacing[10],
    },
    contentWrapper: {
        width: '100%',
    },
    contentWrapperDesktop: {
        maxWidth: 1200,
        alignSelf: 'center',
    },
});

export default AppLayout;
