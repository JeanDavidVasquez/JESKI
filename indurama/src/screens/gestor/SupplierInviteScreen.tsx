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
import { useResponsive } from '../../styles/responsive';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SupplierInviteScreenProps {
  onNavigateBack?: () => void;
  onInviteSent?: () => void;
}

export const SupplierInviteScreen: React.FC<SupplierInviteScreenProps> = ({
  onNavigateBack,
  onInviteSent,
}) => {
  const { isDesktopView } = useResponsive();
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendInvite = async () => {
    if (!companyName || !email) {
      alert('Por favor complete Nombre de la Empresa y Correo Electrónico');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'users'), {
        email: email.trim(),
        firstName: contactName,
        lastName: '',
        role: 'proveedor',
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

  // Helper component for Layout Rows
  const FormRow = ({ children }: { children: React.ReactNode }) => (
    <View style={[styles.formRow, isDesktopView && styles.formRowDesktop]}>
      {children}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* --- PREMIUM BLUE HEADER --- */}
      <View style={styles.blueHeaderContainer}>
        <View style={[styles.headerContentWrapper, isDesktopView && styles.headerContentDesktop]}>
          <View style={styles.topNav}>
            <TouchableOpacity
              onPress={onNavigateBack}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
            </TouchableOpacity>
            <Image
              source={require('../../../assets/icono_indurama.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.headerTitleMain}>Invitar Proveedor</Text>
            <Text style={styles.headerSubtitle}>
              Inicie el proceso de evaluación enviando una invitación
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.scrollContent, isDesktopView && styles.scrollContentDesktop]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formCard}>

            {/* ROW 1: Empresa & Email */}
            <FormRow>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre de la Empresa <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: TecnoPartes S.A"
                  value={companyName}
                  onChangeText={setCompanyName}
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Correo Electrónico <Text style={styles.required}>*</Text></Text>
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
            </FormRow>

            {/* ROW 2: Contacto & Teléfono */}
            <FormRow>
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
            </FormRow>

            {/* Categoría */}
            <View style={styles.inputGroupNonRow}>
              <Text style={styles.label}>Categoría del Proveedor</Text>
              <View style={styles.selectContainer}>
                <Text style={[styles.selectText, !category && styles.placeholderText]}>
                  {category || 'Seleccione categoría (Opcional)'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={24} color="#6B7280" />
              </View>
            </View>

            {/* Mensaje Personalizado */}
            <View style={styles.inputGroupNonRow}>
              <Text style={styles.label}>Mensaje Personalizado (Opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Agregue un mensaje de bienvenida o instrucciones específicas..."
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
                <MaterialCommunityIcons name="email-fast-outline" size={20} color="#004CA3" style={{ marginRight: 8 }} />
                <Text style={styles.infoTitle}>¿Qué sucede al enviar?</Text>
              </View>
              <Text style={styles.infoText}>
                El proveedor recibirá un correo automático con un enlace único (válido por 7 días) para darse de alta en JESKI y completar su perfil EPI.
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onNavigateBack}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSendInvite}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <Text style={styles.submitButtonText}>Enviando...</Text>
                ) : (
                  <>
                    <MaterialCommunityIcons name="send-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.submitButtonText}>Enviar Invitación</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modern Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIconCircle}>
              <MaterialCommunityIcons name="check" size={32} color="#fff" />
            </View>
            <Text style={styles.modalTitle}>¡Invitación Enviada!</Text>
            <Text style={styles.modalMessage}>
              Hemos enviado un correo a <Text style={{ fontWeight: 'bold' }}>{email}</Text> con las instrucciones de acceso.
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleCloseModal} activeOpacity={0.8}>
              <Text style={styles.modalButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },

  // Header Styles
  blueHeaderContainer: {
    backgroundColor: '#004CA3',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30, // Increased for visual overlap feel if needed, or straight cut
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10
  },
  headerContentWrapper: { width: '100%', paddingHorizontal: 20 },
  headerContentDesktop: { maxWidth: 900, alignSelf: 'center' },

  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20
  },
  logo: { width: 110, height: 32, tintColor: '#fff' },

  titleContainer: { alignItems: 'center' },
  headerTitleMain: { fontSize: 24, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 13, color: '#BFDBFE', marginTop: 6, fontWeight: '500', textAlign: 'center' },

  // Content Styles
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  scrollContentDesktop: { alignItems: 'center' },

  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 900,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)'
  },

  // Responsive Form Layout
  formRow: { flexDirection: 'column', gap: 16, marginBottom: 16 },
  formRowDesktop: { flexDirection: 'row', gap: 24 }, // On desktop, items sit side-by-side

  inputGroup: { flex: 1 },
  inputGroupNonRow: { marginBottom: 16 },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  required: { color: '#EF4444' },

  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100,
  },
  selectContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  selectText: { fontSize: 14, color: '#1F2937' },
  placeholderText: { color: '#9CA3AF' },

  infoBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  infoTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#1E40AF' },
  infoText: { fontSize: 13, color: '#4B5563', lineHeight: 20 },

  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 24 },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 12, paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1, borderColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff'
  },
  cancelButtonText: { fontSize: 14, fontWeight: '600', color: '#4B5563' },

  submitButton: {
    flexDirection: 'row',
    paddingVertical: 12, paddingHorizontal: 32,
    borderRadius: 8,
    backgroundColor: '#004CA3',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: "#004CA3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  submitButtonText: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    // backdropFilter: 'blur(4px)' // Only works on web, ignored on native usually
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#22C55E',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 12, textAlign: 'center' },
  modalMessage: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  modalButton: {
    backgroundColor: '#1F2937',
    borderRadius: 10,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center'
  },
  modalButtonText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
