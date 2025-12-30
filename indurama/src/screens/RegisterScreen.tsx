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
import { User, UserRole } from '../types';

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
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // New Fields for Supplier
  const [isSupplier, setIsSupplier] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (!email || !password) {
      Alert.alert('Error', 'Todos los campos básicos son obligatorios');
      return;
    }

    if (!isSupplier && (!firstName || !surname)) {
      Alert.alert('Error', 'Nombre y Apellido son obligatorios');
      return;
    }

    if (isSupplier && !companyName) {
      Alert.alert('Error', 'El nombre de la empresa es obligatorio para proveedores');
      return;
    }

    setLoading(true);
    try {
      // Determine Role and Additional Data
      const role = isSupplier ? UserRole.PROVEEDOR : UserRole.SOLICITANTE;
      const additionalData = isSupplier ? { companyName, phone } : { department };

      const finalFirstName = isSupplier ? companyName : firstName;
      const finalSurname = isSupplier ? '(Empresa)' : surname;

      const result = await AuthService.signUp(email, password, finalFirstName, finalSurname, role, additionalData);

      if (result.success && result.data) {
        Alert.alert('Éxito', isSupplier ? 'Cuenta de proveedor creada. Completa tu perfil.' : 'Registro exitoso', [
          {
            text: 'Continuar',
            onPress: () => onRegister?.(result.data!)
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
                REGISTRO
              </Text>

              <Text style={styles.subtitle}>
                Sistema de Gestión de Proveedores
              </Text>
            </View>

            {/* Account Type Toggle */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, !isSupplier && styles.toggleButtonActive]}
                onPress={() => setIsSupplier(false)}
              >
                <Text style={[styles.toggleText, !isSupplier && styles.toggleTextActive]}>Personal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, isSupplier && styles.toggleButtonActive]}
                onPress={() => setIsSupplier(true)}
              >
                <Text style={[styles.toggleText, isSupplier && styles.toggleTextActive]}>Empresa / Proveedor</Text>
              </TouchableOpacity>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>

              {/* Supplier Specific Fields */}
              {isSupplier && (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Nombre de la Empresa</Text>
                    <TextInput
                      style={styles.directInput}
                      placeholder="Razón Social o Comercial"
                      value={companyName}
                      onChangeText={setCompanyName}
                      autoCapitalize="words"
                      placeholderTextColor="#999"
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Teléfono de Contacto</Text>
                    <TextInput
                      style={styles.directInput}
                      placeholder="+593 ..."
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      placeholderTextColor="#999"
                    />
                  </View>
                </>
              )}

              {/* First Name and Surname - Only for Personal */}
              {!isSupplier && (
                <>
                  <View style={styles.nameRow}>
                    <View style={[styles.inputContainer, styles.halfWidth]}>
                      <Text style={styles.inputLabel}>Nombre</Text>
                      <TextInput
                        style={styles.directInput}
                        placeholder="Nombre"
                        value={firstName}
                        onChangeText={setFirstName}
                        autoCapitalize="words"
                        placeholderTextColor="#999"
                      />
                    </View>

                    <View style={[styles.inputContainer, styles.halfWidth]}>
                      <Text style={styles.inputLabel}>Apellido</Text>
                      <TextInput
                        style={styles.directInput}
                        placeholder="Apellido"
                        value={surname}
                        onChangeText={setSurname}
                        autoCapitalize="words"
                        placeholderTextColor="#999"
                      />
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Departamento</Text>
                    <TextInput
                      style={styles.directInput}
                      placeholder="Ej: Producción, Logística, etc."
                      value={department}
                      onChangeText={setDepartment}
                      autoCapitalize="words"
                      placeholderTextColor="#999"
                    />
                  </View>
                </>
              )}

              {/* Email */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Correo Electrónico</Text>
                <TextInput
                  style={styles.directInput}
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#999"
                />
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Contraseña</Text>
                <TextInput
                  style={styles.directInput}
                  placeholder="********"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={true}
                  placeholderTextColor="#999"
                />
              </View>

              {/* Confirm Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirmar Contraseña</Text>
                <TextInput
                  style={styles.directInput}
                  placeholder="********"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={true}
                  placeholderTextColor="#999"
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Creando cuenta...' : (isSupplier ? 'Registrar Empresa' : 'Registrarme')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.loginLink} onPress={onNavigateToLogin}>
                <Text
                  style={{
                    fontSize: 14,
                    color: '#666666',
                    textAlign: 'center'
                  }}
                >
                  ¿Ya tienes cuenta? <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>Inicia sesión</Text>
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
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600'
  },
  toggleTextActive: {
    color: '#fff'
  },
  inputLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 4
  }
});