import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

/**
 * MainBanner Component
 * Banner principal con CTA para acciones destacadas (crear solicitud, etc.)
 * Parte del Design System unificado de Indurama
 */

interface MainBannerProps {
    /** Título principal del banner */
    title: string;
    /** Subtítulo/descripción */
    subtitle?: string;
    /** Texto del botón de acción */
    buttonText: string;
    /** Callback al presionar el botón */
    onPress: () => void;
    /** Icono del botón (Ionicons) */
    buttonIcon?: keyof typeof Ionicons.glyphMap;
    /** Color de fondo del banner (default: primary) */
    backgroundColor?: string;
    /** Estilos adicionales */
    style?: ViewStyle;
}

export const MainBanner: React.FC<MainBannerProps> = ({
    title,
    subtitle,
    buttonText,
    onPress,
    buttonIcon = 'add-circle',
    backgroundColor = theme.colors.primary,
    style,
}) => {
    return (
        <View style={[styles.container, { backgroundColor }, style]}>
            <View style={styles.content}>
                <Text style={styles.title}>{title}</Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                <TouchableOpacity style={styles.button} onPress={onPress}>
                    {buttonIcon && (
                        <Ionicons
                            name={buttonIcon}
                            size={20}
                            color={backgroundColor}
                            style={styles.buttonIcon}
                        />
                    )}
                    <Text style={[styles.buttonText, { color: backgroundColor }]}>
                        {buttonText}
                    </Text>
                </TouchableOpacity>
            </View>
            <View style={styles.decorativeCircle} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing[6],
        marginBottom: theme.spacing[6],
        position: 'relative',
        overflow: 'hidden',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    content: {
        zIndex: 2,
    },
    decorativeCircle: {
        position: 'absolute',
        right: -20,
        top: -20,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.1)',
        zIndex: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.white,
        marginBottom: theme.spacing[2],
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: theme.spacing[5],
        maxWidth: '80%',
    },
    button: {
        backgroundColor: theme.colors.white,
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
    },
    buttonIcon: {
        marginRight: 6,
    },
    buttonText: {
        fontWeight: '700',
        fontSize: 14,
    },
});

export default MainBanner;
