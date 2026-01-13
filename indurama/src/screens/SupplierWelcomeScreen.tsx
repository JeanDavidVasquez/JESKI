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

const { width, height } = Dimensions.get('window');
const isMobile = width < 768;

interface SupplierWelcomeScreenProps {
  onContinueToEvaluation?: (data: { fullName: string; email: string; position: string }) => void;
  onNavigateToQuotations?: () => void;
  onNavigateToNotifications?: () => void;
  onLogout?: () => void; // Prop para cerrar sesión o volver al login
}

export const SupplierWelcomeScreen: React.FC<SupplierWelcomeScreenProps> = ({
  onContinueToEvaluation,
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

  // --- ESTADOS PARA EL MODAL BONITO ---
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error' | 'info'>('info');

  const updateFormData = (field: string, value: string) => {
    // Validación "Solo Letras" para Nombre y Apellidos
    if (field === 'fullName') {
      const onlyLettersRegex = /^[a-zA-Z\s\u00C0-\u00FF]*$/; // Permite letras, espacios y tildes
      if (!onlyLettersRegex.test(value)) {
        return; // Bloquea números y símbolos raros
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
    if (!formData.fullName.trim()) newErrors.fullName = 'El nombre es obligatorio';
    if (!formData.email.trim()) newErrors.email = 'El correo es obligatorio';
    if (!formData.position.trim()) newErrors.position = 'El cargo es obligatorio';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; // Solo mostramos errores rojos, sin modal
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrors({ email: 'Ingrese un correo válido' });
      showCustomModal('error', 'Correo Inválido', 'El formato del correo electrónico no es correcto.');
      return;
    }

    if (onContinueToEvaluation) {
      onContinueToEvaluation(formData);
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
              <Text style={styles.modalButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }} />
          {onNavigateToNotifications && (
            <TouchableOpacity onPress={onNavigateToNotifications} style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#003E85" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.welcomeSection}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/icono_indurama.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.welcomeMessage}>
            Bienvenido, proveedor. Indurama te invita a ser un proveedor evaluado.
          </Text>
          <Text style={styles.roleTitle}>Responsable de la EPI</Text>
        </View>

        <View style={[styles.formSection, !isMobile && styles.formSectionWeb]}>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre y Apellidos</Text>
            <TextInput
              style={[styles.textInput, errors.fullName ? styles.inputError : null]}
              placeholder="Ej: Juan Pérez"
              placeholderTextColor="#999999"
              value={formData.fullName}
              onChangeText={(value) => updateFormData('fullName', value)}
              autoCapitalize="words"
            />
            {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Correo</Text>
            <TextInput
              style={[styles.textInput, errors.email ? styles.inputError : null]}
              placeholder="proveedor@nuevo.com"
              placeholderTextColor="#999999"
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Cargo</Text>
            <TextInput
              style={[styles.textInput, errors.position ? styles.inputError : null]}
              placeholder="Ej: Gerente de Ventas"
              placeholderTextColor="#999999"
              value={formData.position}
              onChangeText={(value) => updateFormData('position', value)}
              autoCapitalize="words"
            />
            {errors.position ? <Text style={styles.errorText}>{errors.position}</Text> : null}
          </View>
        </View>

        <View style={styles.buttonSection}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Ionicons name="document-text-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.continueButtonText}>Continuar con la EPI</Text>
          </TouchableOpacity>

          {onNavigateToQuotations && (
            <TouchableOpacity style={styles.quotationsButton} onPress={onNavigateToQuotations}>
              <Ionicons name="pricetag-outline" size={20} color="#003E85" style={{ marginRight: 8 }} />
              <Text style={styles.quotationsButtonText}>Mis Cotizaciones</Text>
            </TouchableOpacity>
          )}

          {/* --- BOTÓN DE SALIDA (LOGOUT / VOLVER) --- */}
          {onLogout && (
            <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
              <Ionicons name="arrow-back-circle-outline" size={20} color="#666" style={{ marginRight: 8 }} />
              <Text style={styles.logoutButtonText}>Regresar / Cerrar Sesión</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

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
  welcomeSection: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 40,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoImage: {
    width: 180,
    height: 180,
  },
  welcomeMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
  },
  formSection: {
    paddingHorizontal: 8,
    marginBottom: 40,
    width: '100%',
  },
  formSectionWeb: {
    maxWidth: 500,
    alignSelf: 'center',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333333',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      }
    }),
  },
  inputError: {
    borderColor: '#E53935',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#E53935',
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
  buttonSection: {
    paddingHorizontal: 8,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  continueButton: {
    backgroundColor: '#003E85',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        cursor: 'pointer',
        boxShadow: '0 4px 6px rgba(0, 62, 133, 0.3)',
      }
    }),
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
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
  },
  quotationsButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#003E85',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      }
    }),
  },
  quotationsButtonText: {
    color: '#003E85',
    fontSize: 18,
    fontWeight: '600',
  },
  // ESTILO BOTÓN LOGOUT
  logoutButton: {
    marginTop: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
  }
});