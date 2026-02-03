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
  KeyboardAvoidingView,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
  ViewStyle
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { StatusBar } from 'expo-status-bar';
import { collection, addDoc, serverTimestamp, doc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { NotificationService } from '../../services/notificationService';
import { uploadRequestFile, formatFileSize, validateFileSize, UploadedFile } from '../../services/fileUploadService';
import { generateRequestCode } from '../../services/requestService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Request } from '../../types';
import { useResponsive } from '../../styles/responsive';
import { getSolicitanteNavItems } from '../../navigation/solicitanteItems';
import { theme } from '../../styles/theme';

// Color unificado
const UNIFIED_BLUE = '#003E85';

interface NewRequestScreenProps {
  initialRequest?: Request | null;
  onNavigateBack?: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateToHistory?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToNewRequest?: () => void;
  onNavigateToNotifications?: () => void;
}

export const NewRequestScreen: React.FC<NewRequestScreenProps> = ({
  initialRequest,
  onNavigateBack,
  onNavigateToDashboard,
  onNavigateToHistory,
  onNavigateToProfile,
  onNavigateToNewRequest,
  onNavigateToNotifications
}) => {
  const { isDesktopView } = useResponsive();
  const { user } = useAuth();
  const { t } = useLanguage();
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
    { label: t('requests.form.projectTypes.investigation'), value: 'Proyecto de Investigacion' },
    { label: t('requests.form.projectTypes.approvedBudget'), value: 'Proyecto con Presupuesto Aprobado' },
    { label: t('requests.form.projectTypes.samples'), value: 'Proyecto para solicitar muestras' }
  ];

  const searchClassOptions = [
    { label: t('requests.form.searchClasses.finishedProduct'), value: 'Producto terminado' },
    { label: t('requests.form.searchClasses.rawMaterial'), value: 'Materia Prima' },
    { label: t('requests.form.searchClasses.machinery'), value: 'Maquinaria' },
    { label: t('requests.form.searchClasses.services'), value: 'Servicios' }
  ];

  const handleGoBack = () => {
    if (onNavigateBack) onNavigateBack();
  };

  const handleCancel = () => {
    if (onNavigateBack) onNavigateBack();
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      Alert.alert(t('common.error'), t('auth.loginError'));
      return;
    }

    if (!formData.description || !formData.projectType || !formData.searchClass) {
      Alert.alert(t('common.actions'), t('errors.required'));
      return;
    }

    const department = user.department || t('solicitante.departmentNotAssigned');

    try {
      setLoading(true);
      const requestCode = generateRequestCode();
      let uploadedDocuments: UploadedFile[] = [];
      const tempRequestId = initialRequest ? initialRequest.id : `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      for (const doc of documents) {
        if (doc.url.startsWith('http')) {
          uploadedDocuments.push(doc);
          continue;
        }

        try {
          const idForPath = initialRequest ? initialRequest.id : tempRequestId;
          const uploaded = await uploadRequestFile(idForPath, doc.url, doc.name);
          uploadedDocuments.push(uploaded);
        } catch (error) {
          console.error('Error uploading file:', error);
          setLoading(false);
          Alert.alert(
            t('common.error'),
            t('requests.form.uploadErrorMessage', { fileName: doc.name })
          );
          return;
        }
      }

      const requestData = {
        code: requestCode,
        userId: user.id,
        userEmail: user.email,
        userName: user.companyName || (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email),
        companyIdentifier: user.companyIdentifier || null,
        department: department || null,
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

        try {
          const managersQuery = query(collection(db, 'users'), where('role', '==', 'gestor'));
          const managersSnapshot = await getDocs(managersQuery);

          for (const managerDoc of managersSnapshot.docs) {
            await NotificationService.create({
              userId: managerDoc.id,
              type: 'new_request',
              title: t('appNotifications.newRequestTitle'),
              message: t('appNotifications.newRequestMessage', { userName: user.companyName || user.email }),
              relatedId: docRef.id,
              relatedType: 'request'
            });
          }
        } catch (notifError) {
          console.error('Error creating notifications:', notifError);
        }

        try {
          await NotificationService.create({
            userId: user.id,
            type: 'request_created',
            title: t('appNotifications.requestCreatedTitle'),
            message: t('appNotifications.requestCreatedMessage', { code: requestData.code }),
            relatedId: docRef.id,
            relatedType: 'request'
          });
        } catch (error) {
          console.error('Error creating self notification:', error);
        }
      }

      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Error creating request:', error);
      Alert.alert(t('common.error'), `${t('requests.form.submitError')}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      for (const file of result.assets) {
        const extension = file.name.split('.').pop()?.toLowerCase();
        const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];

        if (!extension || !allowedExtensions.includes(extension)) {
          Alert.alert(
            t('requests.form.fileFormatError'),
            t('requests.form.fileFormatErrorMessage', { fileName: file.name })
          );
          continue;
        }

        if (!validateFileSize(file.size || 0)) {
          Alert.alert(t('requests.form.fileSizeError'), t('requests.form.fileSizeErrorMessage', { fileName: file.name }));
          continue;
        }

        if (initialRequest) {
          setUploadingFile(true);
          try {
            const uploadedFile = await uploadRequestFile(initialRequest.id, file.uri, file.name);
            setDocuments(prev => [...prev, uploadedFile]);
            Alert.alert(t('requests.form.uploadSuccess'), t('requests.form.uploadSuccessMessage', { fileName: file.name }));
          } catch (error) {
            console.error('Error uploading file:', error);
            Alert.alert(t('common.error'), `${t('requests.form.uploadError')} ${file.name}`);
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
      Alert.alert(t('common.error'), t('requests.form.selectFileError'));
    }
  };

  const removeDocument = (index: number) => {
    Alert.alert(
      t('requests.form.deleteFileTitle'),
      t('requests.form.deleteFileMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
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
    Keyboard.dismiss();
  };

  // --- ESCAPE KEY LISTENER (WEB ONLY) ---
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleKeyDown = (e: any) => {
        if (e.key === 'Escape') {
          closeDropdowns();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  // --- REUSABLE SELECTOR COMPONENT ---
  const Selector = ({
    label,
    value,
    placeholder,
    options,
    visible,
    onToggle,
    onSelect,
    error,
    disabled = false
  }: {
    label: string,
    value: string,
    placeholder: string,
    options: { label: string, value: string }[],
    visible: boolean,
    onToggle: () => void,
    onSelect: (val: string) => void,
    error?: string,
    disabled?: boolean
  }) => {

    return (
      <View style={[styles.formGroup, { zIndex: visible ? 1000 : 1 }]}>
        
        {/* OVERLAY / BACKDROP PARA CERRAR AL HACER CLIC FUERA (SOLO ESCRITORIO) */}
        {isDesktopView && visible && !disabled && (
           <TouchableOpacity
             style={styles.desktopBackdrop} 
             activeOpacity={1} 
             onPress={onToggle}
           />
        )}

        <Text style={styles.label}>
          {label} <Text style={styles.required}>*</Text>
        </Text>
        
        <TouchableOpacity
          style={[
            styles.selectorButton,
            error ? styles.inputError : null,
            disabled && styles.selectorDisabled
          ]}
          onPress={disabled ? undefined : onToggle}
          activeOpacity={disabled ? 1 : 0.7}
        >
          <Text style={[styles.selectorText, (!value || disabled) && styles.placeholderText]}>
            {value || placeholder}
          </Text>
          {!disabled && <Ionicons name={visible ? "chevron-up" : "chevron-down"} size={20} color="#666" />}
        </TouchableOpacity>
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Desktop: Render Dropdown */}
        {isDesktopView && visible && !disabled && (
          <View style={styles.dropdownListDesktop}>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={styles.dropdownOption}
                  onPress={() => onSelect(opt.value)}
                >
                  <Text style={[styles.dropdownOptionText, value === opt.value && styles.dropdownOptionTextSelected]}>
                    {opt.label}
                  </Text>
                  {value === opt.value && <Ionicons name="checkmark" size={18} color={UNIFIED_BLUE} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Mobile: Render Modal */}
        {!isDesktopView && !disabled && (
          <Modal visible={visible} transparent animationType="slide" onRequestClose={onToggle}>
            <TouchableWithoutFeedback onPress={onToggle}>
              <View style={styles.pickerOverlay}>
                <TouchableWithoutFeedback onPress={() => { }}>
                  <View style={styles.pickerContainer}>
                    <View style={styles.pickerHandle} />
                    <View style={styles.pickerHeader}>
                      <Text style={styles.pickerTitle}>{label}</Text>
                      <TouchableOpacity onPress={onToggle}>
                        <Ionicons name="close-circle" size={24} color="#999" />
                      </TouchableOpacity>
                    </View>
                    <FlatList
                      data={options}
                      keyExtractor={(item) => item.value}
                      keyboardShouldPersistTaps="handled"
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.pickerItem}
                          onPress={() => onSelect(item.value)}
                        >
                          <Text style={[styles.pickerItemText, value === item.value && styles.pickerItemTextSelected]}>
                            {item.label}
                          </Text>
                          {value === item.value && <Ionicons name="checkmark" size={20} color={UNIFIED_BLUE} />}
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

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
            {initialRequest ? t('requests.form.editTitle') : t('requests.form.title')}
          </Text>
          <Text style={styles.heroSubtitle}>
            {t('requests.form.subtitle')}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Touchable global para resetear al hacer clic en el fondo general (backup) */}
          <TouchableWithoutFeedback onPress={closeDropdowns}>
            <View style={[
              styles.contentWrapper,
              // MODIFICACIÓN DE ANCHO: Reducido a 800px para mejor proporción
              isDesktopView && { maxWidth: 800, alignSelf: 'center', width: '100%' },
              { minHeight: '100%' }
            ]}>

              {/* 1. INFORMACIÓN BÁSICA */}
              <View style={[
                styles.card,
                isDesktopView && (showProjectTypeDropdown || showSearchClassDropdown) && { zIndex: 3000, position: 'relative' }
              ]}>
                <View style={styles.cardHeader}>
                  <Ionicons name="information-circle-outline" size={24} color={UNIFIED_BLUE} style={{ marginRight: 10 }} />
                  <Text style={styles.cardTitle}>{t('requests.form.basicInfo')}</Text>
                </View>

                <View style={[styles.formRow, !isDesktopView && { flexDirection: 'column' }, { zIndex: showProjectTypeDropdown ? 2000 : 1 }]}>
                  <View style={styles.formGroupHalf}>
                    <Text style={styles.label}>{t('requests.form.dueDate')} <Text style={styles.required}>*</Text></Text>

                    {Platform.OS === 'web' ? (
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        style={{
                          backgroundColor: '#F9FAFB',
                          borderWidth: 1,
                          borderColor: '#E0E0E0',
                          borderRadius: 10,
                          paddingTop: 12,
                          paddingBottom: 12,
                          paddingLeft: 16,
                          paddingRight: 16,
                          fontSize: 15,
                          color: '#333',
                          // --- CORRECCIÓN DEFINITIVA DE FUENTE ---
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                          width: '100%',
                          borderStyle: 'solid',
                          outline: 'none',
                          boxSizing: 'border-box',
                          height: 50
                        } as any}
                        value={formData.dueDate.toISOString().split('T')[0]}
                        onChange={(e) => {
                          const date = new Date(e.target.value);
                          if (!isNaN(date.getTime())) {
                            setFormData({ ...formData, dueDate: date });
                          }
                        }}
                      />
                    ) : (
                      <>
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
                            minimumDate={new Date()}
                            onChange={(event, selectedDate) => {
                              setShowDatePicker(false);
                              if (selectedDate) setFormData({ ...formData, dueDate: selectedDate });
                            }}
                          />
                        )}
                      </>
                    )}
                  </View>

                  <View style={[styles.formGroupHalf, { zIndex: showProjectTypeDropdown ? 1000 : 200 }]}>
                    <Selector
                      label={t('requests.form.projectType')}
                      placeholder={t('requests.form.selectType')}
                      value={
                        projectTypeOptions.find(opt => opt.value === formData.projectType)?.label || formData.projectType
                      }
                      options={projectTypeOptions}
                      visible={showProjectTypeDropdown}
                      onToggle={() => {
                        setShowProjectTypeDropdown(!showProjectTypeDropdown);
                        setShowSearchClassDropdown(false);
                      }}
                      onSelect={(val) => {
                        setFormData({ ...formData, projectType: val });
                        setShowProjectTypeDropdown(false);
                      }}
                    />
                  </View>
                </View>

                <View style={[styles.formGroup, { zIndex: showSearchClassDropdown ? 1000 : 100 }]}>
                  <Selector
                    label={t('requests.form.searchClass')}
                    placeholder={t('requests.form.selectClass')}
                    value={
                      searchClassOptions.find(opt => opt.value === formData.searchClass)?.label || formData.searchClass
                    }
                    options={searchClassOptions}
                    visible={showSearchClassDropdown}
                    onToggle={() => {
                      setShowSearchClassDropdown(!showSearchClassDropdown);
                      setShowProjectTypeDropdown(false);
                    }}
                    onSelect={(val) => {
                      setFormData({ ...formData, searchClass: val });
                      setShowSearchClassDropdown(false);
                    }}
                  />
                </View>
              </View>

              {/* 2. DETALLE DE LA NECESIDAD */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="document-text-outline" size={24} color={UNIFIED_BLUE} style={{ marginRight: 10 }} />
                  <Text style={styles.cardTitle}>{t('requests.form.needsDetail')}</Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>{t('requests.form.detailedDescription')} <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder={t('requests.form.descriptionPlaceholder')}
                    placeholderTextColor="#999"
                    multiline={true}
                    numberOfLines={4}
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>{t('requests.form.tags')}</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder={t('requests.form.tagsPlaceholder')}
                    placeholderTextColor="#999"
                    value={formData.requiredTags.join(', ')}
                    onChangeText={(text) => {
                      const tags = text.split(',').map(t => t.trim()).filter(t => t);
                      setFormData({ ...formData, requiredTags: tags });
                    }}
                  />
                  <Text style={styles.helperText}>{t('requests.form.tagsHelper')}</Text>
                </View>
              </View>

              {/* 3. CRITERIOS DE PROVEEDOR */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="people-outline" size={24} color={UNIFIED_BLUE} style={{ marginRight: 10 }} />
                  <Text style={styles.cardTitle}>{t('requests.form.providerPreferences')}</Text>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>{t('requests.form.supplierSuggestion')}</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder={t('requests.form.supplierPlaceholder')}
                    placeholderTextColor="#999"
                    value={formData.supplierSuggestion}
                    onChangeText={(text) => setFormData({ ...formData, supplierSuggestion: text })}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>{t('requests.form.preferredBusiness')}</Text>
                  <View style={styles.chipContainer}>
                    {[
                      { value: 'cualquiera', label: t('requests.form.businessTypes.any') },
                      { value: 'fabricante', label: t('requests.form.businessTypes.manufacturer') },
                      { value: 'distribuidor', label: t('requests.form.businessTypes.distributor') },
                      { value: 'servicio', label: t('requests.form.businessTypes.service') }
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
                  <Text style={styles.label}>{t('requests.form.deliveryLocation')}</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder={t('requests.form.locationPlaceholder')}
                    placeholderTextColor="#999"
                    value={formData.deliveryLocationSuggestion}
                    onChangeText={(text) => setFormData({ ...formData, deliveryLocationSuggestion: text })}
                  />
                </View>
              </View>

              {/* 4. ADJUNTOS */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="attach-outline" size={24} color={UNIFIED_BLUE} style={{ marginRight: 10 }} />
                  <Text style={styles.cardTitle}>{t('requests.form.documents')}</Text>
                </View>

                <View style={styles.uploadArea}>
                  <Ionicons name="cloud-upload-outline" size={48} color={UNIFIED_BLUE} style={{ marginBottom: 10 }} />
                  <Text style={styles.uploadTitle}>{t('requests.form.uploadTitle')}</Text>
                  <Text style={styles.uploadSubtitle}>{t('requests.form.uploadSubtitle')}</Text>

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
                        <Text style={styles.selectFilesText}>{t('requests.form.selectFiles')}</Text>
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
                  <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
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
                      <Text style={styles.submitButtonText}>{t('requests.form.submitRequest')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showSuccessModal} transparent={true} animationType="fade" onRequestClose={() => { setShowSuccessModal(false); if (onNavigateBack) onNavigateBack(); }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark" size={40} color="#4CAF50" />
            </View>
            <Text style={styles.successTitle}>{t('requests.form.successTitle')}</Text>
            <Text style={styles.successMessage}>
              {t('requests.form.successMessage')}
            </Text>
            <TouchableOpacity style={styles.successButton} onPress={() => { setShowSuccessModal(false); if (onNavigateBack) onNavigateBack(); }}>
              <Text style={styles.successButtonText}>{t('requests.form.understood')}</Text>
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
    marginTop: -40,
  },
  contentWrapper: {
    paddingHorizontal: 16,
    width: '100%',
  },
  heroHeader: {
    backgroundColor: UNIFIED_BLUE,
    paddingTop: Platform.OS === 'web' && Dimensions.get('window').width < 768 ? 40 : 80,
    paddingBottom: Platform.OS === 'web' && Dimensions.get('window').width < 768 ? 60 : 100,
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
    height: 50,
  },
  selectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 50,
    paddingHorizontal: 16,
  },
  selectorDisabled: {
    backgroundColor: '#f0f0f0',
    borderColor: '#eee',
    opacity: 0.7
  },
  selectorText: { color: '#333', fontSize: 15 },
  placeholderText: { color: '#999' },
  inputError: { borderColor: '#e53935' },
  errorText: { color: '#e53935', marginTop: 4, marginLeft: 6, fontSize: 12 },
  
  // --- ESTILOS DE DESKTOP CORREGIDOS ---
  dropdownListDesktop: {
    position: 'absolute',
    top: '100%', left: 0, right: 0, marginTop: 4,
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
    maxHeight: 250,
    overflow: 'hidden',
    zIndex: 9999,
  },
  // Usar "as any" para propiedades web (fixed, cursor)
  desktopBackdrop: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0,
    zIndex: 998,
  } as any,
  
  dropdownOption: {
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  dropdownOptionText: { fontSize: 15, color: '#333' },
  dropdownOptionTextSelected: { fontWeight: '600', color: UNIFIED_BLUE },
  
  // Mobile Picker Styles
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  pickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '70%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10,
  },
  pickerHandle: {
    width: 40, height: 5, backgroundColor: '#E0E0E0', borderRadius: 2.5, alignSelf: 'center', marginBottom: 15,
  },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  pickerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  pickerItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerItemText: { fontSize: 16, color: '#333' },
  pickerItemTextSelected: { color: UNIFIED_BLUE, fontWeight: '600' },
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
    color: UNIFIED_BLUE,
    fontWeight: '600',
  },
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
    backgroundColor: UNIFIED_BLUE,
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
    backgroundColor: UNIFIED_BLUE,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: UNIFIED_BLUE,
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 32, alignItems: 'center', maxWidth: 400, width: '100%' },
  successIconContainer: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  successMessage: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 24, lineHeight: 24 },
  successButton: { backgroundColor: UNIFIED_BLUE, paddingVertical: 14, paddingHorizontal: 40, borderRadius: 10, width: '100%' },
  successButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', textAlign: 'center' },
});