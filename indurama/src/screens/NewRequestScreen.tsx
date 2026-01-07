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
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { StatusBar } from 'expo-status-bar';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { uploadRequestFile, formatFileSize, validateFileSize, UploadedFile } from '../services/fileUploadService';
import { generateRequestCode } from '../services/requestService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SolicitanteBottomNav } from '../components/SolicitanteBottomNav';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

const renderIcon = (iconName: string, style: any, fallbackText: string) => {
  try {
    let iconSource;
    switch (iconName) {
      case 'arrow-left':
        iconSource = require('../../assets/icons/arrow-left.png');
        break;
      case 'chevron-down':
        iconSource = require('../../assets/icons/chevron-down.png');
        break;
      case 'folder-upload':
        iconSource = require('../../assets/icons/folder-upload.png');
        break;
      case 'document':
        iconSource = require('../../assets/icons/document.png');
        break;
      default:
        return (
          <View style={[styles.iconPlaceholder, { borderColor: style.tintColor || '#CACACA' }]}>
            <Text style={[styles.iconPlaceholderText, { color: style.tintColor || '#003E85' }]}>
              {fallbackText}
            </Text>
          </View>
        );
    }

    return (
      <Image
        source={iconSource}
        style={[style, { tintColor: style.tintColor || '#003E85' }]}
        resizeMode="contain"
      />
    );
  } catch (error) {
    return (
      <View style={[styles.iconPlaceholder, { borderColor: style.tintColor || '#CACACA' }]}>
        <Text style={[styles.iconPlaceholderText, { color: style.tintColor || '#003E85' }]}>
          {fallbackText}
        </Text>
      </View>
    );
  }
};

import { Request } from '../types';

interface NewRequestScreenProps {
  initialRequest?: Request | null; // Optional prop for editing
  onNavigateBack?: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateToHistory?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToNewRequest?: () => void;
}

