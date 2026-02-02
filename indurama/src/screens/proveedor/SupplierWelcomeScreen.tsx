import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Dimensions,
  Platform,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');
const isMobile = width < 768;

interface SupplierWelcomeScreenProps {
  // CAMBIO: Renombramos/Agregamos esta prop para que quede claro que va al Dashboard
  onNavigateToDashboard?: (data: { fullName: string; email: string; position: string }) => void;
  onNavigateToQuotations?: () => void;
  onNavigateToNotifications?: () => void;
  onLogout?: () => void;
}

export const SupplierWelcomeScreen: React.FC<SupplierWelcomeScreenProps> = ({
  onNavigateToDashboard, // Recibimos la función de navegación
  onNavigateToQuotations,
  onNavigateToNotifications,
  onLogout,
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    position: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // --- ESTADOS PARA EL MODAL BONITO ---
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error' | 'info'>('info');
  const { t } = useTranslation();

  const updateFormData = (field: string, value: string) => {
    if (field === 'fullName') {
      const onlyLettersRegex = /^[a-zA-Z\s\u00C0-\u00FF]*$/;
      if (!onlyLettersRegex.test(value)) {
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const showCustomModal = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleContinue = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = t('proveedor.welcome.nameRequired');
    if (!formData.email.trim()) newErrors.email = t('proveedor.welcome.emailRequired');
    if (!formData.position.trim()) newErrors.position = t('proveedor.welcome.positionRequired');

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrors({ email: t('proveedor.welcome.invalidEmail') });
      showCustomModal('error', t('proveedor.welcome.invalidEmailTitle'), t('proveedor.welcome.invalidEmailMessage'));
      return;
    }

    // --- AQUÍ OCURRE LA MAGIA ---
    // Si todo es válido, llamamos a la función que navega al Dashboard
    if (onNavigateToDashboard) {
      // Puedes pasar los datos del formulario si el dashboard los necesita para guardarlos
      onNavigateToDashboard(formData);
    }
  };

  const getModalStyles = () => {
    switch (modalType) {
      case 'success':
        return { bgCircle: '#E8F5E9', iconColor: '#4CAF50', btnBg: '#4CAF50', icon: 'checkmark' };
      case 'error':
        return { bgCircle: '#FFEBEE', iconColor: '#F44336', btnBg: '#F44336', icon: 'close' };
      default:
        return { bgCircle: '#E3F2FD', iconColor: '#2196F3', btnBg: '#2196F3', icon: 'information' };
    }
  };

  const modalStyle = getModalStyles();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* MODAL BONITO */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.iconCircle, { backgroundColor: modalStyle.bgCircle }]}>
              <Ionicons name={modalStyle.icon as any} size={40} color={modalStyle.iconColor} />
            </View>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: modalStyle.btnBg }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>{t('common.understood')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }} />
          {onNavigateToNotifications && (
            <TouchableOpacity onPress={onNavigateToNotifications} style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.welcomeSection}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/icono_indurama.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.welcomeMessage}>
            {t('proveedor.welcome.message')}
          </Text>
          <Text style={styles.roleTitle}>{t('proveedor.welcome.epiResponsible')}</Text>
        </View>

        <View style={[styles.formSection, !isMobile && styles.formSectionWeb]}>
          {/* Nombre y Apellidos */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('proveedor.welcome.fullName')}</Text>
            <View style={[
              styles.inputContainer,
              focusedField === 'fullName' && styles.inputContainerFocused,
              errors.fullName && styles.inputContainerError
            ]}>
              <Ionicons
                name="person-outline"
                size={22}
                color={focusedField === 'fullName' ? theme.colors.primary : '#9CA3AF'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Ej: Juan Pérez"
                placeholderTextColor="#999999"
                value={formData.fullName}
                onChangeText={(value) => updateFormData('fullName', value)}
                onFocus={() => setFocusedField('fullName')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="words"
              />
            </View>
            {errors.fullName && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color={theme.colors.error} />
                <Text style={styles.errorText}>{errors.fullName}</Text>
              </View>
            )}
          </View>

          {/* Correo */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('proveedor.welcome.email')}</Text>
            <View style={[
              styles.inputContainer,
              focusedField === 'email' && styles.inputContainerFocused,
              errors.email && styles.inputContainerError
            ]}>
              <Ionicons
                name="mail-outline"
                size={22}
                color={focusedField === 'email' ? theme.colors.primary : '#9CA3AF'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="proveedor@empresa.com"
                placeholderTextColor="#999999"
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {errors.email && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color={theme.colors.error} />
                <Text style={styles.errorText}>{errors.email}</Text>
              </View>
            )}
          </View>

          {/* Cargo */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('proveedor.welcome.position')}</Text>
            <View style={[
              styles.inputContainer,
              focusedField === 'position' && styles.inputContainerFocused,
              errors.position && styles.inputContainerError
            ]}>
              <Ionicons
                name="briefcase-outline"
                size={22}
                color={focusedField === 'position' ? theme.colors.primary : '#9CA3AF'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Ej: Gerente de Ventas"
                placeholderTextColor="#999999"
                value={formData.position}
                onChangeText={(value) => updateFormData('position', value)}
                onFocus={() => setFocusedField('position')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="words"
              />
            </View>
            {errors.position && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color={theme.colors.error} />
                <Text style={styles.errorText}>{errors.position}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.buttonSection}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.8}>
            <Text style={styles.continueButtonText}>{t('proveedor.welcome.continueWithEpi')}</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>

          {onNavigateToQuotations && (
            <TouchableOpacity style={styles.quotationsButton} onPress={onNavigateToQuotations} activeOpacity={0.8}>
              <Ionicons name="pricetag-outline" size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.quotationsButtonText}>{t('proveedor.welcome.myQuotations')}</Text>
            </TouchableOpacity>
          )}

          {onLogout && (
            <TouchableOpacity style={styles.logoutButton} onPress={onLogout} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={20} color="#6B7280" style={{ marginRight: 8 }} />
              <Text style={styles.logoutButtonText}>{t('auth.logout')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// ... (Los estilos se mantienen exactamente igual que en tu código original)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  content: {
    flex: 1,
    paddingHorizontal: isMobile ? 24 : 40,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#6B7280',
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
  welcomeSection: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoImage: {
    width: 160,
    height: 60,
    resizeMode: 'contain',
  },
  welcomeMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    maxWidth: 500,
  },
  roleTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  formSection: {
    width: '100%',
    marginBottom: 32,
  },
  formSectionWeb: {
    maxWidth: 460,
    alignSelf: 'center',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    height: 60,
    paddingHorizontal: 20,
  },
  inputContainerFocused: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: '#FFFFFF',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    transform: [{ translateY: -1 }],
  },
  inputContainerError: {
    borderWidth: 1.5,
    borderColor: theme.colors.error,
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginRight: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 17,
    color: '#1F2937',
    height: '100%',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
    paddingLeft: 4,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 13,
    fontWeight: '500',
  },
  buttonSection: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    paddingBottom: 40,
    gap: 16,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginTop: 8,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 10,
  },
  notificationButton: {
    padding: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quotationsButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  quotationsButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '500',
  }
}); 