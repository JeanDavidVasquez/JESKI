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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../../styles/theme';
import { AuthService } from '../../services';
import { SupplierResponseService } from '../../services/supplierResponseService';
import { User } from '../../types';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
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
 * Pantalla de inicio de sesión mejorada
 * Responsive design para web y móvil con Firebase
 */
export const LoginScreen: React.FC<LoginScreenProps> = ({
  onNavigateToRegister,
  onLogin
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        // Check EPI status for suppliers
        let targetRoute: string | undefined = undefined;

        if (result.data.role === 'proveedor') {
          try {
            // Visual feedback could be added here if checking takes time
            const submission = await SupplierResponseService.getEPISubmission(result.data.id);
            // "Llena" normally means submitted or approved
            const isEpiCompleted = submission && (submission.status === 'submitted' || submission.status === 'approved' || submission.status === 'reviewed');

            targetRoute = isEpiCompleted ? 'SupplierDashboard' : 'SupplierWelcome';
            console.log(`Login Redirect: Supplier EPI ${isEpiCompleted ? 'Complete' : 'Pending'} -> ${targetRoute}`);
          } catch (error) {
            console.error('Error checking EPI status:', error);
            targetRoute = 'SupplierWelcome'; // Fallback
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
                text: `No encontramos una cuenta asociada a ${normalizedEmail}. Verifica si lo escribiste bien o regístrate.`
              };
            case 'auth/invalid-email':
              return {
                title: 'Correo inválido',
                text: 'Revisa el formato de tu correo. Debe parecerse a usuario@indurama.com.'
              };
            case 'auth/wrong-password':
              return {
                title: 'Contraseña incorrecta',
                text: 'La contraseña que ingresaste no coincide con tu cuenta. Inténtalo de nuevo o recupera tu acceso.'
              };
            case 'auth/too-many-requests':
              return {
                title: 'Demasiados intentos',
                text: 'Hemos bloqueado temporalmente los intentos. Espera unos minutos antes de volver a intentar.'
              };
            case 'auth/network-request-failed':
              return {
                title: 'Sin conexión',
                text: 'No pudimos conectar con el servidor. Revisa tu conexión a internet.'
              };
            default:
              return {
                title: 'No pudimos iniciar sesión',
                text: result.error || 'Verifica tus credenciales e intenta nuevamente.'
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
        text: 'Ocurrió un problema al iniciar sesión. Intenta nuevamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // Implementar lógica de recuperación de contraseña
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
            {/* Header Section */}
            <View style={styles.headerSection}>
              <Text style={styles.loginTitle}>
                LOGIN
              </Text>

              <Text style={styles.subtitle}>
                Sistema de Gestión de Proveedores
              </Text>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.directInput,
                    errors.email && styles.inputError
                  ]}
                  placeholder="Email"
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#999999"
                />
                {errors.email && (
                  <Text style={styles.inputErrorText}>{errors.email}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.directInput,
                    errors.password && styles.inputError
                  ]}
                  placeholder="Password"
                  value={password}
                  onChangeText={handlePasswordChange}
                  secureTextEntry={true}
                  placeholderTextColor="#999999"
                />
                {errors.password && (
                  <Text style={styles.inputErrorText}>{errors.password}</Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.forgotPasswordLink}
                onPress={handleForgotPassword}
              >
                <Text style={styles.forgotPasswordText}>
                  ¿Olvidaste tu contraseña?
                </Text>
              </TouchableOpacity>

              {feedback && (
                <View
                  style={[
                    styles.feedbackContainer,
                    feedback.type === 'success'
                      ? styles.feedbackSuccess
                      : styles.feedbackError
                  ]}
                >
                  <Text
                    style={[
                      styles.feedbackTitle,
                      feedback.type === 'success'
                        ? styles.feedbackTitleSuccess
                        : styles.feedbackTitleError
                    ]}
                  >
                    {feedback.title}
                  </Text>
                  <Text style={styles.feedbackMessage}>{feedback.text}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? 'Cargando...' : 'Login'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.registerLink} onPress={onNavigateToRegister}>
                <Text
                  style={{
                    fontSize: 16,
                    color: '#666666',
                    textAlign: 'center'
                  }}
                >
                  ¿No tienes cuenta? Regístrate aquí
                </Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Branding */}
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
    backgroundColor: '#f5f5f5', // Fondo gris claro como el prototipo
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
    paddingVertical: theme.spacing[12],
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: theme.spacing[12],
  },
  loginTitle: {
    fontSize: isMobile ? 48 : 56,
    fontWeight: '700',
    color: '#333333',
    marginBottom: theme.spacing[3],
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: isMobile ? 16 : 18,
    color: '#666666',
    lineHeight: isMobile ? 22 : 24,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    marginBottom: theme.spacing[16],
  },
  inputContainer: {
    marginBottom: theme.spacing[4],
  },
  directInput: {
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    height: isMobile ? 56 : 60,
    fontSize: isMobile ? 16 : 18,
    paddingHorizontal: theme.spacing[4],
    color: '#333333',
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
  inputError: {
    borderColor: theme.colors.error,
  },
  inputErrorText: {
    marginTop: theme.spacing[1],
    fontSize: isMobile ? 12 : 14,
    color: theme.colors.error,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing[6],
    paddingVertical: theme.spacing[2],
  },
  forgotPasswordText: {
    fontSize: isMobile ? 14 : 16,
    textDecorationLine: 'underline',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  loginButton: {
    height: isMobile ? 56 : 60,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary,
    marginBottom: theme.spacing[6],
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
  loginButtonText: {
    color: '#ffffff',
    fontSize: isMobile ? 16 : 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  registerLink: {
    alignItems: 'center',
    paddingVertical: theme.spacing[4],
  },
  feedbackContainer: {
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    marginBottom: theme.spacing[6],
    borderWidth: 1,
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
    width: isMobile ? 140 : 36,
    height: isMobile ? 90 : 36,
    marginRight: theme.spacing[2],
  },
  brandText: {
    fontSize: isMobile ? 24 : 28,
    letterSpacing: 1,
    color: theme.colors.primary,
  },
});