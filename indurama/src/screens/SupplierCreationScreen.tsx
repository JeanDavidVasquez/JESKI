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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

// Tipos para las pestañas
type TabType = 'General' | 'Bancaria' | 'Credito';

// Props para la pantalla
interface SupplierCreationScreenProps {
  onNavigateBack?: () => void;
  onComplete?: () => void;
}

/**
 * Pantalla de Creación de Proveedor con formulario por pestañas
 */
export const SupplierCreationScreen: React.FC<SupplierCreationScreenProps> = ({ 
  onNavigateBack,
  onComplete
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('General');
  const [formData, setFormData] = useState({
    // General
    companyName: '',
    ruc: '',
    civilStatus: '',
    address: '',
    postalCode: '',
    city: '',
    country: '',
    phone: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    retentionEmail: '',
    
    // Bancaria
    bankName: '',
    bankAddress: '',
    accountNumber: '',
    bicSwift: '',
    iban: '',
    accountType: '',
    
    // Credito
    creditDays: '',
    deliveryDays: '',
    ibanCredit: '',
    paymentMethod: ''
  });

  const handleGoBack = () => {
    if (onNavigateBack) {
      onNavigateBack();
    } else {
      console.log('Función de navegación de regreso no disponible');
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    } else {
      console.log('Formulario completado');
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (activeTab === 'General') {
      setActiveTab('Bancaria');
    } else if (activeTab === 'Bancaria') {
      setActiveTab('Credito');
    } else {
      handleComplete();
    }
  };

  const renderTabButton = (tab: TabType, label: string, iconName: string) => {
    const isActive = activeTab === tab;
    
    let iconSource;
    switch (iconName) {
      case 'document':
        iconSource = require('../../assets/icons/document.png');
        break;
      case 'plus':
        iconSource = require('../../assets/icons/plus.png');
        break;
      case 'check':
        iconSource = require('../../assets/icons/check.png');
        break;
      default:
        iconSource = require('../../assets/icons/document.png');
    }

    return (
      <TouchableOpacity
        key={tab}
        style={[styles.tabButton, isActive && styles.tabButtonActive]}
        onPress={() => setActiveTab(tab)}
      >
        <Image 
          source={iconSource}
          style={[styles.tabIcon, { tintColor: isActive ? '#FFFFFF' : '#B0D4FF' }]}
          resizeMode="contain"
        />
        <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderGeneralTab = () => (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>Información General</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Nombre de la Empresa</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Indurama Ecuador S.A."
          placeholderTextColor="#999999"
          value={formData.companyName}
          onChangeText={(value) => updateFormData('companyName', value)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>RUC</Text>
        <TextInput
          style={styles.textInput}
          placeholder="01900..."
          placeholderTextColor="#999999"
          value={formData.ruc}
          onChangeText={(value) => updateFormData('ruc', value)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Estado Civil (si es persona natural)</Text>
        <TouchableOpacity style={styles.dropdownInput}>
          <Text style={styles.dropdownText}>No aplica</Text>
          <Image 
            source={require('../../assets/icons/chevron-down.png')}
            style={[styles.dropdownIcon, { transform: [{ rotate: '0deg' }] }]}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Dirección</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Av. de las Américas"
          placeholderTextColor="#999999"
          value={formData.address}
          onChangeText={(value) => updateFormData('address', value)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Código Postal</Text>
        <TextInput
          style={styles.textInput}
          placeholder="010101"
          placeholderTextColor="#999999"
          value={formData.postalCode}
          onChangeText={(value) => updateFormData('postalCode', value)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Ciudad</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Cuenca"
          placeholderTextColor="#999999"
          value={formData.city}
          onChangeText={(value) => updateFormData('city', value)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>País</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Ecuador"
          placeholderTextColor="#999999"
          value={formData.country}
          onChangeText={(value) => updateFormData('country', value)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Teléfono</Text>
        <TextInput
          style={styles.textInput}
          placeholder="074..."
          placeholderTextColor="#999999"
          value={formData.phone}
          onChangeText={(value) => updateFormData('phone', value)}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Nombre del Contacto</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Juan Pérez"
          placeholderTextColor="#999999"
          value={formData.contactName}
          onChangeText={(value) => updateFormData('contactName', value)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Teléfono de Contacto</Text>
        <TextInput
          style={styles.textInput}
          placeholder="099..."
          placeholderTextColor="#999999"
          value={formData.contactPhone}
          onChangeText={(value) => updateFormData('contactPhone', value)}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Correo/e-mail del Contacto</Text>
        <TextInput
          style={styles.textInput}
          placeholder="contacto@empresa.com"
          placeholderTextColor="#999999"
          value={formData.contactEmail}
          onChangeText={(value) => updateFormData('contactEmail', value)}
          keyboardType="email-address"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Correo para Retenciones</Text>
        <TextInput
          style={styles.textInput}
          placeholder="retenciones@empresa.com"
          placeholderTextColor="#999999"
          value={formData.retentionEmail}
          onChangeText={(value) => updateFormData('retentionEmail', value)}
          keyboardType="email-address"
        />
      </View>
    </View>
  );

  const renderBancariaTab = () => (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>Información Bancaria (para Pagos)</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Nombre del Banco</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Banco de Loja"
          placeholderTextColor="#999999"
          value={formData.bankName}
          onChangeText={(value) => updateFormData('bankName', value)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Dirección del Banco</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Av. 12 de Abril"
          placeholderTextColor="#999999"
          value={formData.bankAddress}
          onChangeText={(value) => updateFormData('bankAddress', value)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Número de Cuenta</Text>
        <TextInput
          style={styles.textInput}
          placeholder="1050603570"
          placeholderTextColor="#999999"
          value={formData.accountNumber}
          onChangeText={(value) => updateFormData('accountNumber', value)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Código BIC/SWIFT</Text>
        <TextInput
          style={styles.textInput}
          placeholder="BPACEC..."
          placeholderTextColor="#999999"
          value={formData.bicSwift}
          onChangeText={(value) => updateFormData('bicSwift', value)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>IBAN(si aplica)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="..."
          placeholderTextColor="#999999"
          value={formData.iban}
          onChangeText={(value) => updateFormData('iban', value)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Tipo de Cuenta</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Ahorro"
          placeholderTextColor="#999999"
          value={formData.accountType}
          onChangeText={(value) => updateFormData('accountType', value)}
        />
      </View>
    </View>
  );

  const renderCreditoTab = () => (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>Condiciones de Crédito</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Días de Crédito</Text>
        <TextInput
          style={styles.textInput}
          placeholder="30"
          placeholderTextColor="#999999"
          value={formData.creditDays}
          onChangeText={(value) => updateFormData('creditDays', value)}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Días de entrega luego de recibida la orden</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Av. 12 de Abril"
          placeholderTextColor="#999999"
          value={formData.deliveryDays}
          onChangeText={(value) => updateFormData('deliveryDays', value)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>IBAN(si aplica)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="EXW (Ex Works)"
          placeholderTextColor="#999999"
          value={formData.ibanCredit}
          onChangeText={(value) => updateFormData('ibanCredit', value)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Modo preferido de recepción de pago</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Ahorro"
          placeholderTextColor="#999999"
          value={formData.paymentMethod}
          onChangeText={(value) => updateFormData('paymentMethod', value)}
        />
      </View>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'General':
        return renderGeneralTab();
      case 'Bancaria':
        return renderBancariaTab();
      case 'Credito':
        return renderCreditoTab();
      default:
        return renderGeneralTab();
    }
  };

  const getButtonText = () => {
    if (activeTab === 'Credito') {
      return 'Guardar y Marcar como Completado';
    }
    return 'Siguiente';
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Image 
            source={require('../../assets/icons/arrow-left.png')}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>1. Creación de Proveedor</Text>
        </View>
        
        <TouchableOpacity style={styles.menuButton}>
          <Image 
            source={require('../../assets/icons/plus.png')}
            style={styles.menuIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {renderTabButton('General', 'General', 'document')}
        {renderTabButton('Bancaria', 'Bancaria', 'plus')}
        {renderTabButton('Credito', 'Crédito', 'check')}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>{getButtonText()}</Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: '#333333',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    width: 20,
    height: 20,
    tintColor: '#333333',
  },
  tabsContainer: {
    backgroundColor: '#003E85',
    flexDirection: 'row',
    paddingVertical: 0,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#B0D4FF',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    }),
  },
  dropdownInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    }),
  },
  dropdownText: {
    fontSize: 16,
    color: '#999999',
  },
  dropdownIcon: {
    width: 16,
    height: 16,
    tintColor: '#999999',
    transform: [{ rotate: '90deg' }],
  },
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextButton: {
    backgroundColor: '#003E85',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
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
    }),
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});