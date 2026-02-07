import { StyleSheet, Platform, Dimensions } from 'react-native';
import { theme } from './theme';

const { width } = Dimensions.get('window');
export const isMobile = width < 768;

/**
 * Estilos compartidos para pantallas de autenticación (Login, Register)
 * Garantiza consistencia visual entre web y móvil
 */
export const authStyles = StyleSheet.create({
    // ==================== LAYOUT ====================
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        minHeight: Dimensions.get('window').height,
        justifyContent: 'center',
    },
    mainContainer: {
        flex: 1,
        paddingHorizontal: theme.spacing[8],
        paddingVertical: isMobile ? theme.spacing[6] : theme.spacing[12],
        justifyContent: 'center',
    },

    // ==================== HEADER ====================
    headerSection: {
        alignItems: 'center',
        marginBottom: isMobile ? theme.spacing[6] : theme.spacing[12],
    },
    screenTitle: {
        fontSize: isMobile ? 36 : 42,
        fontWeight: '700' as '700',
        color: '#333333',
        marginBottom: theme.spacing[2],
        letterSpacing: 2,
        textAlign: 'center' as 'center',
    },
    subtitle: {
        ...theme.typography.styles.body,
        fontSize: isMobile ? 14 : 18,
        color: '#666666',
        lineHeight: isMobile ? 20 : 24,
        textAlign: 'center' as 'center',
    },

    // ==================== FORM CONTAINER ====================
    formContainer: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
        marginBottom: isMobile ? theme.spacing[4] : theme.spacing[16],
    },
    formContainerCard: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
            },
            android: {
                elevation: 2,
            },
            web: {
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
            },
        }),
    },

    // ==================== INPUT STYLES ====================
    inputWrapper: {
        marginBottom: theme.spacing[4],
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        height: isMobile ? 50 : 56,
        paddingHorizontal: theme.spacing[4],
    },
    inputContainerFocused: {
        borderColor: theme.colors.primary,
        borderWidth: 1.5,
    },
    inputError: {
        borderColor: theme.colors.error,
    },
    inputIcon: {
        marginRight: 10,
    },
    textInput: {
        flex: 1,
        ...theme.typography.styles.body,
        fontSize: 16,
        color: '#333333',
        height: '100%',
    },
    eyeButton: {
        padding: 4,
    },

    // ==================== LABELS & TEXT ====================
    inputLabel: {
        fontSize: 14,
        color: '#333333',
        fontWeight: '500' as '500',
        marginBottom: 8,
        marginLeft: 2,
    },
    errorText: {
        ...theme.typography.styles.bodySmall,
        color: theme.colors.error,
        marginTop: 4,
        marginLeft: 4,
        fontSize: 12,
    },
    helperText: {
        fontSize: 12,
        color: '#999999',
        marginTop: 4,
        fontStyle: 'italic',
    },

    // ==================== BUTTONS ====================
    submitButton: {
        height: isMobile ? 50 : 60,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: theme.colors.primary,
        marginBottom: theme.spacing[4],
        marginTop: theme.spacing[4],
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
            web: {
                boxShadow: `0 4px 12px ${theme.colors.primary}30`,
            },
        }),
    },
    submitButtonText: {
        ...theme.typography.styles.button,
        fontSize: isMobile ? 16 : 18,
        color: '#ffffff',
        textAlign: 'center' as 'center',
    },

    // ==================== LINKS ====================
    linkContainer: {
        alignItems: 'center',
        paddingVertical: theme.spacing[2],
        marginBottom: theme.spacing[2],
    },
    linkText: {
        fontSize: 14,
        color: '#666666',
        textAlign: 'center' as 'center',
    },
    linkTextBold: {
        fontWeight: 'bold' as 'bold',
        color: theme.colors.primary,
    },

    // ==================== BOTTOM SECTION ====================
    bottomSection: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoImage: {
        width: isMobile ? 260 : 350,
        height: isMobile ? 90 : 120,
    },

    // ==================== FEEDBACK ====================
    feedbackContainer: {
        borderRadius: theme.borderRadius.lg,
        paddingVertical: theme.spacing[3],
        paddingHorizontal: theme.spacing[4],
        marginBottom: theme.spacing[4],
        borderWidth: 1,
        borderColor: 'transparent',
    },
    feedbackSuccess: {
        backgroundColor: `${theme.colors.success}10`,
        borderColor: `${theme.colors.success}40`,
    },
    feedbackError: {
        backgroundColor: `${theme.colors.error}10`,
        borderColor: `${theme.colors.error}40`,
    },
    feedbackTitle: {
        ...theme.typography.styles.bodyLargeSemibold,
        fontSize: isMobile ? 16 : 18,
        marginBottom: theme.spacing[1],
    },
    feedbackTitleSuccess: {
        color: theme.colors.success,
    },
    feedbackTitleError: {
        color: theme.colors.error,
    },
    feedbackMessage: {
        ...theme.typography.styles.body,
        fontSize: isMobile ? 14 : 16,
        color: '#333333',
        lineHeight: 20,
    },

    // ==================== SELECTOR (for Register) ====================
    selectorButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        height: isMobile ? 50 : 60,
        paddingHorizontal: theme.spacing[4],
        ...Platform.select({
            ios: {
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
            web: {
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            },
        }),
    },
    selectorDisabled: {
        backgroundColor: '#f0f0f0',
        borderColor: '#eeeeee',
        opacity: 0.7,
    },
    selectorText: {
        color: '#333333',
        fontSize: isMobile ? 16 : 18,
    },
    placeholderText: {
        color: '#999999',
    },

    // ==================== ROWS ====================
    nameRow: {
        flexDirection: 'row',
        gap: 12,
    },
    halfWidth: {
        flex: 1,
    },

    // ==================== FORM HEADER (Register) ====================
    formHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    formTitle: {
        fontSize: 20,
        fontWeight: 'bold' as 'bold',
        color: '#333333',
    },
});

// Helper para dimensiones responsive
export const getAuthDimensions = () => ({
    inputHeight: isMobile ? 50 : 60,
    buttonHeight: isMobile ? 50 : 60,
    iconSize: 20,
    maxFormWidth: 400,
});
