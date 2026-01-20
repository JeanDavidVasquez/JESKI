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
  Modal, 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons'; 
import { theme } from '../../styles/theme';
import { AuthService } from '../../services';
import { User, UserRole } from '../../types';

// --- IMPORTAMOS TU PANTALLA DE TÉRMINOS ---
// Asegúrate de que la ruta sea correcta (está en la misma carpeta shared según tu imagen)
import { TermsConditionsScreen } from './TermsConditionsScreen';

const { width, height } = Dimensions.get('window');
const isMobile = width < 768;

interface RegisterScreenProps {
  onNavigateToLogin?: () => void;
  onRegister?: (user: User) => void;
}

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

  const [isSupplier, setIsSupplier] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // --- ESTADO PARA EL MODAL PERSONALIZADO ---
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error' | 'info'>('success');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  
  // --- NUEVO ESTADO: CONTROL DE TÉRMINOS Y CONDICIONES ---
  const [showTerms, setShowTerms] = useState(false);

  // Guardamos el usuario (si es necesario) y manejamos modal
  const [registeredUser, setRegisteredUser] = useState<User | null>(null);

  const setFieldError = (field: string, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  };

  const clearFieldError = (field: string) => {
    setErrors(prev => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  // Helper para mostrar la tarjeta bonita (SIN ALERTAS NATIVAS)
  const showCustomModal = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  // Lógica de cierre del modal: cierra y, si fue éxito, navega al Login
  const handleCloseModal = () => {
    setModalVisible(false);
    if (modalType === 'success') {
      onNavigateToLogin?.();
    }
  };

  // ---------------------------------------------------------
  // PASO 1: Validar formulario al pulsar el botón "Registrar"
  // ---------------------------------------------------------
  const handleRegisterButton = () => {
    setErrors({});
    const newErrors: Record<string, string> = {};

    // Validaciones de campos vacíos
    if (isSupplier) {
      if (!companyName.trim()) newErrors.companyName = 'Nombre de la Empresa es obligatorio';
      if (!phone.trim()) newErrors.phone = 'Teléfono de Contacto es obligatorio';
    } else {
      if (!firstName.trim()) newErrors.firstName = 'Nombre es obligatorio';
      if (!surname.trim()) newErrors.surname = 'Apellido es obligatorio';
      if (!department.trim()) newErrors.department = 'Departamento es obligatorio';
    }

    if (!email.trim()) newErrors.email = 'Correo Electrónico es obligatorio';
    if (!password) newErrors.password = 'Contraseña es obligatoria';
    if (!confirmPassword) newErrors.confirmPassword = 'Confirmar Contraseña es obligatoria';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Validaciones de formato
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFieldError('email', 'Por favor ingresa un correo electrónico válido');
      return;
    }

    if (isSupplier) {
      const phoneDigits = /^\d+$/;
      if (!phoneDigits.test(phone)) {
        setFieldError('phone', 'El teléfono debe contener sólo números');
        return;
      }
    }

    if (password.length < 6) {
      setFieldError('password', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setFieldError('confirmPassword', 'Las contraseñas no coinciden');
      return;
    }

    // SI TODO ESTÁ CORRECTO, MOSTRAMOS LOS TÉRMINOS
    setShowTerms(true);
  };

  // ---------------------------------------------------------
  // PASO 2: Ejecutar el registro REAL tras aceptar términos
  // ---------------------------------------------------------
  const finalizeRegistration = async () => {
    // 1. Cerramos el modal de términos
    setShowTerms(false); 

    // 2. Iniciamos la carga y el proceso de registro
    setLoading(true);
    try {
      const role = isSupplier ? UserRole.PROVEEDOR : UserRole.SOLICITANTE;
      const additionalData = isSupplier ? { companyName, phone } : { department };
      const finalFirstName = isSupplier ? companyName : firstName;
      const finalSurname = isSupplier ? '(Empresa)' : surname;

      const result = await AuthService.signUp(email, password, finalFirstName, finalSurname, role, additionalData);

      if (result.success && result.data) {
        setRegisteredUser(result.data);
        showCustomModal(
          'success',
          'Registro Exitoso',
          '¡Felicidades! Tu cuenta ha sido creada correctamente.'
        );

        // Cerrar modal y navegar a Login automáticamente tras 5 segundos
        setTimeout(() => {
          setModalVisible(false);
          onNavigateToLogin?.();
        }, 5000);
      } else {
        showCustomModal(
          'error',
          'Error de Registro',
          result.error || 'Algo salió mal. Intenta de nuevo.'
        );
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      showCustomModal('error', 'Error', 'Ocurrió un error inesperado de conexión.');
    } finally {
      setLoading(false);
    }
  };

  // Estilos dinámicos para el modal (Verde, Rojo, Azul)
  const getModalStyles = () => {
    switch (modalType) {
      case 'success':
        return { 
          bgCircle: '#E8F5E9', iconColor: '#4CAF50', btnBg: '#4CAF50', icon: 'checkmark' 
        };
      case 'error':
        return { 
          bgCircle: '#FFEBEE', iconColor: '#F44336', btnBg: '#F44336', icon: 'close' 
        };
      case 'info':
        return { 
          bgCircle: '#E3F2FD', iconColor: '#2196F3', btnBg: '#2196F3', icon: 'information' 
        };
      default:
        return { 
          bgCircle: '#E8F5E9', iconColor: '#4CAF50', btnBg: '#4CAF50', icon: 'checkmark' 
        };
    }
  };

  const modalStyle = getModalStyles();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#f5f5f5" />

      {/* --- INTEGRACIÓN DE PANTALLA DE TÉRMINOS Y CONDICIONES --- */}
      <TermsConditionsScreen 
        visible={showTerms}
        mandatory={true} // Obliga a aceptar o rechazar
        onAccept={finalizeRegistration} // Si acepta, se ejecuta el registro
        onReject={() => setShowTerms(false)} // Si rechaza, solo cierra el modal
      />

      {/* --- MODAL DE ÉXITO/ERROR --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {}} // Bloquea el cierre con botón atrás
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Círculo del Icono */}
            <View style={[styles.iconCircle, { backgroundColor: modalStyle.bgCircle }]}>
              <Ionicons
                name={modalStyle.icon as any}
                size={40}
                color={modalStyle.iconColor}
              />
            </View>

            {/* Título */}
            <Text style={styles.modalTitle}>{modalTitle}</Text>

            {/* Mensaje */}
            <Text style={styles.modalMessage}>{modalMessage}</Text>

            {/* Botón */}
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: modalStyle.btnBg }]}
              onPress={handleCloseModal}
            >
              <Text style={styles.modalButtonText}>
                {modalType === 'success' ? 'Aceptar' : (modalType === 'error' ? 'Reintentar' : 'Entendido')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
            <View style={styles.headerSection}>
              <Text style={styles.registerTitle}>REGISTRO</Text>
              <Text style={styles.subtitle}>Sistema de Gestión de Proveedores</Text>
            </View>

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

            <View style={styles.formContainer}>
              {isSupplier && (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Nombre de la Empresa</Text>
                    <TextInput
                      style={[styles.directInput, errors.companyName ? styles.inputError : null]}
                      placeholder="Razón Social o Comercial"
                      value={companyName}
                      onChangeText={(t) => { setCompanyName(t); clearFieldError('companyName'); }}
                      autoCapitalize="words"
                      placeholderTextColor="#999"
                    />
                    {errors.companyName ? <Text style={styles.errorText}>{errors.companyName}</Text> : null}
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Teléfono de Contacto</Text>
                    <TextInput
                      style={[styles.directInput, errors.phone ? styles.inputError : null]}
                      placeholder="+593 ..."
                      value={phone}
                      onChangeText={(t) => { setPhone(t); clearFieldError('phone'); }}
                      keyboardType="phone-pad"
                      placeholderTextColor="#999"
                    />
                    {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
                  </View>
                </>
              )}

              {!isSupplier && (
                <>
                  <View style={styles.nameRow}>
                    <View style={[styles.inputContainer, styles.halfWidth]}>
                      <Text style={styles.inputLabel}>Nombre</Text>
                      <TextInput
                        style={[styles.directInput, errors.firstName ? styles.inputError : null]}
                        placeholder="Nombre"
                        value={firstName}
                        onChangeText={(t) => { setFirstName(t); clearFieldError('firstName'); }}
                        autoCapitalize="words"
                        placeholderTextColor="#999"
                      />
                      {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
                    </View>

                    <View style={[styles.inputContainer, styles.halfWidth]}>
                      <Text style={styles.inputLabel}>Apellido</Text>
                      <TextInput
                        style={[styles.directInput, errors.surname ? styles.inputError : null]}
                        placeholder="Apellido"
                        value={surname}
                        onChangeText={(t) => { setSurname(t); clearFieldError('surname'); }}
                        autoCapitalize="words"
                        placeholderTextColor="#999"
                      />
                      {errors.surname ? <Text style={styles.errorText}>{errors.surname}</Text> : null}
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Departamento</Text>
                    <TextInput
                      style={[styles.directInput, errors.department ? styles.inputError : null]}
                      placeholder="Ej: Producción, Logística, etc."
                      value={department}
                      onChangeText={(t) => { setDepartment(t); clearFieldError('department'); }}
                      autoCapitalize="words"
                      placeholderTextColor="#999"
                    />
                    {errors.department ? <Text style={styles.errorText}>{errors.department}</Text> : null}
                  </View>
                </>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Correo Electrónico</Text>
                <TextInput
                  style={[styles.directInput, errors.email ? styles.inputError : null]}
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChangeText={(t) => { setEmail(t); clearFieldError('email'); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#999"
                />
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Contraseña</Text>
                <TextInput
                  style={[styles.directInput, errors.password ? styles.inputError : null]}
                  placeholder="********"
                  value={password}
                  onChangeText={(t) => { setPassword(t); clearFieldError('password'); }}
                  secureTextEntry={true}
                  placeholderTextColor="#999"
                />
                {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirmar Contraseña</Text>
                <TextInput
                  style={[styles.directInput, errors.confirmPassword ? styles.inputError : null]}
                  placeholder="********"
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); clearFieldError('confirmPassword'); }}
                  secureTextEntry={true}
                  placeholderTextColor="#999"
                />
                {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleRegisterButton} // <--- CAMBIADO AQUÍ
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Creando cuenta...' : (isSupplier ? 'Registrar Empresa' : 'Registrarme')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.loginLink} onPress={onNavigateToLogin}>
                <Text style={{ fontSize: 14, color: '#666666', textAlign: 'center' }}>
                  ¿Ya tienes cuenta? <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>Inicia sesión</Text>
                </Text>
              </TouchableOpacity>
            </View>

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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    maxWidth: 320,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 25,
    elevation: 2,
    minWidth: 120,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
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
  },
  inputError: {
    borderColor: '#e53935'
  },
  errorText: {
    color: '#e53935',
    marginTop: 6,
    marginLeft: 6,
    fontSize: 13,
  }
});