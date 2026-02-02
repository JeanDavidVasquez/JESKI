/**
 * LanguageSelector - Componente para cambiar el idioma de la aplicación
 * Puede usarse en la pantalla de perfil, settings, o cualquier lugar
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../hooks/useLanguage';
import { theme } from '../styles/theme';

interface LanguageSelectorProps {
    style?: object;
    showLabel?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
    style,
    showLabel = true
}) => {
    const { t, currentLanguage, setLanguage, isSpanish, isEnglish } = useLanguage();

    return (
        <View style={[styles.container, style]}>
            {showLabel && (
                <View style={styles.labelRow}>
                    <Ionicons name="language" size={20} color="#6B7280" />
                    <Text style={styles.label}>{t('profile.language')}</Text>
                </View>
            )}

            <View style={styles.buttonsContainer}>
                <TouchableOpacity
                    style={[
                        styles.langButton,
                        isSpanish && styles.langButtonActive
                    ]}
                    onPress={() => setLanguage('es')}
                >
                    <Text style={styles.flagEmoji}>🇪🇨</Text>
                    <Text style={[
                        styles.langText,
                        isSpanish && styles.langTextActive
                    ]}>
                        {t('profile.spanish')}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.langButton,
                        isEnglish && styles.langButtonActive
                    ]}
                    onPress={() => setLanguage('en')}
                >
                    <Text style={styles.flagEmoji}>🇺🇸</Text>
                    <Text style={[
                        styles.langText,
                        isEnglish && styles.langTextActive
                    ]}>
                        {t('profile.english')}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
    },
    buttonsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    langButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        borderWidth: 2,
        borderColor: 'transparent',
        gap: 8,
    },
    langButtonActive: {
        backgroundColor: '#EBF5FF',
        borderColor: theme.colors.primary,
    },
    flagEmoji: {
        fontSize: 20,
    },
    langText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
    },
    langTextActive: {
        color: theme.colors.primary,
        fontWeight: '600',
    },
});

export default LanguageSelector;
