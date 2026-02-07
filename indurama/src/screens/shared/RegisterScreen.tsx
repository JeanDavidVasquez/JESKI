import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Image,
  TextInput,
  Text,
  Modal,
  FlatList,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { AuthService } from '../../services';
import { MasterDataService, Company, Department } from '../../services/masterDataService';
import { User, UserRole } from '../../types';
import { TermsConditionsScreen } from './TermsConditionsScreen';

const { width, height } = Dimensions.get('window');
const isMobile = width < 768;

interface RegisterScreenProps {
  onNavigateToLogin?: () => void;
  onRegister?: (user: User) => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onNavigateToLogin,
  onRegister
}) => {
  // Step: 'selection' | 'service_focus' | 'form' (Personal) | 'provider_wizard'
  const [step, setStep] = useState<'selection' | 'service_focus' | 'form' | 'provider_wizard'>('selection');
  const [isSupplier, setIsSupplier] = useState(false);
  const [providerWizardStep, setProviderWizardStep] = useState(1); // 1..5 for the wizard pages

  // Data State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingDepts, setLoadingDepts] = useState(false);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');

  // New Personal Fields
  const [companyIdentifier, setCompanyIdentifier] = useState(''); // Stores Name (display)
  const [selectedCompanyId, setSelectedCompanyId] = useState(''); // Stores ID (logic)
  const [department, setDepartment] = useState('');

  // Selector State
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);

  // Common Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Supplier Fields - SAP & General
  const [companyName, setCompanyName] = useState(''); // Razón Social
  const [phone, setPhone] = useState('');

  // SAP - Step 1: Identity
  const [bpType, setBpType] = useState<'Person' | 'Organization'>('Organization');
  const [taxId, setTaxId] = useState(''); // RUC
  const [legalForm, setLegalForm] = useState('');
  const [treatment, setTreatment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // SAP - Step 2: Location
  const [street, setStreet] = useState('');
  const [street2, setStreet2] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [district, setDistrict] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('Ecuador');

  // SAP - Step 3: Banking
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [accountType, setAccountType] = useState('Ahorros');
  const [bankKey, setBankKey] = useState('');

  // SAP - Step 4: Society (Optional/Defaults)
  const [society, setSociety] = useState('INDURAMA');
  const [paymentCondition, setPaymentCondition] = useState('');

  // SAP - Step 5: Service Focus & Commercial Activity
  const [serviceFocus, setServiceFocus] = useState(''); // "Reparación", "Construcción", etc.

  // Commercial Activity Specifics
  const [businessType, setBusinessType] = useState<string[]>([]); // "Fabricante", "Distribuidor", etc.
  const [productCategories, setProductCategories] = useState<string[]>([]); // "Materia Prima", etc.
  const [commercialDescription, setCommercialDescription] = useState(''); // "Principales materias primas..."

  // UI State
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error' | 'info'>('success');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  // Terms State
  const [showTerms, setShowTerms] = useState(false);
  const [_registeredUser, setRegisteredUser] = useState<User | null>(null);

  // --- 1. REFERENCIAS PARA FOCO AUTOMÁTICO ---
  const firstNameRef = useRef<TextInput>(null);
  const companyNameRef = useRef<TextInput>(null);

  // --- 2. EFECTO PARA ACTIVAR EL FOCO AL ENTRAR AL FORMULARIO ---
  useEffect(() => {
    if (step === 'form') {
      const timer = setTimeout(() => {
        if (isSupplier) {
          companyNameRef.current?.focus();
        } else {
          firstNameRef.current?.focus();
        }
      }, 200); // Pequeño delay aumentado a 200ms para asegurar renderizado
      return () => clearTimeout(timer);
    }
  }, [step, isSupplier]);

  // --- Lógica para cerrar Dropdowns (Clic fuera + tecla ESC) ---
  const closeDropdowns = () => {
    if (showCompanyDropdown) setShowCompanyDropdown(false);
    if (showDeptDropdown) setShowDeptDropdown(false);
  };

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
  }, [showCompanyDropdown, showDeptDropdown]);
  // -------------------------------------------------------------

  // --- Fetch Data ---
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoadingData(true);
      try {
        await MasterDataService.seedInitialData(); // Ensure defaults exist
        const comps = await MasterDataService.getCompanies();
        setCompanies(comps);
      } catch (error) {
        console.error('Error fetching companies:', error);
      } finally {
        setLoadingData(false);
      }
    };
    fetchCompanies();
  }, []);

  // Fetch Departments when Company Changes
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!selectedCompanyId) {
        setDepartments([]);
        return;
      }

      setLoadingDepts(true);
      try {
        const depts = await MasterDataService.getDepartments(selectedCompanyId);
        setDepartments(depts);
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        setLoadingDepts(false);
      }
    };

    fetchDepartments();
  }, [selectedCompanyId]);

  // --- Helpers ---
  const setFieldError = (field: string, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  };

  const clearFieldError = (field: string) => {
    setErrors(prev => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const showCustomModal = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    if (modalType === 'success') {
      onNavigateToLogin?.();
    }
  };

  const selectRole = (supplier: boolean) => {
    setIsSupplier(supplier);
    setErrors({});
    // Simplify: Both roles go directly to form
    setStep('form');
  };

  // --- Validation & Submit ---
  const handleRegisterButton = () => {
    setErrors({});
    const newErrors: Record<string, string> = {};

    // Validate Empty Fields
    if (isSupplier) {
      if (!companyName.trim()) newErrors.companyName = 'Razón Social es obligatoria';
      if (!taxId.trim()) newErrors.taxId = 'RUC / ID Fiscal es obligatorio';
      if (!phone.trim()) newErrors.phone = 'Teléfono de Contacto es obligatorio';
    } else {
      if (!firstName.trim()) newErrors.firstName = 'Nombre es obligatorio';
      if (!surname.trim()) newErrors.surname = 'Apellido es obligatorio';
      if (!companyIdentifier) newErrors.companyIdentifier = 'Selecciona tu empresa';
      if (!department) newErrors.department = 'Selecciona tu departamento';
    }

    if (!email.trim()) newErrors.email = 'Correo Electrónico es obligatorio';
    if (!password) newErrors.password = 'Contraseña es obligatoria';
    if (!confirmPassword) newErrors.confirmPassword = 'Confirmar Contraseña es obligatoria';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Validate Formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFieldError('email', 'Por favor ingresa un correo electrónico válido');
      return;
    }

    if (isSupplier) {
      const phoneDigits = /^\d+$/;
      if (!phoneDigits.test(phone)) {
        setFieldError('phone', 'El teléfono debe contener sólo números');
        return;
      }
    }

    if (password.length < 6) {
      setFieldError('password', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setFieldError('confirmPassword', 'Las contraseñas no coinciden');
      return;
    }

    // Show Terms
    setShowTerms(true);
  };

  const finalizeRegistration = async () => {
    setShowTerms(false);
    setLoading(true);

    try {
      const role = isSupplier ? UserRole.PROVEEDOR : UserRole.SOLICITANTE;

      // Prepare Additional Data
      const additionalData: any = {};

      if (isSupplier) {
        additionalData.companyName = companyName;
        additionalData.phone = phone;

        // SAP Identity
        additionalData.bpType = bpType || 'Organization';
        additionalData.taxId = taxId;
        additionalData.ruc = taxId; // Ensure mapping for EPI
        additionalData.searchTerm = searchTerm || companyName.toUpperCase();

        // Location
        additionalData.country = country;
        additionalData.region = region;
        additionalData.city = city;
        additionalData.postalCode = postalCode;
        additionalData.street = street;
        // street2, houseNumber, district if needed

        // Banking
        additionalData.bankName = bankName;
        additionalData.bankAccount = bankAccount;
        additionalData.accountType = accountType;
        additionalData.bankKey = bankKey;

        // Society
        additionalData.society = society;
        additionalData.paymentCondition = paymentCondition;

        // Commercial Activity
        additionalData.serviceFocus = serviceFocus;
        additionalData.businessType = businessType; // Array
        additionalData.productCategories = productCategories; // Array
        additionalData.commercialDescription = commercialDescription;
      } else {
        additionalData.companyIdentifier = companyIdentifier;
        additionalData.department = department; // Pass department here
      }

      const finalFirstName = isSupplier ? companyName : firstName;
      const finalSurname = isSupplier ? '(Empresa)' : surname;

      const result = await AuthService.signUp(email, password, finalFirstName, finalSurname, role, additionalData);

      if (result.success && result.data) {
        setRegisteredUser(result.data);
        showCustomModal(
          'success',
          'Registro Exitoso',
          '¡Felicidades! Tu cuenta ha sido creada correctamente.'
        );

        setTimeout(() => {
          setModalVisible(false);
          onNavigateToLogin?.();
        }, 5000);
      } else {
        showCustomModal(
          'error',
          'Error de Registro',
          result.error || 'Algo salió mal. Intenta de nuevo.'
        );
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      showCustomModal('error', 'Error', 'Ocurrió un error inesperado de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const getModalStyles = () => {
    switch (modalType) {
      case 'success': return { bgCircle: '#E8F5E9', iconColor: '#4CAF50', btnBg: '#4CAF50', icon: 'checkmark' };
      case 'error': return { bgCircle: '#FFEBEE', iconColor: '#F44336', btnBg: '#F44336', icon: 'close' };
      case 'info': return { bgCircle: '#E3F2FD', iconColor: '#2196F3', btnBg: '#2196F3', icon: 'information' };
      default: return { bgCircle: '#E8F5E9', iconColor: '#4CAF50', btnBg: '#4CAF50', icon: 'checkmark' };
    }
  };
  const modalStyle = getModalStyles();

  // --- UI Components ---

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
    options: { label: string, value: string, id: string }[],
    visible: boolean,
    onToggle: () => void,
    onSelect: (val: string, id: string) => void,
    error?: string,
    disabled?: boolean
  }) => {

    // Desktop Dropdown Content
    const dropdownContent = (
      <View style={styles.dropdownListDesktop}>
        <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              style={styles.dropdownOption}
              onPress={() => onSelect(opt.value, opt.id)}
            >
              <Text style={[styles.dropdownOptionText, value === opt.value && styles.dropdownOptionTextSelected]}>
                {opt.label}
              </Text>
              {value === opt.value && <Ionicons name="checkmark" size={18} color={theme.colors.primary} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );

    return (
      <View style={[styles.inputContainer, { zIndex: visible ? 1000 : 1 }]}>
        <Text style={styles.inputLabel}>{label}</Text>
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

        {/* Desktop: Render Dropdown Inline (Absolute) */}
        {!isMobile && visible && !disabled && dropdownContent}

        {/* Mobile: Render Modal */}
        {isMobile && !disabled && (
          <Modal visible={visible} transparent animationType="slide" onRequestClose={onToggle}>
            <View style={styles.pickerOverlay}>
              <View style={styles.pickerContainer}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>{label}</Text>
                  <TouchableOpacity onPress={onToggle}>
                    <Ionicons name="close-circle" size={24} color="#999" />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={options}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.pickerItem}
                      onPress={() => onSelect(item.value, item.id)}
                    >
                      <Text style={[styles.pickerItemText, value === item.value && styles.pickerItemTextSelected]}>
                        {item.label}
                      </Text>
                      {value === item.value && <Ionicons name="checkmark" size={20} color={theme.colors.primary} />}
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>
        )}
      </View>
    );
  };

  const renderSelectionStep = () => (
    <View style={styles.selectionContainer}>
      <Text style={styles.selectionTitle}>Bienvenido</Text>
      <Text style={styles.selectionSubtitle}>Por favor, selecciona tu tipo de perfil para continuar</Text>

      <View style={styles.cardContainer}>
        {/* Personal Card */}
        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => selectRole(false)}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#E0F2F1' }]}>
            <Ionicons name="person" size={40} color={theme.colors.primary} />
          </View>
          <Text style={styles.roleTitle}>Personal</Text>
          <Text style={styles.roleDescription}>
            Para colaboradores de las empresas del grupo (Indurama, Mercandina, etc.)
          </Text>
        </TouchableOpacity>

        {/* Proveedor Card */}
        <TouchableOpacity
          style={styles.roleCard}
          onPress={() => selectRole(true)}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="business" size={40} color="#FF9800" />
          </View>
          <Text style={styles.roleTitle}>Proveedor</Text>
          <Text style={styles.roleDescription}>
            Para empresas externas que desean ofrecer bienes o servicios.
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.loginLink} onPress={onNavigateToLogin}>
        <Text style={styles.loginText}>
          ¿Ya tienes cuenta? <Text style={styles.loginLinkBold}>Inicia sesión</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );

  // --- SERVICE FOCUS STEP ---
  const renderServiceFocusStep = () => {
    const options = [
      { id: 'reparacion', label: 'Servicio Reparación', icon: 'construct' },
      { id: 'construccion', label: 'Servicios de Construcción', icon: 'business' },
      { id: 'asesoramiento', label: 'Servicio de Asesoramiento', icon: 'people' },
      { id: 'repuestos', label: 'Venta de Repuestos', icon: 'cart' },
      { id: 'suministros', label: 'Suministros / Materia Prima', icon: 'cube' },
    ];

    return (
      <View style={styles.selectionContainer}>
        <Text style={styles.selectionTitle}>Enfoque de Servicio</Text>
        <Text style={styles.selectionSubtitle}>Seleccione la categoría principal de su actividad</Text>

        <View style={styles.focusGrid}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              style={[styles.focusCard, serviceFocus === opt.id && styles.focusCardSelected]}
              onPress={() => {
                setServiceFocus(opt.id);
                setStep('provider_wizard');
                setProviderWizardStep(1);
              }}
            >
              <View style={[styles.focusIconCircle, serviceFocus === opt.id && styles.focusIconCircleSelected]}>
                <Ionicons name={opt.icon as any} size={32} color={serviceFocus === opt.id ? '#FFF' : theme.colors.primary} />
              </View>
              <Text style={[styles.focusLabel, serviceFocus === opt.id && styles.focusLabelSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={() => setStep('selection')} style={styles.backLink}>
          <Text style={styles.backLinkText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // --- PROVIDER WIZARD STEP ---
  const handleWizardNext = () => {
    if (providerWizardStep < 5) {
      setProviderWizardStep(prev => prev + 1);
      // Reset scroll if needed?
    } else {
      // Final step -> Go to common security step (email/pass)
      setStep('form');
    }
  };

  const handleWizardBack = () => {
    if (providerWizardStep > 1) {
      setProviderWizardStep(prev => prev - 1);
    } else {
      setStep('service_focus');
    }
  };

  const renderProviderWizardStep = () => {
    const steps = [
      { id: 1, title: 'Datos Generales', icon: 'id-card' },
      { id: 2, title: 'Ubicación', icon: 'location' },
      { id: '3', title: 'Bancario', icon: 'card' },
      { id: 4, title: 'Sociedad', icon: 'business' },
      { id: 5, title: 'Actividad', icon: 'briefcase' },
    ];

    // Helper title
    const currentStepTitle = steps[providerWizardStep - 1] ? steps[providerWizardStep - 1].title : '';

    return (
      <View style={styles.formContainer}>
        {/* Wizard Header */}
        <View style={styles.wizardHeader}>
          <TouchableOpacity onPress={handleWizardBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View>
            <Text style={styles.formTitle}>Registro Proveedor</Text>
            <Text style={styles.wizardStepIndicator}>Paso {providerWizardStep} de 5: {currentStepTitle}</Text>
          </View>
        </View>

        {/* Wizard Progress Bar */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${(providerWizardStep / 5) * 100}%` }]} />
        </View>

        <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>

          {/* STEP 1: IDENTITY */}
          {providerWizardStep === 1 && (
            <View>
              <Text style={styles.sectionTitle}>Identificación (SAP)</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Tipo de BP (Business Partner)</Text>
                <View style={styles.radioRow}>
                  <TouchableOpacity
                    style={[styles.radioButton, bpType === 'Organization' && styles.radioButtonSelected]}
                    onPress={() => setBpType('Organization')}>
                    <Text style={[styles.radioText, bpType === 'Organization' && styles.radioTextSelected]}>Organización</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.radioButton, bpType === 'Person' && styles.radioButtonSelected]}
                    onPress={() => setBpType('Person')}>
                    <Text style={[styles.radioText, bpType === 'Person' && styles.radioTextSelected]}>Persona</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>RUC / Identificación Fiscal</Text>
                <TextInput
                  style={styles.directInput}
                  placeholder="17900..."
                  value={taxId}
                  onChangeText={setTaxId}
                  keyboardType="numeric"
                  caretHidden={false}
                  selectionColor={theme.colors.primary}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Razón Social / Nombre Completo</Text>
                <TextInput
                  style={styles.directInput}
                  placeholder="Nombre legal de la empresa o persona"
                  value={companyName}
                  onChangeText={setCompanyName}
                  caretHidden={false}
                  selectionColor={theme.colors.primary}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Concepto de Búsqueda (SAP)</Text>
                <TextInput
                  style={styles.directInput}
                  placeholder="Ej: FERRETERIA CENTRAL"
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  caretHidden={false}
                  selectionColor={theme.colors.primary}
                />
                <Text style={styles.helperText}>Nombre corto para búsquedas rápidas en SAP</Text>
              </View>
            </View>
          )}

          {/* STEP 2: LOCATION */}
          {providerWizardStep === 2 && (
            <View>
              <Text style={styles.sectionTitle}>Ubicación y Contacto</Text>

              <View style={styles.nameRow}>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>País</Text>
                  <TextInput style={styles.directInput} value={country} onChangeText={setCountry} caretHidden={false} selectionColor={theme.colors.primary} />
                </View>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>Región / Provincia</Text>
                  <TextInput style={styles.directInput} value={region} onChangeText={setRegion} placeholder="Ej: Azuay" caretHidden={false} selectionColor={theme.colors.primary} />
                </View>
              </View>

              <View style={styles.nameRow}>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>Ciudad</Text>
                  <TextInput style={styles.directInput} value={city} onChangeText={setCity} caretHidden={false} selectionColor={theme.colors.primary} />
                </View>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>Código Postal</Text>
                  <TextInput style={styles.directInput} value={postalCode} onChangeText={setPostalCode} keyboardType="numeric" caretHidden={false} selectionColor={theme.colors.primary} />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Calle Principal y Número</Text>
                <TextInput style={styles.directInput} value={street} onChangeText={setStreet} placeholder="Av. Las Américas 12-45" caretHidden={false} selectionColor={theme.colors.primary} />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Teléfono Principal</Text>
                <TextInput style={styles.directInput} value={phone} onChangeText={setPhone} keyboardType="phone-pad" caretHidden={false} selectionColor={theme.colors.primary} />
              </View>
            </View>
          )}

          {/* STEP 3: BANKING */}
          {providerWizardStep === 3 && (
            <View>
              <Text style={styles.sectionTitle}>Información Bancaria</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nombre del Banco</Text>
                <TextInput style={styles.directInput} value={bankName} onChangeText={setBankName} placeholder="Ej: Banco Pichincha" caretHidden={false} selectionColor={theme.colors.primary} />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Número de Cuenta</Text>
                <TextInput style={styles.directInput} value={bankAccount} onChangeText={setBankAccount} keyboardType="numeric" caretHidden={false} selectionColor={theme.colors.primary} />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Tipo de Cuenta</Text>
                <View style={styles.radioRow}>
                  <TouchableOpacity
                    style={[styles.radioButton, accountType === 'Ahorros' && styles.radioButtonSelected]}
                    onPress={() => setAccountType('Ahorros')}>
                    <Text style={[styles.radioText, accountType === 'Ahorros' && styles.radioTextSelected]}>Ahorros</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.radioButton, accountType === 'Corriente' && styles.radioButtonSelected]}
                    onPress={() => setAccountType('Corriente')}>
                    <Text style={[styles.radioText, accountType === 'Corriente' && styles.radioTextSelected]}>Corriente</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Clave de Banco (SAP)</Text>
                <TextInput style={styles.directInput} value={bankKey} onChangeText={setBankKey} placeholder="Código interno bancario" caretHidden={false} selectionColor={theme.colors.primary} />
              </View>
            </View>
          )}

          {/* STEP 4: SOCIETY & PURCHASING */}
          {providerWizardStep === 4 && (
            <View>
              <Text style={styles.sectionTitle}>Datos de Sociedad</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Sociedad</Text>
                <TextInput style={[styles.directInput, styles.readOnly]} value={society} editable={false} />
                <Text style={styles.helperText}>Sociedad predeterminada para el registro</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Condición de Pago Solicitada</Text>
                <TextInput style={styles.directInput} value={paymentCondition} onChangeText={setPaymentCondition} placeholder="Ej: 30 días fecha factura" caretHidden={false} selectionColor={theme.colors.primary} />
              </View>
            </View>
          )}

          {/* STEP 5: COMMERCIAL ACTIVITY (NEW) */}
          {providerWizardStep === 5 && (
            <View>
              <Text style={styles.sectionTitle}>Actividad Comercial</Text>
              <Text style={styles.sectionSubtitle}>Esta información es clave para que los solicitantes encuentren sus servicios.</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Tipo de Negocio</Text>
                {['Fabricante', 'Distribuidor', 'Servicio Técnico', 'Consultoría'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.checkboxRow, { marginBottom: 8 }]}
                    onPress={() => {
                      if (businessType.includes(type)) setBusinessType(prev => prev.filter(t => t !== type));
                      else setBusinessType(prev => [...prev, type]);
                    }}
                  >
                    <View style={[styles.checkbox, businessType.includes(type) && styles.checkboxChecked]}>
                      {businessType.includes(type) && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <Text style={styles.checkboxLabel}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Categorías Principales</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {['Materia Prima', 'Repuestos', 'Maquinaria', 'Servicios', 'Suministros', 'Tecnología'].map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.tag, productCategories.includes(cat) && styles.tagSelected]}
                      onPress={() => {
                        if (productCategories.includes(cat)) setProductCategories(prev => prev.filter(c => c !== cat));
                        else setProductCategories(prev => [...prev, cat]);
                      }}
                    >
                      <Text style={[styles.tagText, productCategories.includes(cat) && styles.tagTextSelected]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Descripción Detallada</Text>
                <TextInput
                  style={[styles.directInput, { height: 80, paddingTop: 10 }]}
                  placeholder="Describa sus principales productos y servicios (Ej: Fabricación de piezas de acero inoxidable, corte láser...)"
                  value={commercialDescription}
                  onChangeText={setCommercialDescription}
                  multiline
                  caretHidden={false}
                  selectionColor={theme.colors.primary}
                />
                <Text style={styles.helperText}>Incluya palabras clave para la búsqueda</Text>
              </View>
            </View>
          )}

        </ScrollView>

        <TouchableOpacity style={styles.submitButton} onPress={handleWizardNext}>
          <Text style={styles.submitButtonText}>{providerWizardStep === 5 ? 'Continuar a Credenciales' : 'Siguiente'}</Text>
        </TouchableOpacity>

      </View>
    );
  };

  const renderFormStep = () => (
    <View style={styles.formContainer}>
      <View style={styles.formHeader}>
        <TouchableOpacity onPress={() => setStep('selection')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.formTitle}>
          {isSupplier ? 'Credenciales de Acceso' : 'Permisos de Acceso'}
        </Text>
      </View>

      {/* --- SUPPLIER GENERAL INFO (NEW SIMPLIFIED) --- */}
      {isSupplier && (
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Razón Social</Text>
            <TextInput
              ref={companyNameRef} // REFERENCIA ASIGNADA
              style={[styles.directInput, errors.companyName ? styles.inputError : null]}
              placeholder="Indurama Ecuador S.A."
              value={companyName}
              onChangeText={(t) => { setCompanyName(t); clearFieldError('companyName'); }}
              placeholderTextColor="#999"
              // CONFIGURACIÓN PARA FORZAR EL CURSOR
              autoFocus={true} 
              caretHidden={false}
              selectionColor={theme.colors.primary}
              autoComplete="off" // Evita que la caja de sugerencias tape la barrita al inicio
            />
            {errors.companyName ? <Text style={styles.errorText}>{errors.companyName}</Text> : null}
          </View>

          <View style={styles.nameRow}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.inputLabel}>RUC / ID Fiscal</Text>
              <TextInput
                style={[styles.directInput, errors.taxId ? styles.inputError : null]}
                placeholder="0190..."
                value={taxId}
                onChangeText={(t) => { setTaxId(t); clearFieldError('taxId'); }}
                keyboardType="numeric"
                placeholderTextColor="#999"
                caretHidden={false}
                selectionColor={theme.colors.primary}
              />
              {errors.taxId ? <Text style={styles.errorText}>{errors.taxId}</Text> : null}
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Teléfono</Text>
              <TextInput
                style={[styles.directInput, errors.phone ? styles.inputError : null]}
                placeholder="099..."
                value={phone}
                onChangeText={(t) => { setPhone(t); clearFieldError('phone'); }}
                keyboardType="phone-pad"
                placeholderTextColor="#999"
                caretHidden={false}
                selectionColor={theme.colors.primary}
              />
              {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
            </View>
          </View>
        </>
      )}

      {/* --- PERSONAL FIELDS --- */}
      {!isSupplier && (
        <>
          {loadingData ? (
            <ActivityIndicator style={{ marginVertical: 20 }} color={theme.colors.primary} />
          ) : (
            <>
              <View style={styles.nameRow}>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>Nombre</Text>
                  <TextInput
                    ref={firstNameRef} // REFERENCIA ASIGNADA
                    style={[styles.directInput, errors.firstName ? styles.inputError : null]}
                    placeholder="Nombre"
                    value={firstName}
                    onChangeText={(t) => { setFirstName(t); clearFieldError('firstName'); }}
                    autoCapitalize="words"
                    placeholderTextColor="#999"
                    // CONFIGURACIÓN PARA FORZAR EL CURSOR
                    autoFocus={true} 
                    caretHidden={false}
                    selectionColor={theme.colors.primary}
                    autoComplete="off"
                  />
                  {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
                </View>

                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>Apellido</Text>
                  <TextInput
                    style={[styles.directInput, errors.surname ? styles.inputError : null]}
                    placeholder="Apellido"
                    value={surname}
                    onChangeText={(t) => { setSurname(t); clearFieldError('surname'); }}
                    autoCapitalize="words"
                    placeholderTextColor="#999"
                    caretHidden={false}
                    selectionColor={theme.colors.primary}
                  />
                  {errors.surname ? <Text style={styles.errorText}>{errors.surname}</Text> : null}
                </View>
              </View>

              <Selector
                label="Empresa"
                value={companyIdentifier}
                placeholder="Selecciona tu empresa"
                visible={showCompanyDropdown}
                options={companies.map(c => ({ label: c.name, value: c.name, id: c.id }))}
                onToggle={() => { setShowCompanyDropdown(!showCompanyDropdown); setShowDeptDropdown(false); }}
                onSelect={(val, id) => {
                  setCompanyIdentifier(val);
                  setSelectedCompanyId(id);
                  setDepartment(''); // Reset department
                  setShowCompanyDropdown(false);
                  clearFieldError('companyIdentifier');
                }}
                error={errors.companyIdentifier}
              />

              <Selector
                label="Departamento"
                value={department}
                placeholder={loadingDepts ? "Cargando..." : (companyIdentifier ? "Selecciona tu departamento" : "Primero selecciona tu empresa")}
                visible={showDeptDropdown}
                disabled={!selectedCompanyId || loadingDepts}
                options={departments.map(d => ({ label: d.name, value: d.name, id: d.id }))}
                onToggle={() => { setShowDeptDropdown(!showDeptDropdown); setShowCompanyDropdown(false); }}
                onSelect={(val) => { setDepartment(val); setShowDeptDropdown(false); clearFieldError('department'); }}
                error={errors.department}
              />
            </>
          )}
        </>
      )}

      {/* --- COMMON FIELDS (Con iconos como Login) --- */}
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>Correo Electrónico</Text>
        <View style={[styles.inputWithIcon, errors.email && styles.inputError]}>
          <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
          <TextInput
            style={styles.textInputWithIcon}
            placeholder="ejemplo@correo.com"
            value={email}
            onChangeText={(t) => { setEmail(t); clearFieldError('email'); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#999999"
            // CONFIGURACIÓN EXTRA PARA EMAIL
            caretHidden={false}
            selectionColor={theme.colors.primary}
            autoComplete="email" 
          />
        </View>
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>Contraseña</Text>
        <View style={[styles.inputWithIcon, errors.password && styles.inputError]}>
          <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
          <TextInput
            style={styles.textInputWithIcon}
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChangeText={(t) => { setPassword(t); clearFieldError('password'); }}
            secureTextEntry={true}
            placeholderTextColor="#999999"
            caretHidden={false}
            selectionColor={theme.colors.primary}
          />
        </View>
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
      </View>

      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>Confirmar Contraseña</Text>
        <View style={[styles.inputWithIcon, errors.confirmPassword && styles.inputError]}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
          <TextInput
            style={styles.textInputWithIcon}
            placeholder="Repite tu contraseña"
            value={confirmPassword}
            onChangeText={(t) => { setConfirmPassword(t); clearFieldError('confirmPassword'); }}
            secureTextEntry={true}
            placeholderTextColor="#999999"
            caretHidden={false}
            selectionColor={theme.colors.primary}
          />
        </View>
        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleRegisterButton}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={styles.submitButtonText}>
            {isSupplier ? 'Registrar Empresa' : 'Registrarme'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#f5f5f5" />

      {/* --- MODALS --- */}
      <TermsConditionsScreen
        visible={showTerms}
        mandatory={true}
        onAccept={finalizeRegistration}
        onReject={() => setShowTerms(false)}
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => { }}
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
              onPress={handleCloseModal}
            >
              <Text style={styles.modalButtonText}>
                {modalType === 'success' ? 'Aceptar' : (modalType === 'error' ? 'Reintentar' : 'Entendido')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- MAIN CONTENT --- */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* 3. Wrap del contenido principal en TouchableWithoutFeedback para cerrar al hacer click fuera */}
          <TouchableWithoutFeedback onPress={closeDropdowns}>
            <View style={styles.mainContainer}>
              <View style={styles.headerSection}>
                <Text style={styles.registerTitle}>REGISTRO</Text>
                <Text style={styles.subtitle}>Sistema de Gestión de Proveedores</Text>
              </View>

              {step === 'selection' && renderSelectionStep()}
              {step === 'form' && renderFormStep()}

              {step === 'selection' && (
                <View style={styles.bottomSection}>
                  <View style={styles.brandContainer}>
                    <Image source={require('../../../assets/icono_indurama.png')} style={styles.logoImage} resizeMode="contain" />
                  </View>
                </View>
              )}

            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, minHeight: height, justifyContent: 'center' },
  mainContainer: { flex: 1, paddingHorizontal: theme.spacing[8], paddingVertical: theme.spacing[12], justifyContent: 'center' },
  headerSection: { alignItems: 'center', marginBottom: theme.spacing[8] },
  registerTitle: { fontSize: isMobile ? 36 : 48, fontWeight: '700', color: '#333333', marginBottom: 8, letterSpacing: 1, textAlign: 'center' },
  subtitle: { fontSize: isMobile ? 16 : 18, color: '#666666', lineHeight: 24, textAlign: 'center' },

  // Selection Styles
  selectionContainer: { alignItems: 'center', width: '100%', maxWidth: 600, alignSelf: 'center' },
  selectionTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  selectionSubtitle: { fontSize: 16, color: '#666', marginBottom: 32, textAlign: 'center' },
  cardContainer: { flexDirection: isMobile ? 'column' : 'row', gap: 20, width: '100%', marginBottom: 32 },
  roleCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
    borderWidth: 1, borderColor: '#eee'
  },
  iconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  roleTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  roleDescription: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },

  // Form Styles
  formContainer: { width: '100%', maxWidth: 400, alignSelf: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  formHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backButton: { padding: 8, marginRight: 8 },
  formTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },

  inputContainer: { marginBottom: 16, position: 'relative' },
  inputLabel: { fontSize: 14, color: '#333', fontWeight: '600', marginBottom: 6, marginLeft: 4 },
  directInput: { backgroundColor: '#ffffff', borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: '#e0e0e0', height: isMobile ? 50 : 56, paddingHorizontal: 16, color: '#333', fontSize: 16, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}) },
  inputError: { borderColor: '#e53935' },
  errorText: { color: '#e53935', marginTop: 6, marginLeft: 6, fontSize: 13 },

  // New icon-based input styles (matching Login)
  inputWrapper: { marginBottom: theme.spacing[4] },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    height: isMobile ? 50 : 56, // Standardized Input Height
    paddingHorizontal: theme.spacing[4],
    // No shadows
  },
  inputIcon: { marginRight: 10 },
  textInputWithIcon: {
    flex: 1,
    fontSize: 16, // Standardized Font Size
    color: '#333333',
    height: '100%',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {})
  },

  selectorButton: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#ffffff', borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: '#e0e0e0', height: isMobile ? 50 : 56, paddingHorizontal: 16
  },
  selectorDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
    opacity: 1
  },
  selectorText: { color: '#333', fontSize: 16 },
  placeholderText: { color: '#999' },

  // Desktop Dropdown
  dropdownListDesktop: {
    position: 'absolute',
    top: '100%', left: 0, right: 0, marginTop: 4,
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8,
    // Removed strong shadows, kept minimal border
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    maxHeight: 200,
    overflow: 'hidden'
  },
  dropdownOption: {
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f9f9f9',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  dropdownOptionText: { fontSize: 15, color: '#333' },
  dropdownOptionTextSelected: { fontWeight: 'bold', color: theme.colors.primary },

  nameRow: { flexDirection: 'row', gap: 12 },
  halfWidth: { flex: 1 },

  submitButton: {
    height: isMobile ? 50 : 60,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[4],
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: `0 4px 12px ${theme.colors.primary}30`,
      },
    }),
  },
  submitButtonText: { color: '#ffffff', fontSize: isMobile ? 16 : 18, fontWeight: '600' },

  loginLink: { alignItems: 'center', paddingVertical: 16 },
  loginText: { fontSize: 14, color: '#666' },
  loginLinkBold: { fontWeight: 'bold', color: theme.colors.primary },

  // Bottom Branding
  bottomSection: { alignItems: 'center', justifyContent: 'center', marginTop: 32 },
  brandContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  logoImage: { width: 100, height: 60, opacity: 0.8 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '85%', maxWidth: 320, backgroundColor: 'white', borderRadius: 20, padding: 25, alignItems: 'center', elevation: 10 },
  iconCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 8 },
  modalMessage: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  modalButton: { paddingVertical: 10, paddingHorizontal: 30, borderRadius: 25, minWidth: 120, alignItems: 'center' },
  modalButtonText: { color: 'white', fontWeight: '600', fontSize: 15 },

  // Mobile Picker Styles
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerContainer: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%' },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  pickerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  pickerItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerItemText: { fontSize: 16, color: '#333' },
  pickerItemTextSelected: { color: theme.colors.primary, fontWeight: 'bold' },

  // Service Focus Styles
  focusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center', maxWidth: 600, width: '100%' },
  focusCard: {
    width: isMobile ? '45%' : 180,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#eee',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  focusCardSelected: { borderColor: theme.colors.primary, backgroundColor: '#F0F7FF' },
  focusIconCircle: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#E3F2FD',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12
  },
  focusIconCircleSelected: { backgroundColor: theme.colors.primary },
  focusLabel: { fontSize: 14, fontWeight: '600', color: '#555', textAlign: 'center' },
  focusLabelSelected: { color: theme.colors.primary, fontWeight: 'bold' },

  backLink: { marginTop: 24, padding: 10 },
  backLinkText: { color: '#666', fontSize: 16, textDecorationLine: 'underline' },

  // Wizard Styles
  wizardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  wizardStepIndicator: { fontSize: 14, color: theme.colors.primary, fontWeight: '600' },
  progressBarBg: { height: 6, backgroundColor: '#eee', borderRadius: 3, marginBottom: 24, width: '100%' },
  progressBarFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 3 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  sectionSubtitle: { fontSize: 14, color: '#666', marginBottom: 16 },

  helperText: { fontSize: 12, color: '#999', marginTop: 4, fontStyle: 'italic' },
  readOnly: { backgroundColor: '#f0f0f0', color: '#666' },

  radioRow: { flexDirection: 'row', gap: 12 },
  radioButton: {
    flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    alignItems: 'center', backgroundColor: '#fafafa'
  },
  radioButtonSelected: { borderColor: theme.colors.primary, backgroundColor: '#E3F2FD' },
  radioText: { color: '#666', fontWeight: '500' },
  radioTextSelected: { color: theme.colors.primary, fontWeight: 'bold' },

  tag: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#eee' },
  tagSelected: { backgroundColor: '#E3F2FD', borderColor: theme.colors.primary },
  tagText: { fontSize: 13, color: '#666' },
  tagTextSelected: { color: theme.colors.primary, fontWeight: 'bold' },

  // Checkbox Styles
  checkboxRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#ccc', marginRight: 10,
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff'
  },
  checkboxChecked: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
  checkboxLabel: { fontSize: 14, color: '#333' },
});