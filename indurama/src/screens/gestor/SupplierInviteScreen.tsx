import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../../styles/theme';
import { db } from '../../services/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface SupplierInviteScreenProps {
  onNavigateBack?: () => void;
  onInviteSent?: () => void;
}

export const SupplierInviteScreen: React.FC<SupplierInviteScreenProps> = ({
  onNavigateBack,
  onInviteSent,
}) => {
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // const [loading, setLoading] = useState(false); // Already defined? No, I defined it in the bad block. I need to keep 'loading'.

  const [loading, setLoading] = useState(false);

  const handleSendInvite = async () => {
    if (!companyName || !email) {
      alert('Por favor complete Nombre de Empresa y Email');
      return;
    }

    setLoading(true);
    try {
      // Create "Invited" User in Firestore so it appears in Supplier List
      await addDoc(collection(db, 'users'), {
        email: email.trim(),
        firstName: contactName,
        lastName: '', // Single name in this form
        role: 'proveedor', // Matches UserRole.PROVEEDOR
        companyName: companyName,
        phone,
        category,
        status: 'INVITED',
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('Supplier invited and created in Firestore');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error creating invite:', error);
      alert('Error al enviar invitación');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    if (onInviteSent) {
      onInviteSent();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={onNavigateBack}
            style={styles.backButton}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Image
              source={require('../../../assets/icons/arrow-left.png')}
              style={styles.backIcon}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>INVITAR PROVEEDOR</Text>
        </View>
        <Image
          source={require('../../../assets/icono_indurama.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.description}>
            Envíe una invitación por email para iniciar el procesos de evaluación
          </Text>

          <View style={styles.formCard}>
            {/* Nombre de la Empresa */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre de la Empresa *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: TecnoPartes S.A"
                value={companyName}
                onChangeText={setCompanyName}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Correo Electrónico */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo Electrónico *</Text>
              <TextInput
                style={styles.input}
                placeholder="contacto@empresa.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Nombre del Contacto */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre del Contacto</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Juan Pérez"
                value={contactName}
                onChangeText={setContactName}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Teléfono */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={styles.input}
                placeholder="+593 99 999 9999"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Categoría del Proveedor */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Categoría del Proveedor</Text>
              <View style={styles.selectContainer}>
                <Text style={[styles.selectText, !category && styles.placeholderText]}>
                  {category || 'Seleccione categoría'}
                </Text>
                <Image
                  source={require('../../../assets/icons/chevron-down.png')}
                  style={styles.chevronIcon}
                />
              </View>
            </View>

            {/* Mensaje Personalizado */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mensaje Personalizado (Opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Agregue un mensaje personalizado para el proveedor..."
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <View style={styles.infoTitleRow}>
                <Image
                  source={require('../../../assets/icons/inbox.png')}
                  style={styles.infoIcon}
                />
                <Text style={styles.infoTitle}>Vista Previa de la invitación</Text>
              </View>
              <Text style={styles.infoText}>
                El proveedor recibirá un correo electrónico con un enlace único para crear su cuenta y completar el cuestionario de evaluación EPI. Este enlace será válido por 7 dias
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onNavigateBack}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSendInvite}
              >
                <Image
                  source={require('../../../assets/icons/send.png')}
                  style={styles.submitIcon}
                />
                <Text style={styles.submitButtonText}>Enviar Invitación</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Invitacion Enviada</Text>
            <Text style={styles.modalMessage}>
              La invitacion le llegara al correo indicado
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleCloseModal}>
              <Text style={styles.modalButtonText}>Listo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#1F2937',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  logo: {
    width: 100,
    height: 30,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    height: 100,
  },
  selectContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
  },
  selectText: {
    fontSize: 14,
    color: '#1F2937',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  chevronIcon: {
    width: 20,
    height: 20,
    tintColor: '#6B7280',
  },
  infoBox: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    width: 20,
    height: 20,
    tintColor: theme.colors.primary,
    marginRight: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitIcon: {
    width: 16,
    height: 16,
    tintColor: '#FFF',
    marginRight: 8,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: '#86EFAC',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 48,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
});