export const NewRequestScreen: React.FC<NewRequestScreenProps> = ({
  initialRequest,
  onNavigateBack,
  onNavigateToDashboard,
  onNavigateToHistory,
  onNavigateToProfile,
  onNavigateToNewRequest
}) => {
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
    // Supplier search criteria - NEW
    requiredBusinessType: 'cualquiera' as 'fabricante' | 'distribuidor' | 'servicio' | 'cualquiera',
    requiredCategories: [] as string[],
    requiredTags: [] as string[],
    customRequiredTags: [] as string[],
    industry: '',
  });

  // Populate form if editing
  React.useEffect(() => {
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
      });
      // Load existing documents
      if (initialRequest.documents) {
        setDocuments(initialRequest.documents as UploadedFile[]);
      }
    }
  }, [initialRequest]);

  const [showProjectTypeDropdown, setShowProjectTypeDropdown] = useState(false);
  const [showSearchClassDropdown, setShowSearchClassDropdown] = useState(false);
  const [showUrgencyDropdown, setShowUrgencyDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const urgencyOptions = ['baja', 'media', 'alta'];

  const departmentOptions = [
    'Producción',
    'Mantenimiento',
    'Seguridad',
    'Calidad',
    'Logística',
    'Compras'
  ];

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
    if (onNavigateBack) {
      onNavigateBack();
    } else {
      console.log('Función de navegación de regreso no disponible');
    }
  };

  const handleCancel = () => {
    if (onNavigateBack) {
      onNavigateBack();
    } else {
      console.log('Cancelar solicitud');
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Debes iniciar sesión para enviar una solicitud');
      return;
    }

    // Simple validation
    if (!formData.description || !formData.projectType || !formData.searchClass) {
      Alert.alert('Campos requeridos', 'Por favor completa todos los campos obligatorios');
      return;
    }

    const department = user.department || 'No asignado';

    try {
      setLoading(true);
      const requestCode = generateRequestCode();

      // For new requests, we need to upload files first
      let uploadedDocuments: UploadedFile[] = [];

      if (!initialRequest) {
        // Generate a temporary ID for file upload path
        const tempRequestId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Upload files that haven't been uploaded yet (have local URI)
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
            // File already uploaded
            uploadedDocuments.push(doc);
          }
        }
      } else {
        // For edits, documents are already uploaded or were just uploaded
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
        // Supplier search criteria - NEW
        requiredBusinessType: formData.requiredBusinessType,
        requiredCategories: formData.requiredCategories,
        requiredTags: formData.requiredTags,
        customRequiredTags: formData.customRequiredTags,
        industry: formData.industry,
        // Add documents
        documents: uploadedDocuments,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (initialRequest) {
        // Update existing request
        const requestRef = doc(db, 'requests', initialRequest.id);
        const updateData = {
          ...requestData,
          // Keep original creation data
          code: initialRequest.code,
          createdAt: initialRequest.createdAt,
          // Clear rectification state
          rectificationComment: null, // Clear comment
          status: 'pending' // Reset to pending
        };

        await updateDoc(requestRef, updateData as any);
        Alert.alert('¡Éxito!', 'Solicitud actualizada y enviada a revisión');
      } else {
        // Create new request
        console.log('Saving request:', requestData);
        await addDoc(collection(db, 'requests'), requestData);
        Alert.alert('¡Éxito!', 'Solicitud creada correctamente');
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
        type: '*/*', // Allow all file types
        multiple: true, // Allow multiple files
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      // Validate and upload files
      for (const file of result.assets) {
        // Validate file size (max 10MB)
        if (!validateFileSize(file.size || 0)) {
          Alert.alert('Archivo demasiado grande', `${file.name} excede el tamaño máximo de 10MB`);
          continue;
        }

        // Check if we need to upload now (when editing existing request)
        if (initialRequest) {
          // Upload file immediately
          setUploadingFile(true);
          try {
            const uploadedFile = await uploadRequestFile(
              initialRequest.id,
              file.uri,
              file.name
            );

            setDocuments(prev => [...prev, uploadedFile]);
            Alert.alert('Éxito', `${file.name} subido correctamente`);
          } catch (error) {
            console.error('Error uploading file:', error);
            Alert.alert('Error', `No se pudo subir ${file.name}`);
          } finally {
            setUploadingFile(false);
          }
        } else {
          // For new requests, just store file info to upload on submit
          const fileData: UploadedFile = {
            name: file.name,
            url: file.uri, // Temporary URI, will be replaced with storage URL on submit
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
          onPress: () => {
            setDocuments(prev => prev.filter((_, i) => i !== index));
          },
        },
      ]
    );
  };

  const closeDropdowns = () => {
    setShowProjectTypeDropdown(false);
    setShowSearchClassDropdown(false);
    setShowUrgencyDropdown(false);
    setShowDatePicker(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
              <Image source={require('../../assets/icons/arrow-left.png')} style={styles.backIcon} resizeMode="contain" />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Image source={require('../../assets/icono_indurama.png')} style={styles.logoImage} resizeMode="contain" />
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false} onTouchStart={closeDropdowns}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Fecha Límite <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity style={styles.textInput} onPress={() => setShowDatePicker(true)}>
            <Text style={{ color: '#333' }}>
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

        <View style={styles.formGroup}>
          <Text style={styles.label}>Descripción de la Necesidad <Text style={styles.required}>*</Text></Text>
          <TextInput style={styles.textArea} placeholder="Describa detalladamente la necesidad..." placeholderTextColor="#999" multiline={true} numberOfLines={4} value={formData.description} onChangeText={(text) => setFormData({ ...formData, description: text })} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Tipo de Proyecto <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setShowProjectTypeDropdown(!showProjectTypeDropdown)}>
            <Text style={[styles.dropdownText, formData.projectType ? styles.dropdownTextSelected : null]}>{formData.projectType || 'Seleccione Tipo'}</Text>
            <Image source={require('../../assets/icons/chevron-down.png')} style={[styles.dropdownIcon, showProjectTypeDropdown && styles.dropdownIconRotated]} resizeMode="contain" />
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

        {/* Dynamic Title based on mode */}
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' }}>
          {initialRequest ? 'Editar Solicitud' : 'Nueva Solicitud'}
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Clase de Búsqueda <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setShowSearchClassDropdown(!showSearchClassDropdown)}>
            <Text style={[styles.dropdownText, formData.searchClass ? styles.dropdownTextSelected : null]}>{formData.searchClass || 'Seleccione Clase'}</Text>
            <Image source={require('../../assets/icons/chevron-down.png')} style={[styles.dropdownIcon, showSearchClassDropdown && styles.dropdownIconRotated]} resizeMode="contain" />
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

        <View style={styles.formGroup}>
          <Text style={styles.label}>Sugerencia de Proveedor</Text>
          <TextInput style={styles.textInput} placeholder="Ingresar Sugerencia de Proveedor" placeholderTextColor="#999" value={formData.supplierSuggestion} onChangeText={(text) => setFormData({ ...formData, supplierSuggestion: text })} />
        </View>

        {/* Supplier Search Criteria Section - NEW */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Criterios de Búsqueda de Proveedor (Opcional)</Text>
          <Text style={styles.sectionSubtitle}>
            Especifique requisitos para filtrado inteligente de proveedores
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Tipo de Proveedor</Text>
          <View style={styles.chipContainer}>
            {[
              { value: 'cualquiera', label: 'Cualquiera' },
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
          <Text style={styles.label}>Categorías Requeridas</Text>
          <View style={styles.chipContainer}>
            {[
              { value: 'materia_prima', label: 'Materia Prima' },
              { value: 'componentes', label: 'Componentes' },
              { value: 'productos_terminados', label: 'Productos Terminados' },
              { value: 'insumos', label: 'Insumos' },
              { value: 'servicios', label: 'Servicios' }
            ].map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.chip,
                  formData.requiredCategories.includes(cat.value) && styles.chipSelected
                ]}
                onPress={() => {
                  const newCategories = formData.requiredCategories.includes(cat.value)
                    ? formData.requiredCategories.filter(c => c !== cat.value)
                    : [...formData.requiredCategories, cat.value];
                  setFormData({ ...formData, requiredCategories: newCategories });
                }}
              >
                <Text style={[
                  styles.chipText,
                  formData.requiredCategories.includes(cat.value) && styles.chipTextSelected
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>¿Qué necesitas exactamente?</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ej: Tornillos M6x20, Acero AISI 304 calibre 18, Mecanizado CNC (separados por coma)"
            placeholderTextColor="#999"
            value={formData.requiredTags.join(', ')}
            onChangeText={(text) => {
              const tags = text.split(',').map(t => t.trim()).filter(t => t);
              setFormData({ ...formData, requiredTags: tags });
            }}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Requisitos Especiales o Condiciones Extra</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ej: ISO 9001, capacidad 1000 unid/mes, entrega máx 15 días, ubicación Cuenca"
            placeholderTextColor="#999"
            value={formData.customRequiredTags.join(', ')}
            onChangeText={(text) => {
              const tags = text.split(',').map(t => t.trim()).filter(t => t);
              setFormData({ ...formData, customRequiredTags: tags });
            }}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Adjuntar Documentos Técnicos</Text>
          <View style={styles.uploadArea}>
            <View style={styles.uploadIcon}><Image source={require('../../assets/icons/folder-upload.png')} style={styles.uploadIconImage} resizeMode="contain" /></View>
            <Text style={styles.uploadTitle}>Arrastre archivos o haga clic para subir</Text>
            <Text style={styles.uploadSubtitle}>Pliego Técnico, Ficha Técnica, Oferta Comercial</Text>
            <TouchableOpacity
              style={[styles.selectFilesButton, uploadingFile && styles.submitButtonDisabled]}
              onPress={handleSelectFiles}
              disabled={uploadingFile}
            > {uploadingFile ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Image source={require('../../assets/icons/document.png')} style={styles.selectFilesIcon} resizeMode="contain" />
                <Text style={styles.selectFilesText}>Seleccionar Archivos</Text>
              </>
            )}
            </TouchableOpacity>
          </View>

          {documents.length > 0 && (
            <View style={styles.documentsContainer}>
              <Text style={styles.documentsTitle}>Archivos seleccionados ({documents.length})</Text>
              {documents.map((doc, index) => (
                <View key={index} style={styles.documentItem}>
                  <View style={styles.documentIconContainer}>
                    <Image source={require('../../assets/icons/document.png')} style={styles.documentIcon} resizeMode="contain" />
                  </View>
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentName} numberOfLines={1}>{doc.name}</Text>
                    <Text style={styles.documentSize}>{formatFileSize(doc.size)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeDocument(index)} style={styles.removeButton}>
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}><Text style={styles.cancelButtonText}>Cancelar</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.submitButton, loading && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={loading}><Text style={styles.submitButtonText}>{loading ? 'Enviando...' : 'Enviar Solicitud'}</Text></TouchableOpacity>
        </View>
      </ScrollView >

      <Modal visible={showSuccessModal} transparent={true} animationType="fade" onRequestClose={() => { setShowSuccessModal(false); if (onNavigateBack) onNavigateBack(); }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIconContainer}><Text style={styles.successIcon}>✓</Text></View>
            <Text style={styles.successTitle}>Solicitud creada exitosamente</Text>
            <Text style={styles.successMessage}>Su solicitud ha sido enviada al departamento de compras.</Text>
            <TouchableOpacity style={styles.successButton} onPress={() => { setShowSuccessModal(false); if (onNavigateBack) onNavigateBack(); }}>
              <Text style={styles.successButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Navbar Removed as requested */}
    </View >
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  header: { backgroundColor: '#FFFFFF', paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingHorizontal: isMobile ? 20 : 40, paddingBottom: 20, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }, android: { elevation: 4 } }) },
  headerContent: { alignItems: 'flex-start' },
  titleSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backIcon: { width: 20, height: 20, tintColor: '#003E85' },
  logoContainer: { alignItems: 'center' },
  logoImage: { width: 52, height: 52 },
  content: { flex: 1, paddingHorizontal: isMobile ? 20 : 40, paddingTop: 20 },
  formGroup: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '600', color: '#333333', marginBottom: 8 },
  required: { color: '#E53E3E' },
  dropdown: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownText: { fontSize: 16, color: '#999999' },
  dropdownIcon: { width: 16, height: 16, tintColor: '#666666' },
  textInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#333333' },
  textArea: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#333333', minHeight: 120, textAlignVertical: 'top' },
  uploadArea: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', borderRadius: 12, paddingVertical: 40, paddingHorizontal: 20, alignItems: 'center' },
  uploadIcon: { marginBottom: 16 },
  uploadIconText: { fontSize: 48, color: '#003E85' },
  uploadTitle: { fontSize: 16, fontWeight: '600', color: '#333333', marginBottom: 8, textAlign: 'center' },
  uploadSubtitle: { fontSize: 14, color: '#666666', textAlign: 'center', marginBottom: 20 },
  selectFilesButton: { backgroundColor: '#003E85', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectFilesIcon: { width: 16, height: 16, tintColor: '#FFFFFF' },
  selectFilesText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  selectFilesButtonDisabled: { backgroundColor: '#CBD5E0', opacity: 0.7 },
  selectFilesIconDisabled: { tintColor: '#718096' },
  selectFilesTextDisabled: { color: '#718096' },
  submitButtonDisabled: { opacity: 0.6 },
  actionButtons: { flexDirection: 'row', gap: 16, marginTop: 20, marginBottom: 40 },
  cancelButton: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#666666' },
  submitButton: { flex: 1, backgroundColor: '#003E85', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  submitButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  iconPlaceholder: { width: 20, height: 20, borderWidth: 1, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  iconPlaceholderText: { fontSize: 12, fontWeight: 'bold' },
  uploadIconImage: { width: 48, height: 48, tintColor: '#CACACA' },
  dropdownTextSelected: { color: '#333333' },
  dropdownIconRotated: { transform: [{ rotate: '180deg' }] },
  dropdownList: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, marginTop: 4, maxHeight: 200, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }, android: { elevation: 3 } }) },
  dropdownOption: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dropdownOptionText: { fontSize: 16, color: '#333333' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32, alignItems: 'center', maxWidth: 400, width: '100%', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }, android: { elevation: 8 } }) },
  successIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#E8F5E8', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  successIcon: { fontSize: 32, color: '#4CAF50', fontWeight: 'bold' },
  successTitle: { fontSize: 20, fontWeight: 'bold', color: '#333333', textAlign: 'center', marginBottom: 12 },
  successMessage: { fontSize: 16, color: '#666666', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  successButton: { backgroundColor: '#003E85', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8, minWidth: 120 },
  successButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  // Supplier criteria styles - NEW
  sectionHeader: {
    marginTop: 24,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#004CA3',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#004CA3',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  chipSelected: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  chipText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  // Document styles - NEW
  documentsContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F8F9FB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  documentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  documentIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentIcon: {
    width: 20,
    height: 20,
    tintColor: '#1976D2',
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 2,
  },
  documentSize: {
    fontSize: 12,
    color: '#666666',
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 18,
    color: '#DC2626',
    fontWeight: 'bold',
  },
});
