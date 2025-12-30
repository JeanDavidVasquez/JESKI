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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../hooks/useAuth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { loadAllSupplierData } from '../services/supplierDataService';

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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('General');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    // General
    companyName: '',
    ruc: '',
    civilStatus: '',
    address: '', // fiscalAddress
    postalCode: '',
    city: '',
    country: '',
    phone: '', // centralPhone
    website: '',

    // Contacts
    generalManagerName: '',
    generalManagerEmail: '',
    commercialContactName: '',
    commercialContactEmail: '',
    qualityContactName: '',
    qualityContactEmail: '',
    retentionEmail: '', // Keeping this as it was in original, useful for billing

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
    ibanCredit: '', // Maybe 'paymentMethod' better?
    paymentMethod: ''
  });

  // Calculate Progress
  const calculateProgress = () => {
    // Implement simple count of filled fields
    const totalFields = Object.keys(formData).length;
    const filledFields = Object.values(formData).filter(v => v !== '').length;
    return Math.round((filledFields / totalFields) * 100);
  };

  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) return;
      try {
        // Load from subcollections
        const supplierData = await loadAllSupplierData(user.id);

        setFormData(prev => ({
          ...prev,
          // Company Profile
          companyName: supplierData.companyProfile?.fiscalAddress?.split(',')[0] || user.companyName || '',
          address: supplierData.companyProfile?.fiscalAddress || '',
          phone: supplierData.companyProfile?.centralPhone || '',
          website: supplierData.companyProfile?.website || '',
          city: supplierData.companyProfile?.city || '',
          country: supplierData.companyProfile?.country || '',
          postalCode: supplierData.companyProfile?.postalCode || '',
          ruc: supplierData.companyProfile?.ruc || '',

          // Contacts
          generalManagerName: supplierData.contacts?.generalManager?.name || '',
          generalManagerEmail: supplierData.contacts?.generalManager?.email || '',
          commercialContactName: supplierData.contacts?.commercial?.name || '',
          commercialContactEmail: supplierData.contacts?.commercial?.email || '',
          qualityContactName: supplierData.contacts?.quality?.name || '',
          qualityContactEmail: supplierData.contacts?.quality?.email || '',

          // Banking
          bankName: supplierData.banking?.bankName || '',
          bankAddress: supplierData.banking?.bankAddress || '',
          accountNumber: supplierData.banking?.accountNumber || '',
          bicSwift: supplierData.banking?.bicSwift || '',
          iban: supplierData.banking?.iban || '',
          accountType: supplierData.banking?.accountType || '',

          // Credit
          creditDays: supplierData.credit?.creditDays || '',
          deliveryDays: supplierData.credit?.deliveryDays || '',
          paymentMethod: supplierData.credit?.paymentMethod || '',
          retentionEmail: supplierData.credit?.retentionEmail || ''
        }));
      } catch (error) {
        console.error('Error loading supplier data:', error);
      }
    };
    loadUserData();
  }, [user]);

  const saveProgress = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);

      // Import saveAllSupplierData
      const { saveAllSupplierData } = await import('../services/supplierDataService');

      // Save to subcollections
      await saveAllSupplierData(user.id, {
        companyProfile: {
          fiscalAddress: formData.address,
          centralPhone: formData.phone,
          website: formData.website,
          city: formData.city,
          country: formData.country,
          postalCode: formData.postalCode,
          ruc: formData.ruc
        },
        contacts: {
          generalManager: formData.generalManagerName ? {
            name: formData.generalManagerName,
            email: formData.generalManagerEmail
          } : undefined,
          commercial: formData.commercialContactName ? {
            name: formData.commercialContactName,
            email: formData.commercialContactEmail
          } : undefined,
          quality: formData.qualityContactName ? {
            name: formData.qualityContactName,
            email: formData.qualityContactEmail
          } : undefined
        },
        banking: formData.bankName ? {
          bankName: formData.bankName,
          bankAddress: formData.bankAddress,
          accountNumber: formData.accountNumber,
          accountType: formData.accountType,
          bicSwift: formData.bicSwift,
          iban: formData.iban
        } : undefined,
        credit: {
          creditDays: formData.creditDays,
          deliveryDays: formData.deliveryDays,
          paymentMethod: formData.paymentMethod,
          retentionEmail: formData.retentionEmail
        }
      });

      // Also update company name in main user document
      await updateDoc(doc(db, 'users', user.id), {
        companyName: formData.companyName,
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      console.error('Error saving progress:', error);
      alert('Error al guardar progreso');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (onNavigateBack) onNavigateBack();
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    await saveProgress();
    if (activeTab === 'General') {
      setActiveTab('Bancaria');
    } else if (activeTab === 'Bancaria') {
      setActiveTab('Credito');
    } else {
      if (onComplete) onComplete();
    }
  };

  // UI Render Helpers... 
  // (We need to insert the rest of the file logic or keep it but I replaced lines 30-146 which covered most logic)

  // Render Tab Button Helper (Keep or Re-implement)
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

  // Next: renderTab functions need to be updated in subsequent steps.
  // For now I replaced up to renderTabButton. 
  // The original ended at line 146 which was inside renderGeneralTab? 
  // No, line 134 was renderGeneralTab start.
  // So I am chopping off the start of renderGeneralTab. 
  // I must be careful.

  // My ReplacementContent ends with renderTabButton.
  // I will make sure I don't break the file structure.

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
        <Text style={styles.inputLabel}>RUC / ID Fiscal</Text>
        <TextInput
          style={styles.textInput}
          placeholder="01900..."
          placeholderTextColor="#999999"
          value={formData.ruc}
          onChangeText={(value) => updateFormData('ruc', value)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Dirección Fiscal</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Av. de las Américas 4-55, Parque Industrial"
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
        <Text style={styles.inputLabel}>Teléfono Central</Text>
        <TextInput
          style={styles.textInput}
          placeholder="+593 7 288 9900"
          placeholderTextColor="#999999"
          value={formData.phone}
          onChangeText={(value) => updateFormData('phone', value)}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Sitio Web</Text>
        <TextInput
          style={styles.textInput}
          placeholder="www.empresa.com"
          placeholderTextColor="#999999"
          value={formData.website}
          onChangeText={(value) => updateFormData('website', value)}
          autoCapitalize="none"
        />
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Contactos Clave</Text>

      <View style={styles.contactSection}>
        <Text style={styles.contactLabel}>GERENTE GENERAL</Text>
        <TextInput
          style={[styles.textInput, { marginBottom: 8 }]}
          placeholder="Nombre Completo"
          placeholderTextColor="#999999"
          value={formData.generalManagerName}
          onChangeText={(value) => updateFormData('generalManagerName', value)}
        />
        <TextInput
          style={styles.textInput}
          placeholder="Email"
          placeholderTextColor="#999999"
          value={formData.generalManagerEmail}
          onChangeText={(value) => updateFormData('generalManagerEmail', value)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.contactSection}>
        <Text style={styles.contactLabel}>COMERCIAL / VENTAS</Text>
        <TextInput
          style={[styles.textInput, { marginBottom: 8 }]}
          placeholder="Nombre Completo"
          placeholderTextColor="#999999"
          value={formData.commercialContactName}
          onChangeText={(value) => updateFormData('commercialContactName', value)}
        />
        <TextInput
          style={styles.textInput}
          placeholder="Email"
          placeholderTextColor="#999999"
          value={formData.commercialContactEmail}
          onChangeText={(value) => updateFormData('commercialContactEmail', value)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.contactSection}>
        <Text style={styles.contactLabel}>CALIDAD / TÉCNICO</Text>
        <TextInput
          style={[styles.textInput, { marginBottom: 8 }]}
          placeholder="Nombre Completo"
          placeholderTextColor="#999999"
          value={formData.qualityContactName}
          onChangeText={(value) => updateFormData('qualityContactName', value)}
        />
        <TextInput
          style={styles.textInput}
          placeholder="Email"
          placeholderTextColor="#999999"
          value={formData.qualityContactEmail}
          onChangeText={(value) => updateFormData('qualityContactEmail', value)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Correo para Retenciones (Facturación)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="retenciones@empresa.com"
          placeholderTextColor="#999999"
          value={formData.retentionEmail}
          onChangeText={(value) => updateFormData('retentionEmail', value)}
          keyboardType="email-address"
          autoCapitalize="none"
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
      return 'Guardar y Completar';
    }
    return 'Guardar y Continuar';
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

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleGoBack}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          disabled={loading}
        >
          <Text style={styles.nextButtonText}>
            {loading ? 'Guardando...' : getButtonText()}
          </Text>
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
  contactSection: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  contactLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
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