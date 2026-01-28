import React, { useState, useEffect } from 'react';
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
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { StatusBar } from 'expo-status-bar';
import { collection, addDoc, serverTimestamp, doc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { NotificationService } from '../../services/notificationService';
import { uploadRequestFile, formatFileSize, validateFileSize, UploadedFile } from '../../services/fileUploadService';
import { generateRequestCode } from '../../services/requestService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Request } from '../../types';
import { useResponsive, BREAKPOINTS } from '../../styles/responsive';



interface NewRequestScreenProps {
  initialRequest?: Request | null;
  onNavigateBack?: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateToHistory?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToNewRequest?: () => void;
}

export const NewRequestScreen: React.FC<NewRequestScreenProps> = ({
  initialRequest,
  onNavigateBack,
  onNavigateToDashboard
}) => {
  const { isDesktopView } = useResponsive();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<UploadedFile[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [formData, setFormData] = useState({
    dueDate: new Date(),
    description: '',
    projectType: '',
    searchClass: '',
    supplierSuggestion: '',
    urgency: 'media' as 'baja' | 'media' | 'alta',
    requiredBusinessType: 'cualquiera' as 'fabricante' | 'distribuidor' | 'servicio' | 'cualquiera',
    requiredCategories: [] as string[],
    requiredTags: [] as string[],
    customRequiredTags: [] as string[],
    industry: '',
    deliveryLocationSuggestion: '',
  });

  // Populate form if editing
  useEffect(() => {
    if (initialRequest) {
      setFormData({
        dueDate: initialRequest.dueDate ? new Date(initialRequest.dueDate) : new Date(),
        description: initialRequest.description || '',
        projectType: initialRequest.tipoProyecto || '',
        searchClass: initialRequest.claseBusqueda || '',
        supplierSuggestion: initialRequest.supplierSuggestion || '',
        urgency: (initialRequest.urgency as any) || 'media',
        requiredBusinessType: initialRequest.requiredBusinessType || 'cualquiera',
        requiredCategories: initialRequest.requiredCategories || [],
        requiredTags: initialRequest.requiredTags || [],
        customRequiredTags: initialRequest.customRequiredTags || [],
        industry: initialRequest.industry || '',
        deliveryLocationSuggestion: initialRequest.deliveryLocationSuggestion || '',
      });
      if (initialRequest.documents) {
        setDocuments(initialRequest.documents as UploadedFile[]);
      }
    }
  }, [initialRequest]);

  const [showProjectTypeDropdown, setShowProjectTypeDropdown] = useState(false);
  const [showSearchClassDropdown, setShowSearchClassDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const projectTypeOptions = [
    'Proyecto de Investigacion',
    'Proyecto con Presupuesto Aprobado',
    'Proyecto para solicitar muestras'
  ];

  const searchClassOptions = [
    'Producto terminado',
    'Materia Prima',
    'Maquinaria',
    'Servicios'
  ];

  const handleGoBack = () => {
    if (onNavigateBack) onNavigateBack();
  };

  const handleCancel = () => {
    if (onNavigateBack) onNavigateBack();
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Debes iniciar sesión para enviar una solicitud');
      return;
    }

    if (!formData.description || !formData.projectType || !formData.searchClass) {
      Alert.alert('Campos requeridos', 'Por favor completa todos los campos obligatorios');
      return;
    }

    const department = user.department || 'No asignado';

    try {
      setLoading(true);
      const requestCode = generateRequestCode();
      let uploadedDocuments: UploadedFile[] = [];

      if (!initialRequest) {
        const tempRequestId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        for (const doc of documents) {
          if (doc.url.startsWith('file://')) {
            try {
              const uploaded = await uploadRequestFile(tempRequestId, doc.url, doc.name);
              uploadedDocuments.push(uploaded);
            } catch (error) {
              console.error('Error uploading file:', error);
              Alert.alert('Advertencia', `No se pudo subir ${doc.name}, se continuará sin este archivo`);
            }
          } else {
            uploadedDocuments.push(doc);
          }
        }
      } else {
        uploadedDocuments = documents;
      }

      const requestData = {
        code: requestCode,
        userId: user.id,
        userEmail: user.email,
        userName: user.companyName || user.email,
        department: department,
        requestDate: new Date().toISOString().split('T')[0],
        dueDate: formData.dueDate.toISOString().split('T')[0],
        description: formData.description,
        tipoProyecto: formData.projectType,
        claseBusqueda: formData.searchClass,
        supplierSuggestion: formData.supplierSuggestion,
        urgency: formData.urgency,
        requiredBusinessType: formData.requiredBusinessType,
        requiredCategories: formData.requiredCategories,
        requiredTags: formData.requiredTags,
        customRequiredTags: formData.customRequiredTags,
        industry: formData.industry,
        deliveryLocationSuggestion: formData.deliveryLocationSuggestion,
        documents: uploadedDocuments,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (initialRequest) {
        const requestRef = doc(db, 'requests', initialRequest.id);
        const updateData = {
          ...requestData,
          code: initialRequest.code,
          createdAt: initialRequest.createdAt,
          rectificationComment: null,
          status: 'pending'
        };
        await updateDoc(requestRef, updateData as any);
      } else {
        const docRef = await addDoc(collection(db, 'requests'), requestData);

        // Create notification for all managers (gestores)
        try {
          const managersQuery = query(collection(db, 'users'), where('role', '==', 'gestor'));
          const managersSnapshot = await getDocs(managersQuery);

          for (const managerDoc of managersSnapshot.docs) {
            await NotificationService.create({
              userId: managerDoc.id,
              type: 'new_request',
              title: 'Nueva Solicitud',
              message: `${user.companyName || user.email} ha creado una nueva solicitud.`,
              relatedId: docRef.id,
              relatedType: 'request'
            });
          }
        } catch (notifError) {
          console.error('Error creating notifications:', notifError);
          // Don't fail the request creation if notifications fail
        }
      }

      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Error creating request:', error);
      Alert.alert('Error', `No se pudo enviar la solicitud: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      for (const file of result.assets) {
        if (!validateFileSize(file.size || 0)) {
          Alert.alert('Archivo demasiado grande', `${file.name} excede el tamaño máximo de 10MB`);
          continue;
        }

        if (initialRequest) {
          setUploadingFile(true);
          try {
            const uploadedFile = await uploadRequestFile(initialRequest.id, file.uri, file.name);
            setDocuments(prev => [...prev, uploadedFile]);
            Alert.alert('Éxito', `${file.name} subido correctamente`);
          } catch (error) {
            console.error('Error uploading file:', error);
            Alert.alert('Error', `No se pudo subir ${file.name}`);
          } finally {
            setUploadingFile(false);
          }
        } else {
          const fileData: UploadedFile = {
            name: file.name,
            url: file.uri,
            type: file.mimeType,
            size: file.size,
          };
          setDocuments(prev => [...prev, fileData]);
        }
      }
    } catch (error) {
      console.error('Error selecting files:', error);
      Alert.alert('Error', 'No se pudieron seleccionar los archivos');
    }
  };

  const removeDocument = (index: number) => {
    Alert.alert(
      'Eliminar archivo',
      '¿Estás seguro de que deseas eliminar este archivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => setDocuments(prev => prev.filter((_, i) => i !== index)),
        },
      ]
    );
  };

  const closeDropdowns = () => {
    setShowProjectTypeDropdown(false);
    setShowSearchClassDropdown(false);
    setShowDatePicker(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Hero Header */}
      <View style={styles.heroHeader}>
        <View style={styles.heroTopRow}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Image
            source={require('../../../assets/icono_indurama.png')}
            style={{ width: 100, height: 36, tintColor: '#FFF' }}
            resizeMode="contain"
          />
        </View>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>
            {initialRequest ? 'Editar Solicitud' : 'Nueva Solicitud'}
          </Text>
          <Text style={styles.heroSubtitle}>
            Complete la información para iniciar un proceso de compra
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          onTouchStart={closeDropdowns}
        >
          <View style={[
            styles.contentWrapper,
            isDesktopView && { maxWidth: 1200, alignSelf: 'center', width: '100%' }
          ]}>

            {/* 1. INFORMACIÓN BÁSICA */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="information-circle-outline" size={24} color="#1565C0" style={{ marginRight: 10 }} />
                <Text style={styles.cardTitle}>Información Básica</Text>
              </View>

              <View style={[styles.formRow, !isDesktopView && { flexDirection: 'column' }]}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.label}>Fecha Límite <Text style={styles.required}>*</Text></Text>
                  <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
                    <Ionicons name="calendar-outline" size={20} color="#666" style={{ marginRight: 10 }} />
                    <Text style={{ color: '#333', fontSize: 15 }}>
                      {formData.dueDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={formData.dueDate}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) setFormData({ ...formData, dueDate: selectedDate });
                      }}
                    />
                  )}
                </View>

                <View style={[styles.formGroupHalf, { zIndex: 200 }]}>
                  <Text style={styles.label}>Tipo de Proyecto <Text style={styles.required}>*</Text></Text>
                  <TouchableOpacity style={styles.dropdown} onPress={() => setShowProjectTypeDropdown(!showProjectTypeDropdown)}>
                    <Text style={[styles.dropdownText, formData.projectType ? styles.dropdownTextSelected : null]}>
                      {formData.projectType || 'Seleccione Tipo'}
                    </Text>
                    <Ionicons name={showProjectTypeDropdown ? "chevron-up" : "chevron-down"} size={20} color="#666" />
                  </TouchableOpacity>
                  {showProjectTypeDropdown && (
                    <View style={styles.dropdownList}>
                      {projectTypeOptions.map((option, index) => (
                        <TouchableOpacity key={index} style={styles.dropdownOption} onPress={() => { setFormData({ ...formData, projectType: option }); setShowProjectTypeDropdown(false); }}>
                          <Text style={styles.dropdownOptionText}>{option}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              <View style={[styles.formGroup, { zIndex: 100 }]}>
                <Text style={styles.label}>Clase de Búsqueda <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity style={styles.dropdown} onPress={() => setShowSearchClassDropdown(!showSearchClassDropdown)}>
                  <Text style={[styles.dropdownText, formData.searchClass ? styles.dropdownTextSelected : null]}>
                    {formData.searchClass || 'Seleccione Clase'}
                  </Text>
                  <Ionicons name={showSearchClassDropdown ? "chevron-up" : "chevron-down"} size={20} color="#666" />
                </TouchableOpacity>
                {showSearchClassDropdown && (
                  <View style={styles.dropdownList}>
                    {searchClassOptions.map((option, index) => (
                      <TouchableOpacity key={index} style={styles.dropdownOption} onPress={() => { setFormData({ ...formData, searchClass: option }); setShowSearchClassDropdown(false); }}>
                        <Text style={styles.dropdownOptionText}>{option}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* 2. DETALLE DE LA NECESIDAD */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="document-text-outline" size={24} color="#1565C0" style={{ marginRight: 10 }} />
                <Text style={styles.cardTitle}>Detalle de la Necesidad</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Descripción Detallada <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Describa detalladamente qué necesita, especificaciones técnicas, cantidades, etc..."
                  placeholderTextColor="#999"
                  multiline={true}
                  numberOfLines={4}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Tags / Palabras Clave</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ej: Tornillos, Acero Inox, Maquinaria (separados por coma)"
                  placeholderTextColor="#999"
                  value={formData.requiredTags.join(', ')}
                  onChangeText={(text) => {
                    const tags = text.split(',').map(t => t.trim()).filter(t => t);
                    setFormData({ ...formData, requiredTags: tags });
                  }}
                />
                <Text style={styles.helperText}>Ayuda a clasificar mejor su solicitud</Text>
              </View>
            </View>

            {/* 3. CRITERIOS DE PROVEEDOR */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="people-outline" size={24} color="#1565C0" style={{ marginRight: 10 }} />
                <Text style={styles.cardTitle}>Preferencias de Proveedor</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Sugerencia de Proveedor (Opcional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Nombre de empresa o contacto sugerido"
                  placeholderTextColor="#999"
                  value={formData.supplierSuggestion}
                  onChangeText={(text) => setFormData({ ...formData, supplierSuggestion: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Tipo de Negocio Preferido</Text>
                <View style={styles.chipContainer}>
                  {[
                    { value: 'cualquiera', label: 'Indiferente' },
                    { value: 'fabricante', label: 'Fabricante' },
                    { value: 'distribuidor', label: 'Distribuidor' },
                    { value: 'servicio', label: 'Servicios' }
                  ].map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.chip,
                        formData.requiredBusinessType === type.value && styles.chipSelected
                      ]}
                      onPress={() => setFormData({ ...formData, requiredBusinessType: type.value as any })}
                    >
                      <Text style={[
                        styles.chipText,
                        formData.requiredBusinessType === type.value && styles.chipTextSelected
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Ubicación de Entrega</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ej: Planta 2, Bodega Central..."
                  placeholderTextColor="#999"
                  value={formData.deliveryLocationSuggestion}
                  onChangeText={(text) => setFormData({ ...formData, deliveryLocationSuggestion: text })}
                />
              </View>
            </View>

            {/* 4. ADJUNTOS */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="attach-outline" size={24} color="#1565C0" style={{ marginRight: 10 }} />
                <Text style={styles.cardTitle}>Documentos Adjuntos</Text>
              </View>

              <View style={styles.uploadArea}>
                <Ionicons name="cloud-upload-outline" size={48} color="#1565C0" style={{ marginBottom: 10 }} />
                <Text style={styles.uploadTitle}>Subir Documentos</Text>
                <Text style={styles.uploadSubtitle}>Pliego Técnico, Ficha Técnica, Planos (Máx 10MB)</Text>

                <TouchableOpacity
                  style={[styles.selectFilesButton, uploadingFile && styles.disabledButton]}
                  onPress={handleSelectFiles}
                  disabled={uploadingFile}
                >
                  {uploadingFile ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="add-circle-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                      <Text style={styles.selectFilesText}>Seleccionar Archivos</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {documents.length > 0 && (
                <View style={styles.documentsList}>
                  {documents.map((doc, index) => (
                    <View key={index} style={styles.documentItem}>
                      <View style={styles.docIcon}>
                        <Ionicons name="document-text" size={24} color="#1976D2" />
                      </View>
                      <View style={styles.documentInfo}>
                        <Text style={styles.documentName} numberOfLines={1}>{doc.name}</Text>
                        <Text style={styles.documentSize}>{formatFileSize(doc.size)}</Text>
                      </View>
                      <TouchableOpacity onPress={() => removeDocument(index)} style={styles.removeButton}>
                        <Ionicons name="close" size={16} color="#D32F2F" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* ACTIONS */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="paper-plane-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.submitButtonText}>Enviar Solicitud</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showSuccessModal} transparent={true} animationType="fade" onRequestClose={() => { setShowSuccessModal(false); if (onNavigateBack) onNavigateBack(); }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark" size={40} color="#4CAF50" />
            </View>
            <Text style={styles.successTitle}>¡Solicitud Enviada!</Text>
            <Text style={styles.successMessage}>
              Su solicitud ha sido creada exitosamente y notificada al departamento de compras.
            </Text>
            <TouchableOpacity style={styles.successButton} onPress={() => { setShowSuccessModal(false); if (onNavigateBack) onNavigateBack(); }}>
              <Text style={styles.successButtonText}>Entendido</Text>
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
    backgroundColor: '#F5F7FA'
  },
  content: {
    flex: 1,
    marginTop: -40, // Overlap
  },
  contentWrapper: {
    paddingHorizontal: 16,
    width: '100%',
  },

  // HERO HEADER
  heroHeader: {
    backgroundColor: '#1565C0',
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },

  // CARDS
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    paddingBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },

  // FORMS
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 20,
  },
  formGroupHalf: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  required: {
    color: '#D32F2F',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },

  // INPUTS
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  dateInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  // DROPDOWN
  dropdown: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 15,
    color: '#999',
  },
  dropdownTextSelected: {
    color: '#333',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    marginTop: 4,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  dropdownOptionText: {
    fontSize: 15,
    color: '#333',
  },

  // CHIPS
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chipSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  chipText: {
    fontSize: 14,
    color: '#666',
  },
  chipTextSelected: {
    color: '#1565C0',
    fontWeight: '600',
  },

  // UPLOAD
  uploadArea: {
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 20,
  },
  selectFilesButton: {
    backgroundColor: '#1565C0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectFilesText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.6,
  },

  // DOC LIST
  documentsList: {
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 16,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 10,
  },
  docIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  documentSize: {
    fontSize: 12,
    color: '#888',
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ACTIONS
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
    marginBottom: 60,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CFD8DC',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#546E7A',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#1565C0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 32, alignItems: 'center', maxWidth: 400, width: '100%' },
  successIconContainer: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  successMessage: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 24, lineHeight: 24 },
  successButton: { backgroundColor: '#1565C0', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 10, width: '100%' },
  successButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', textAlign: 'center' },
});
