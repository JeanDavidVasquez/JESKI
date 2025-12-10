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

const { width } = Dimensions.get('window');
const isMobile = width < 768;

// Función para mostrar iconos PNG con fallback
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

// Props para la pantalla
interface NewRequestScreenProps {
  onNavigateBack?: () => void;
}

/**
 * Pantalla de Nueva Solicitud para el rol de Solicitante
 */
export const NewRequestScreen: React.FC<NewRequestScreenProps> = ({ onNavigateBack }) => {
  const [formData, setFormData] = useState({
    department: '',
    requestDate: '',
    description: '',
    projectType: '',
    searchClass: '',
    supplierSuggestion: '',
  });

  const [showProjectTypeDropdown, setShowProjectTypeDropdown] = useState(false);
  const [showSearchClassDropdown, setShowSearchClassDropdown] = useState(false);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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

  const handleSubmit = () => {
    console.log('Enviar solicitud', formData);
    setShowSuccessModal(true);
  };

  const handleSelectFiles = () => {
    console.log('Seleccionar archivos');
  };

  // Función para cerrar dropdowns al tocar el contenido
  const closeDropdowns = () => {
    setShowDepartmentDropdown(false);
    setShowProjectTypeDropdown(false);
    setShowSearchClassDropdown(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
              <Image 
                source={require('../../assets/icons/arrow-left.png')} 
                style={styles.backIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            
            {/* Logo de Indurama */}
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/icono_indurama.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>
      </View>

      {/* Contenido */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        onTouchStart={closeDropdowns}
      >
        
        {/* Departamento */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Departamento <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity style={styles.dropdown}>
            <Text style={styles.dropdownText}>Seleccione Tipo de Proyecto</Text>
            {renderIcon('chevron-down', styles.dropdownIcon, '▼')}
          </TouchableOpacity>
        </View>

        {/* Fecha de Solicitud */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Fecha de Solicitud <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="dd/mm/aaaa"
            placeholderTextColor="#999"
            value={formData.requestDate}
            onChangeText={(text) => setFormData({...formData, requestDate: text})}
          />
        </View>

        {/* Descripción de la Necesidad */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Descripción de la Necesidad <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.textArea}
            placeholder="Describa detalladamente la necesidad..."
            placeholderTextColor="#999"
            multiline={true}
            numberOfLines={4}
            value={formData.description}
            onChangeText={(text) => setFormData({...formData, description: text})}
          />
        </View>

        {/* Tipo de Proyecto */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Tipo de Proyecto <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity 
            style={styles.dropdown} 
            onPress={() => setShowProjectTypeDropdown(!showProjectTypeDropdown)}
          >
            <Text style={[styles.dropdownText, formData.projectType ? styles.dropdownTextSelected : null]}>
              {formData.projectType || 'Seleccione Tipo'}
            </Text>
            <Image 
              source={require('../../assets/icons/chevron-down.png')} 
              style={[styles.dropdownIcon, showProjectTypeDropdown && styles.dropdownIconRotated]}
              resizeMode="contain"
            />
          </TouchableOpacity>
          
          {showProjectTypeDropdown && (
            <View style={styles.dropdownList}>
              {projectTypeOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownOption}
                  onPress={() => {
                    setFormData({...formData, projectType: option});
                    setShowProjectTypeDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownOptionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Clase de Búsqueda */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Clase de Búsqueda <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity 
            style={styles.dropdown}
            onPress={() => setShowSearchClassDropdown(!showSearchClassDropdown)}
          >
            <Text style={[styles.dropdownText, formData.searchClass ? styles.dropdownTextSelected : null]}>
              {formData.searchClass || 'Seleccione Clase'}
            </Text>
            <Image 
              source={require('../../assets/icons/chevron-down.png')} 
              style={[styles.dropdownIcon, showSearchClassDropdown && styles.dropdownIconRotated]}
              resizeMode="contain"
            />
          </TouchableOpacity>
          
          {showSearchClassDropdown && (
            <View style={styles.dropdownList}>
              {searchClassOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.dropdownOption}
                  onPress={() => {
                    setFormData({...formData, searchClass: option});
                    setShowSearchClassDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownOptionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Sugerencia de Proveedor */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Sugerencia de Proveedor</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ingresar Sugerencia de Proveedor"
            placeholderTextColor="#999"
            value={formData.supplierSuggestion}
            onChangeText={(text) => setFormData({...formData, supplierSuggestion: text})}
          />
        </View>

        {/* Adjuntar Documentos Técnicos */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Adjuntar Documentos Técnicos <Text style={styles.required}>*</Text>
          </Text>
          
          <View style={styles.uploadArea}>
            <View style={styles.uploadIcon}>
              <Image 
                source={require('../../assets/icons/folder-upload.png')} 
                style={styles.uploadIconImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.uploadTitle}>Arrastre archivos o haga clic para subir</Text>
            <Text style={styles.uploadSubtitle}>
              Pliego Técnico, Ficha Técnica, Oferta Comercial
            </Text>
            <TouchableOpacity style={styles.selectFilesButton} onPress={handleSelectFiles}>
              <Image 
                source={require('../../assets/icons/document.png')} 
                style={styles.selectFilesIcon}
                resizeMode="contain"
              />
              <Text style={styles.selectFilesText}>Seleccionar Archivos</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Botones de Acción */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Enviar Solicitud</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
      
      {/* Modal de Éxito */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowSuccessModal(false);
          if (onNavigateBack) {
            onNavigateBack();
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIconContainer}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
            <Text style={styles.successTitle}>Solicitud creada exitosamente</Text>
            <Text style={styles.successMessage}>
              Su solicitud ha sido enviada al departamento de compras.
            </Text>
            <TouchableOpacity 
              style={styles.successButton}
              onPress={() => {
                setShowSuccessModal(false);
                if (onNavigateBack) {
                  onNavigateBack();
                }
              }}
            >
              <Text style={styles.successButtonText}>Aceptar</Text>
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
    backgroundColor: '#F8F9FB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: isMobile ? 20 : 40,
    paddingBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerContent: {
    alignItems: 'flex-start',
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: '#003E85',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: 52,
    height: 52,
  },
  content: {
    flex: 1,
    paddingHorizontal: isMobile ? 20 : 40,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  required: {
    color: '#E53E3E',
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#999999',
  },
  dropdownIcon: {
    width: 16,
    height: 16,
    tintColor: '#666666',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  uploadArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  uploadIcon: {
    marginBottom: 16,
  },
  uploadIconText: {
    fontSize: 48,
    color: '#003E85',
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  selectFilesButton: {
    backgroundColor: '#003E85',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectFilesIcon: {
    width: 16,
    height: 16,
    tintColor: '#FFFFFF',
  },
  selectFilesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#003E85',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  iconPlaceholder: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPlaceholderText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  uploadIconImage: {
    width: 48,
    height: 48,
    tintColor: '#CACACA',
  },
  dropdownTextSelected: {
    color: '#333333',
  },
  dropdownIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#333333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  successIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 32,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  successButton: {
    backgroundColor: '#003E85',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 120,
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});