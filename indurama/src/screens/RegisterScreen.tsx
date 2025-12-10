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
  Alert,
  TextInput,
  Text,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppContainer, AppText, AppInput, AppButton } from '../components';
import { theme } from '../styles/theme';
import { AuthService } from '../services';
import { User } from '../types';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isMobile = width < 768;

interface RegisterScreenProps {
  onNavigateToLogin?: () => void;
  onRegister?: (user: User) => void;
}

/**
 * Pantalla de registro de usuario mejorada
 * Responsive design para web y móvil con Firebase
 */
export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onNavigateToLogin,
  onRegister
}) => {
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (!firstName || !surname || !email || !password) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    setLoading(true);
    try {
      const result = await AuthService.signUp(email, password, firstName, surname);

      if (result.success && result.data) {
        Alert.alert('Éxito', result.message || 'Registro exitoso', [
          {
            text: 'Continuar',
            onPress: () => onRegister?.(result.data!) // Pasar el usuario al callback
          }
        ]);
      } else {
        Alert.alert('Error', result.error || 'Error al registrar usuario');
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      Alert.alert('Error', 'Error inesperado. Intenta nuevamente');
    } finally {
      setLoading(false);
    }
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
              <Text style={styles.registerTitle}>
                REGISTER
              </Text>

              <Text style={styles.subtitle}>
                Sistema de Gestión de Proveedores
              </Text>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              {/* First Name and Surname in same row */}
              <View style={styles.nameRow}>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <TextInput
                    style={styles.directInput}
                    placeholder="First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                    placeholderTextColor="#999999"
                  />
                </View>

                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <TextInput
                    style={styles.directInput}
                    placeholder="Surname"
                    value={surname}
                    onChangeText={setSurname}
                    autoCapitalize="words"
                    placeholderTextColor="#999999"
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.directInput}
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#999999"
                />
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.directInput}
                  placeholder="Password (Don't put a real one)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={true}
                  placeholderTextColor="#999999"
                />
              </View>

              {/* Confirm Password */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.directInput}
                  placeholder="Confirm Password (Don't put a real one)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={true}
                  placeholderTextColor="#999999"
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Cargando...' : 'Submit'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.loginLink} onPress={onNavigateToLogin}>
                <Text
                  style={{
                    fontSize: 16,
                    color: '#666666',
                    textAlign: 'center'
                  }}
                >
                  ¿Ya tienes cuenta? Inicia sesión aquí
                </Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Branding */}
            <View style={styles.bottomSection}>
              <View style={styles.brandContainer}>
                <Image
                  source={require('../../assets/icono_indurama.png')}
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
  registerTitle: {
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
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing[3],
  },
  inputContainer: {
    marginBottom: theme.spacing[4],
  },
  halfWidth: {
    flex: 1,
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
  submitButton: {
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
  submitButtonText: {
    color: '#ffffff',
    fontSize: isMobile ? 16 : 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: theme.spacing[4],
    marginBottom: theme.spacing[8],
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
    width: isMobile ? 140 : 96,
    height: isMobile ? 90 : 96,
  },
  brandText: {
    fontSize: isMobile ? 24 : 28,
    letterSpacing: 1,
    color: theme.colors.primary,
    textAlign: 'center',
  },
});