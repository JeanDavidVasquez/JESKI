import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Image,
  TextInput,
  Text,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { AuthService } from '../../services';
import { SupplierResponseService } from '../../services/supplierResponseService';
import { User } from '../../types';

const { width, height } = Dimensions.get('window');
const isMobile = width < 768;

interface LoginScreenProps {
  onNavigateToRegister?: () => void;
  onLogin?: (user: User, targetRoute?: string) => void;
}

type FieldErrors = {
  email?: string;
  password?: string;
};

type FeedbackMessage = {
  type: 'error' | 'success';
  title: string;
  text: string;
};

/**
 * LoginScreen - Pantalla de inicio de sesión
 * Diseño limpio y profesional (mismo estilo que Register)
 */
export const LoginScreen: React.FC<LoginScreenProps> = ({
  onNavigateToRegister,
  onLogin
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
    if (feedback?.type === 'error') {
      setFeedback(null);
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
    if (feedback?.type === 'error') {
      setFeedback(null);
    }
  };

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const validationErrors: FieldErrors = {};

    if (!normalizedEmail) {
      validationErrors.email = 'Ingresa tu correo corporativo';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        validationErrors.email = 'El formato del correo no es válido';
      }
    }

    if (!password || !password.trim()) {
      validationErrors.password = 'Ingresa tu contraseña';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFeedback({
        type: 'error',
        title: 'Faltan datos',
        text: 'Revisa los campos marcados antes de continuar.'
      });
      return;
    }

    setErrors({});
    setLoading(true);
    setFeedback(null);

    try {
      const result = await AuthService.signIn(normalizedEmail, password);

      if (result.success && result.data) {
        setFeedback({
          type: 'success',
          title: '¡Bienvenido!',
          text: result.message || 'Inicio de sesión exitoso'
        });

        let targetRoute: string | undefined = undefined;

        if (result.data.role === 'proveedor') {
          try {
            const submission = await SupplierResponseService.getEPISubmission(result.data.id);
            const isEpiCompleted = submission && (submission.status === 'submitted' || submission.status === 'approved' || submission.status === 'reviewed');
            targetRoute = isEpiCompleted ? 'SupplierDashboard' : 'SupplierWelcome';
          } catch (error) {
            console.error('Error checking EPI status:', error);
            targetRoute = 'SupplierWelcome';
          }
        }

        onLogin?.(result.data, targetRoute);
      } else {
        const fieldErrors: FieldErrors = (() => {
          switch (result.errorCode) {
            case 'auth/user-not-found':
              return { email: 'No encontramos una cuenta para este correo' };
            case 'auth/invalid-email':
              return { email: 'El correo ingresado no es válido' };
            case 'auth/wrong-password':
              return { password: 'La contraseña no coincide con tu cuenta' };
            default:
              return {};
          }
        })();

        if (Object.keys(fieldErrors).length > 0) {
          setErrors(prev => ({ ...prev, ...fieldErrors }));
        }

        const personalizedFeedback = (() => {
          switch (result.errorCode) {
            case 'auth/user-not-found':
              return {
                title: 'Correo no registrado',
                text: `No encontramos una cuenta asociada a ${normalizedEmail}.`
              };
            case 'auth/invalid-email':
              return {
                title: 'Correo inválido',
                text: 'Revisa el formato de tu correo.'
              };
            case 'auth/wrong-password':
              return {
                title: 'Contraseña incorrecta',
                text: 'La contraseña ingresada no coincide.'
              };
            case 'auth/too-many-requests':
              return {
                title: 'Demasiados intentos',
                text: 'Espera unos minutos antes de volver a intentar.'
              };
            case 'auth/network-request-failed':
              return {
                title: 'Sin conexión',
                text: 'Revisa tu conexión a internet.'
              };
            default:
              return {
                title: 'No pudimos iniciar sesión',
                text: result.error || 'Verifica tus credenciales.'
              };
          }
        })();

        setFeedback({
          type: 'error',
          ...personalizedFeedback
        });
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      setFeedback({
        type: 'error',
        title: 'Error inesperado',
        text: 'Ocurrió un problema. Intenta nuevamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    console.log('Forgot password');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#f5f5f5" />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.mainContainer}>
            {/* Header Section - Title only (logo goes at bottom) */}
            <View style={styles.headerSection}>
              <Text style={styles.loginTitle}>LOGIN</Text>
              <Text style={styles.subtitle}>
                Sistema de Gestión de Proveedores
              </Text>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              {/* Email Input */}
              <View style={styles.inputWrapper}>
                <View style={[
                  styles.inputContainer,
                  errors.email && styles.inputError
                ]}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color="#9CA3AF"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.directInput}
                    placeholder="Correo electrónico"
                    value={email}
                    onChangeText={handleEmailChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor="#999999"
                  />
                </View>
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <View style={[
                  styles.inputContainer,
                  errors.password && styles.inputError
                ]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#9CA3AF"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.directInput}
                    placeholder="Contraseña"
                    value={password}
                    onChangeText={handlePasswordChange}
                    secureTextEntry={!showPassword}
                    placeholderTextColor="#999999"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              {/* Forgot Password */}
              <TouchableOpacity
                style={styles.forgotPasswordLink}
                onPress={handleForgotPassword}
              >
                <Text style={styles.forgotPasswordText}>
                  ¿Olvidaste tu contraseña?
                </Text>
              </TouchableOpacity>

              {/* Feedback Message */}
              {feedback && (
                <View style={[
                  styles.feedbackContainer,
                  feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError
                ]}>
                  <Text style={[
                    styles.feedbackTitle,
                    feedback.type === 'success' ? styles.feedbackTitleSuccess : styles.feedbackTitleError
                  ]}>
                    {feedback.title}
                  </Text>
                  <Text style={styles.feedbackMessage}>{feedback.text}</Text>
                </View>
              )}

              {/* Login Button */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Iniciar Sesión</Text>
                )}
              </TouchableOpacity>

              {/* Register Link */}
              <TouchableOpacity style={styles.loginLink} onPress={onNavigateToRegister}>
                <Text style={{ fontSize: 14, color: '#666666', textAlign: 'center' }}>
                  ¿No tienes cuenta? <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>Regístrate aquí</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Section - Logo (Restored) */}
            <View style={styles.bottomSection}>
              <View style={styles.brandContainer}>
                <Image
                  source={require('../../../assets/icono_indurama.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: height,
    justifyContent: 'center',
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing[8],
    paddingVertical: isMobile ? theme.spacing[6] : theme.spacing[12],
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: isMobile ? theme.spacing[6] : theme.spacing[12],
  },
  loginTitle: {
    fontSize: isMobile ? 36 : 42, // Keeping it balanced
    fontWeight: '700',
    color: '#333333',
    marginBottom: theme.spacing[2],
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: isMobile ? 14 : 18,
    color: '#666666',
    lineHeight: isMobile ? 20 : 24,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    marginBottom: isMobile ? theme.spacing[4] : theme.spacing[16],
  },
  inputWrapper: {
    marginBottom: theme.spacing[4],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    height: isMobile ? 50 : 60, // Reduced height slightly for mobile
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
  inputIcon: {
    marginRight: 12,
  },
  directInput: {
    flex: 1,
    fontSize: isMobile ? 16 : 18,
    color: '#333333',
    height: '100%',
  },
  eyeButton: {
    padding: 4,
  },
  inputError: {
    borderColor: '#e53935',
  },
  errorText: {
    color: '#e53935',
    marginTop: 6,
    marginLeft: 6,
    fontSize: 13,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing[4], // Reduced margin
    paddingVertical: theme.spacing[2],
  },
  forgotPasswordText: {
    fontSize: isMobile ? 14 : 16,
    textDecorationLine: 'underline',
    color: theme.colors.primary,
    textAlign: 'center',
  },
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
    fontSize: isMobile ? 16 : 18,
    fontWeight: '600',
    marginBottom: theme.spacing[1],
  },
  feedbackTitleSuccess: {
    color: theme.colors.success,
  },
  feedbackTitleError: {
    color: theme.colors.error,
  },
  feedbackMessage: {
    fontSize: isMobile ? 14 : 16,
    color: '#333333',
    lineHeight: 20,
  },
  submitButton: {
    height: isMobile ? 50 : 60, // Reduced height slightly for mobile
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary,
    marginBottom: theme.spacing[4], // Reduced margin
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
    color: '#ffffff',
    fontSize: isMobile ? 16 : 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: theme.spacing[2], // Reduced padding
    marginBottom: theme.spacing[2], // Minimized margin to fit logo better
  },
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
    width: isMobile ? 260 : 350, // Slightly optimized for mobile fit
    height: isMobile ? 90 : 120,
  },
});