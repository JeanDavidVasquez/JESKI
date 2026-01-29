import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Dimensions,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import {
  loadSupplierEpiData,
  saveAllSupplierEpiData
} from '../../services/supplierDataService';
import { pickDocument, uploadSupplierEvidence } from '../../services/imagePickerService';

import { User } from '../../types';
import {
  SupplierGeneralData,
  SupplierOperationsData,
  SupplierSystemsData,
  SupplierQuestionnaireData,
  SupplierChecklistData
} from '../../types/supplierEpi';

const { width } = Dimensions.get('window');
const isMobile = width < 768;
const MAX_WIDTH = 1000; // Wider layout for EPI form

// Tipos para las pestañas (5 Pasos)
type TabType = 'General' | 'Operaciones' | 'Sistemas' | 'Cuestionario' | 'Checklist';

// Props
interface SupplierCreationScreenProps {
  onNavigateBack?: () => void;
  onComplete?: () => void;
  user?: User | null;
}

export const SupplierCreationScreen: React.FC<SupplierCreationScreenProps> = ({
  onNavigateBack,
  onComplete,
  user: userProp
}) => {
  const { user: contextUser } = useAuth();
  const user = userProp || contextUser;

  const [activeTab, setActiveTab] = useState<TabType>('General');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // --- STATE DEFINITIONS ---

  const [generalData, setGeneralData] = useState<SupplierGeneralData>({
    companyName: '', ruc: '', address: '', city: '', country: '', postalCode: '',
    phone: '', website: '', legalRepresentative: '', legalForm: '',
    supplierType: '', rucType: '', marketTime: '', sapBilling: 'Por Indurama',
    contactPersonName: '', contactPersonPhone: '', evaluationDate: new Date().toISOString(),
    // SAP Fields
    bpType: '', groupingType: '', treatment: '', lastName: '', nationality: '',
    maritalStatus: '', taxCategory: '', language: '', searchTerm: '',
    street: '', street2: '', street3: '', houseNumber: '', district: '', region: '',
    email: '', mobilePhone: '', centralPhone: ''
  });

  const [operationsData, setOperationsData] = useState<SupplierOperationsData>({
    mainFocus: '', mainRawMaterials: '', productsOrServices: '',
    mainClients: [{ name: '', share: '' }, { name: '', share: '' }],
    clientShare: '', inventoryDays: '', mainSuppliers: '', salesExpectation: '',
    sales2023: '', sales2024: '', sales2025: '',
    employeesCount: '', shifts: '', factoryArea: '', certifications: '',
    productTags: [],
    // SAP Fields
    serviceFocus: '', deliveryTime: '', commercialDescription: '', businessType: []
  });

  const [systemsData, setSystemsData] = useState<SupplierSystemsData>({
    has5S: false, hasIndustrialSafety: false, hasQualitySystem: false,
    generalManager: { name: '', email: '', phone: '' },
    commercial: { name: '', email: '', phone: '' },
    quality: { name: '', email: '', phone: '' },
    technical: { name: '', email: '', phone: '' },
    production: { name: '', email: '', phone: '' },
    // SAP Fields - Banking
    taxIdType: '', taxId: '', bankName: '', bankKey: '', accountNumber: '',
    accountType: '', iban: '', bankCertificate: '',
    // SAP Fields - Society (optional, pre-filled defaults)
    society: 'INDURAMA ECUADOR', paymentCondition: '', paymentMethods: [],
    withholdingType: '', purchasingOrg: '', purchasingGroup: ''
  });

  // Default all boolean questions to false
  const [questionnaireData, setQuestionnaireData] = useState<SupplierQuestionnaireData>({
    signContract: false, firstContactName: '', relationshipStartDate: '', clientReference: false,
    shareFinancial: false, writtenContracts: false, hseProcedures: false, governmentCompliance: false,
    replenishmentTime: '', reworkInIndurama: false, creditConditions: false, claimsProcess: false,
    codeOfConduct: false, iso50001: false, sriCompliance: false, iessCompliance: false,
    billingSystem: false, quoteResponseTime: '', warranty: false, productsOffered: ''
  });

  // Default checklist items
  const createChecklistItem = (id: string, label: string, required: boolean = true) => ({
    id, label, required, checked: false
  });

  const [checklistData, setChecklistData] = useState<SupplierChecklistData>({
    financialStatus: createChecklistItem('financial', 'Situación Financiera (último año)'),
    employeeContract: createChecklistItem('contract', 'Copia de Contrato firmado de un empleado'),
    companies: createChecklistItem('companies', 'Compañías (Constitución/Nombramiento)'),
    municipalCompliance: createChecklistItem('municipal', 'Certificado al día Organismos Municipales'),
    codeOfConduct: createChecklistItem('codeOfConduct', 'Copia de Código de Conducta'),
    sriCompliance: createChecklistItem('sri', 'Certificado cumplimiento tributario SRI'),
    evaluationForm: createChecklistItem('evalForm', 'Formulario de Evaluación'),
    rucUpdate: createChecklistItem('ruc', 'RUC Actualizado'),
    idCopy: createChecklistItem('idCopy', 'Copia de Cédula Rep. Legal'),
    appointment: createChecklistItem('appointment', 'Nombramiento Rep. Legal'),
    managementSystem: createChecklistItem('management', 'Procedimiento Sistemas de Gestión'),
    clientCertificate: createChecklistItem('clientCert', 'Certificado comercial de clientes'),
    taxDeclaration: createChecklistItem('tax', 'Declaración Impuesto a la Renta'),
    iessCertificate: createChecklistItem('iess', 'Certificado IESS al día'),
    excelList: createChecklistItem('excel', 'Listado en Excel de productos'),
    productCatalog: createChecklistItem('catalog', 'Catálogo de productos')
  });

  // --- LOADING DATA ---

  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        console.log('🔄 Loading Supplier EPI Data...');

        const data = await loadSupplierEpiData(user.id);

        if (data.general) {
          setGeneralData(prev => {
            const updated = { ...prev, ...data.general };
            // Pre-populate company name and phone from User Profile if missing
            if (!updated.companyName && user?.firstName) {
              updated.companyName = user.firstName;
            }
            if (!updated.contactPersonPhone && user?.phone) {
              updated.contactPersonPhone = user.phone;
            }
            return updated;
          });
        } else {
          // Case where general data is empty but we have user profile data
          if (user?.firstName || user?.phone) {
            setGeneralData(prev => ({
              ...prev,
              companyName: user?.firstName || prev.companyName,
              contactPersonPhone: user?.phone || prev.contactPersonPhone
            }));
          }
        }
        if (data.operations) setOperationsData(prev => ({ ...prev, ...data.operations }));
        if (data.systems) setSystemsData(prev => ({ ...prev, ...data.systems }));
        if (data.questionnaire) setQuestionnaireData(prev => ({ ...prev, ...data.questionnaire }));
        if (data.checklist) {
          // Merge checklist carefully to preserve labels/structure
          setChecklistData(prev => {
            const newData = { ...prev };
            Object.keys(data.checklist || {}).forEach(key => {
              if (newData[key as keyof SupplierChecklistData]) {
                const newDataPoint = (data.checklist as any)[key];
                // Only update checked/fileUrl, minimize overwriting text labels
                // But TypeScript might complain, so let's just spread safely
                newData[key as keyof SupplierChecklistData] = {
                  ...newData[key as keyof SupplierChecklistData],
                  ...newDataPoint
                };
              }
            });
            return newData;
          });
        }

      } catch (error) {
        console.error('Error loading supplier data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, [user]);

  const saveProgress = async (silent?: boolean): Promise<boolean> => {
    if (!user?.id) return false;
    try {
      setSaving(true);
      await saveAllSupplierEpiData(user.id, {
        general: generalData,
        operations: operationsData,
        systems: systemsData,
        questionnaire: questionnaireData,
        checklist: checklistData
      });
      console.log('✅ Progress Saved');
      if (!silent) {
        Alert.alert('Guardado', 'Su progreso se ha guardado correctamente.');
      }
      return true;
    } catch (error) {
      console.error('Error saving progress:', error);
      Alert.alert('Error', 'No se pudo guardar el progreso.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // State for new tag input
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    const currentTags = operationsData.productTags || [];
    if (!currentTags.includes(newTag.trim())) {
      setOperationsData(prev => ({
        ...prev,
        productTags: [...currentTags, newTag.trim()]
      }));
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setOperationsData(prev => ({
      ...prev,
      productTags: (prev.productTags || []).filter(tag => tag !== tagToRemove)
    }));
  };

  const handleGoBack = () => {
    if (onNavigateBack) onNavigateBack();
  };

  const handleNext = async () => {
    console.log('🔵 handleNext called, activeTab:', activeTab);

    // Silent save on last step to avoid conflict with Completion alert
    const isLastStep = activeTab === 'Checklist';
    console.log('🔵 isLastStep:', isLastStep);

    const saveSuccessful = await saveProgress(isLastStep);
    console.log('🔵 saveSuccessful:', saveSuccessful);

    // If save failed, don't proceed
    if (!saveSuccessful) {
      console.log('❌ Save failed, returning');
      return;
    }

    if (activeTab === 'General') {
      setActiveTab('Operaciones');
    } else if (activeTab === 'Operaciones') {
      setActiveTab('Sistemas');
    } else if (activeTab === 'Sistemas') {
      setActiveTab('Cuestionario');
    } else if (activeTab === 'Cuestionario') {
      setActiveTab('Checklist');
    } else if (activeTab === 'Checklist') {
      console.log('✅ Showing completion alert!');
      // Last tab completed - show modal instead of Alert
      setShowCompletionModal(true);
    } else {
      console.log('⚠️ No matching tab condition!');
    }
  };

  // --- UI RENDER HELPERS ---

  const tabs: { key: TabType; label: string; icon: keyof typeof Ionicons.glyphMap; step: number }[] = [
    { key: 'General', label: 'Datos Generales', icon: 'business-outline', step: 1 },
    { key: 'Operaciones', label: 'Operaciones', icon: 'stats-chart-outline', step: 2 },
    { key: 'Sistemas', label: 'Sistemas', icon: 'construct-outline', step: 3 },
    { key: 'Cuestionario', label: 'Cuestionario', icon: 'list-circle-outline', step: 4 },
    { key: 'Checklist', label: 'Documentos', icon: 'folder-open-outline', step: 5 },
  ];

  const getTabStatus = (tab: TabType): 'completed' | 'current' | 'pending' => {
    const tabOrder: TabType[] = ['General', 'Operaciones', 'Sistemas', 'Cuestionario', 'Checklist'];
    const currentIndex = tabOrder.indexOf(activeTab);
    const tabIndex = tabOrder.indexOf(tab);

    if (tabIndex < currentIndex) return 'completed';
    if (tabIndex === currentIndex) return 'current';
    return 'pending';
  };

  const renderTabButton = (tab: TabType, label: string, icon: keyof typeof Ionicons.glyphMap, step: number) => {
    const status = getTabStatus(tab);
    const isActive = activeTab === tab;
    const isCompleted = status === 'completed';

    return (
      <TouchableOpacity
        key={tab}
        style={[styles.tabButton, isActive && styles.tabButtonActive]}
        onPress={() => setActiveTab(tab)}
      >
        <Ionicons
          name={icon}
          size={24}
          color={isActive ? '#003E85' : isCompleted ? '#16A34A' : '#94A3B8'}
        />
        <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
          {label}
        </Text>
        {isCompleted && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderGeneralTab = () => (
    <View style={styles.formCard}>
      <Text style={styles.sectionTitle}>Datos Generales del Proveedor</Text>

      {/* SAP SECTION: Identificación y Datos Maestros */}
      <Text style={[styles.sectionTitle, { marginTop: 16, fontSize: 16, color: '#003E85' }]}>Identificación SAP</Text>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Tipo de BP</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Persona / Organización"
            value={generalData.bpType}
            onChangeText={(v) => setGeneralData(p => ({ ...p, bpType: v as any }))}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Tipo de Agrupador</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Nacional, Exterior, etc."
            value={generalData.groupingType}
            onChangeText={(v) => setGeneralData(p => ({ ...p, groupingType: v }))}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Tratamiento</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Sra., Sr., Empresa, Sres."
            value={generalData.treatment}
            onChangeText={(v) => setGeneralData(p => ({ ...p, treatment: v }))}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Idioma</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Español / Inglés"
            value={generalData.language}
            onChangeText={(v) => setGeneralData(p => ({ ...p, language: v as any }))}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Razón Social</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Indurama Ecuador S.A."
            value={generalData.companyName}
            onChangeText={(v) => setGeneralData(p => ({ ...p, companyName: v }))}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Apellidos (Persona Natural)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Solo si BP = Persona"
            value={generalData.lastName}
            onChangeText={(v) => setGeneralData(p => ({ ...p, lastName: v }))}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>RUC / ID Fiscal</Text>
          <TextInput
            style={styles.textInput}
            placeholder="0190..."
            value={generalData.ruc}
            onChangeText={(v) => setGeneralData(p => ({ ...p, ruc: v }))}
            keyboardType="numeric"
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Concepto de Búsqueda</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Término SAP"
            value={generalData.searchTerm}
            onChangeText={(v) => setGeneralData(p => ({ ...p, searchTerm: v }))}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Nacionalidad</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ecuador, Colombia, etc."
            value={generalData.nationality}
            onChangeText={(v) => setGeneralData(p => ({ ...p, nationality: v }))}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Estado Civil (Persona)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Soltero, Casado, etc."
            value={generalData.maritalStatus}
            onChangeText={(v) => setGeneralData(p => ({ ...p, maritalStatus: v }))}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Forma Jurídica</Text>
          <TextInput
            style={styles.textInput}
            placeholder="S.A., Cía. Ltda., Natural"
            value={generalData.legalForm}
            onChangeText={(v) => setGeneralData(p => ({ ...p, legalForm: v }))}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Categoría Tributaria</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Contribuyente Especial, etc."
            value={generalData.taxCategory}
            onChangeText={(v) => setGeneralData(p => ({ ...p, taxCategory: v }))}
          />
        </View>
      </View>

      {/* SAP SECTION: Ubicación Desglosada */}
      <Text style={[styles.sectionTitle, { marginTop: 20, fontSize: 16, color: '#003E85' }]}>Ubicación Completa</Text>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>País</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ecuador"
            value={generalData.country}
            onChangeText={(v) => setGeneralData(p => ({ ...p, country: v }))}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Región / Provincia</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Azuay, Pichincha, etc."
            value={generalData.region}
            onChangeText={(v) => setGeneralData(p => ({ ...p, region: v }))}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Ciudad</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Cuenca, Quito, etc."
            value={generalData.city}
            onChangeText={(v) => setGeneralData(p => ({ ...p, city: v }))}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Distrito / Población</Text>
          <TextInput
            style={styles.textInput}
            value={generalData.district}
            onChangeText={(v) => setGeneralData(p => ({ ...p, district: v }))}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Calle Principal</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Av. 10 de Agosto"
          value={generalData.street}
          onChangeText={(v) => setGeneralData(p => ({ ...p, street: v }))}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Calle 2</Text>
          <TextInput
            style={styles.textInput}
            value={generalData.street2}
            onChangeText={(v) => setGeneralData(p => ({ ...p, street2: v }))}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Calle 3</Text>
          <TextInput
            style={styles.textInput}
            value={generalData.street3}
            onChangeText={(v) => setGeneralData(p => ({ ...p, street3: v }))}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Número de Casa</Text>
          <TextInput
            style={styles.textInput}
            placeholder="123-A"
            value={generalData.houseNumber}
            onChangeText={(v) => setGeneralData(p => ({ ...p, houseNumber: v }))}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Código Postal</Text>
          <TextInput
            style={styles.textInput}
            value={generalData.postalCode}
            onChangeText={(v) => setGeneralData(p => ({ ...p, postalCode: v }))}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* SAP SECTION: Contacto */}
      <Text style={[styles.sectionTitle, { marginTop: 20, fontSize: 16, color: '#003E85' }]}>Información de Contacto</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email de Facturación</Text>
        <TextInput
          style={styles.textInput}
          placeholder="facturacion@empresa.com"
          value={generalData.email}
          onChangeText={(v) => setGeneralData(p => ({ ...p, email: v }))}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Teléfono Fijo</Text>
          <TextInput
            style={styles.textInput}
            placeholder="07-1234567"
            value={generalData.centralPhone}
            onChangeText={(v) => setGeneralData(p => ({ ...p, centralPhone: v }))}
            keyboardType="phone-pad"
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Teléfono Celular</Text>
          <TextInput
            style={styles.textInput}
            placeholder="0987654321"
            value={generalData.mobilePhone}
            onChangeText={(v) => setGeneralData(p => ({ ...p, mobilePhone: v }))}
            keyboardType="phone-pad"
          />
        </View>
      </View>

      {/* === ORIGINAL FIELDS (Keeping for backward compatibility) === */}
      <Text style={[styles.sectionTitle, { marginTop: 20, fontSize: 16 }]}>Datos Adicionales</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Nombre Representante Legal</Text>
        <TextInput
          style={styles.textInput}
          value={generalData.legalRepresentative}
          onChangeText={(v) => setGeneralData(p => ({ ...p, legalRepresentative: v }))}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Tipo de Proveedor</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Fabricante/Distribuidor/Servicio"
            value={generalData.supplierType}
            onChangeText={(v) => setGeneralData(p => ({ ...p, supplierType: v as any }))}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Tiempo en Mercado (años)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ej: 5"
            value={generalData.marketTime}
            onChangeText={(v) => setGeneralData(p => ({ ...p, marketTime: v }))}
            keyboardType="numeric"
          />
        </View>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 16, fontSize: 16 }]}>Contacto para EPI</Text>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Nombre quien llena EPI</Text>
          <TextInput
            style={styles.textInput}
            value={generalData.contactPersonName}
            onChangeText={(v) => setGeneralData(p => ({ ...p, contactPersonName: v }))}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Teléfono Contacto</Text>
          <TextInput
            style={styles.textInput}
            value={generalData.contactPersonPhone}
            onChangeText={(v) => setGeneralData(p => ({ ...p, contactPersonPhone: v }))}
            keyboardType="phone-pad"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Sitio Web</Text>
        <TextInput
          style={styles.textInput}
          value={generalData.website}
          onChangeText={(v) => setGeneralData(p => ({ ...p, website: v }))}
          autoCapitalize="none"
        />
      </View>
    </View>
  );

  const renderOperationsTab = () => {
    // Service Focus Options
    const focusOptions: Array<'Servicio Reparación' | 'Servicios de Construcción' | 'Servicio de Asesoramiento' | 'Venta de Repuestos' | 'Suministros / Materia Prima'> = [
      'Servicio Reparación',
      'Servicios de Construcción',
      'Servicio de Asesoramiento',
      'Venta de Repuestos',
      'Suministros / Materia Prima'
    ];

    return (
      <View style={styles.formCard}>
        {/* SAP: ENFOQUE DE SERVICIO (Chip Selector) */}
        <Text style={[styles.sectionTitle, { color: '#003E85' }]}>Enfoque de Servicio Principal</Text>
        <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
          Seleccione la opción que mejor describe su actividad principal:
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          {focusOptions.map(opt => {
            const isSelected = operationsData.serviceFocus === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  backgroundColor: isSelected ? '#003E85' : '#F3F4F6',
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: isSelected ? '#003E85' : '#D1D5DB',
                  shadowColor: isSelected ? '#003E85' : '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: isSelected ? 0.2 : 0.05,
                  shadowRadius: 2,
                  elevation: isSelected ? 2 : 0
                }}
                onPress={() => setOperationsData(p => ({ ...p, serviceFocus: opt as any }))}
              >
                <Text style={{
                  color: isSelected ? '#FFFFFF' : '#4B5563',
                  fontSize: 13,
                  fontWeight: isSelected ? '600' : '500'
                }}>
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Indicator */}
        {operationsData.serviceFocus && (
          <View style={{
            backgroundColor: '#DBEAFE',
            padding: 10,
            borderRadius: 8,
            borderLeftWidth: 4,
            borderLeftColor: '#003E85',
            marginBottom: 20
          }}>
            <Text style={{ fontSize: 12, color: '#1E40AF', fontWeight: '600' }}>
              ✓ Seleccionado: <Text style={{ fontWeight: '700' }}>{operationsData.serviceFocus}</Text>
            </Text>
          </View>
        )}

        {/* SAP: ACTIVIDAD COMERCIAL */}
        <Text style={[styles.sectionTitle, { marginTop: 16, fontSize: 16, color: '#003E85' }]}>Actividad Comercial</Text>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.inputLabel}>Plazo de Entrega (Días)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ej: 7, 15, 30 días"
              placeholderTextColor="#9CA3AF"
              value={operationsData.deliveryTime}
              onChangeText={(v) => setOperationsData(p => ({ ...p, deliveryTime: v }))}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.inputLabel}>Tipos de Negocio</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Fabricación, Distribución..."
              placeholderTextColor="#9CA3AF"
              value={operationsData.businessType?.join(', ')}
              onChangeText={(v) => setOperationsData(p => ({ ...p, businessType: v.split(',').map(s => s.trim()) }))}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Descripción Comercial Completa</Text>
          <TextInput
            style={[styles.textInput, { height: 70 }]}
            placeholder="Describa la actividad y capacidad comercial de su empresa..."
            placeholderTextColor="#9CA3AF"
            value={operationsData.commercialDescription}
            onChangeText={(v) => setOperationsData(p => ({ ...p, commercialDescription: v }))}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* === ORIGINAL FIELDS === */}
        <Text style={[styles.sectionTitle, { marginTop: 20, fontSize: 15 }]}>Operaciones y Ventas</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Principal rubro de enfoque</Text>
          <TextInput
            style={styles.textInput}
            value={operationsData.mainFocus}
            onChangeText={(v) => setOperationsData(p => ({ ...p, mainFocus: v }))}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Principales Materias Primas</Text>
          <TextInput
            style={styles.textInput}
            value={operationsData.mainRawMaterials}
            multiline
            onChangeText={(v) => setOperationsData(p => ({ ...p, mainRawMaterials: v }))}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Productos que fabrica o comercializa</Text>
          <TextInput
            style={[styles.textInput, { height: 60 }]}
            value={operationsData.productsOrServices}
            multiline
            onChangeText={(v) => setOperationsData(p => ({ ...p, productsOrServices: v }))}
          />
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 16, fontSize: 16 }]}>Principales Clientes</Text>
        {operationsData.mainClients.map((client, index) => (
          <View key={index} style={styles.row}>
            <View style={[styles.inputGroup, { flex: 2, marginRight: 8 }]}>
              <TextInput
                style={styles.textInput}
                placeholder={`Cliente ${index + 1}`}
                value={client.name}
                onChangeText={(v) => {
                  const newClients = [...operationsData.mainClients];
                  newClients[index].name = v;
                  setOperationsData(p => ({ ...p, mainClients: newClients }));
                }}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <TextInput
                style={styles.textInput}
                placeholder="% Part."
                value={client.share}
                onChangeText={(v) => {
                  const newClients = [...operationsData.mainClients];
                  newClients[index].share = v;
                  setOperationsData(p => ({ ...p, mainClients: newClients }));
                }}
              />
            </View>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 16, fontSize: 16 }]}>Ventas Totales Anuales (USD)</Text>
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 4 }]}>
            <Text style={styles.miniLabel}>2023</Text>
            <TextInput
              style={styles.textInput}
              value={operationsData.sales2023}
              onChangeText={(v) => setOperationsData(p => ({ ...p, sales2023: v }))}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginHorizontal: 4 }]}>
            <Text style={styles.miniLabel}>2024</Text>
            <TextInput
              style={styles.textInput}
              value={operationsData.sales2024}
              onChangeText={(v) => setOperationsData(p => ({ ...p, sales2024: v }))}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 4 }]}>
            <Text style={styles.miniLabel}>2025 (Est.)</Text>
            <TextInput
              style={styles.textInput}
              value={operationsData.sales2025}
              onChangeText={(v) => setOperationsData(p => ({ ...p, sales2025: v }))}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.inputLabel}>Cantidad Empleados</Text>
            <TextInput
              style={styles.textInput}
              value={operationsData.employeesCount}
              onChangeText={(v) => setOperationsData(p => ({ ...p, employeesCount: v }))}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.inputLabel}>Área Fábrica (m²)</Text>
            <TextInput
              style={styles.textInput}
              value={operationsData.factoryArea}
              onChangeText={(v) => setOperationsData(p => ({ ...p, factoryArea: v }))}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Certificaciones (ISO, BASC, etc)</Text>
          <TextInput
            style={styles.textInput}
            value={operationsData.certifications}
            onChangeText={(v) => setOperationsData(p => ({ ...p, certifications: v }))}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Etiquetas de Productos (Para Búsqueda)</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            <TextInput
              style={[styles.textInput, { flex: 1 }]}
              placeholder="Ej: Electrodomésticos, Muebles..."
              value={newTag}
              onChangeText={setNewTag}
              onSubmitEditing={handleAddTag}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddTag}>
              <Text style={styles.addButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {operationsData.productTags?.map((tag, index) => (
              <TouchableOpacity
                key={index}
                style={styles.tagChip}
                onPress={() => handleRemoveTag(tag)}
              >
                <Text style={styles.tagText}>{tag}</Text>
                <Ionicons name="close-circle" size={16} color="#003E85" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderSystemsTab = () => (
    <View style={styles.formCard}>
      <Text style={styles.sectionTitle}>Sistemas de Gestión</Text>
      <Text style={styles.helperText}>Marque lo que tenga implementado:</Text>

      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setSystemsData(p => ({ ...p, has5S: !p.has5S }))}
      >
        <Ionicons name={systemsData.has5S ? "checkbox" : "square-outline"} size={24} color="#003E85" />
        <Text style={styles.checkboxLabel}>¿Tiene implementado 5'S?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setSystemsData(p => ({ ...p, hasIndustrialSafety: !p.hasIndustrialSafety }))}
      >
        <Ionicons name={systemsData.hasIndustrialSafety ? "checkbox" : "square-outline"} size={24} color="#003E85" />
        <Text style={styles.checkboxLabel}>¿Tiene Seguridad Industrial?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setSystemsData(p => ({ ...p, hasQualitySystem: !p.hasQualitySystem }))}
      >
        <Ionicons name={systemsData.hasQualitySystem ? "checkbox" : "square-outline"} size={24} color="#003E85" />
        <Text style={styles.checkboxLabel}>¿Tiene Sistema de Calidad?</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Matriz de Contactos</Text>

      {/* Gerente */}
      <View style={styles.contactBlock}>
        <Text style={styles.contactRole}>Gerente General</Text>
        <TextInput
          style={[styles.textInput, { marginBottom: 6 }]} placeholder="Nombre"
          value={systemsData.generalManager.name}
          onChangeText={v => setSystemsData(p => ({ ...p, generalManager: { ...p.generalManager, name: v } }))}
        />
        <TextInput
          style={styles.textInput} placeholder="Email" keyboardType="email-address"
          value={systemsData.generalManager.email}
          onChangeText={v => setSystemsData(p => ({ ...p, generalManager: { ...p.generalManager, email: v } }))}
        />
      </View>

      {/* Comercial */}
      <View style={styles.contactBlock}>
        <Text style={styles.contactRole}>Comercial</Text>
        <TextInput
          style={[styles.textInput, { marginBottom: 6 }]} placeholder="Nombre"
          value={systemsData.commercial.name}
          onChangeText={v => setSystemsData(p => ({ ...p, commercial: { ...p.commercial, name: v } }))}
        />
        <TextInput
          style={styles.textInput} placeholder="Email" keyboardType="email-address"
          value={systemsData.commercial.email}
          onChangeText={v => setSystemsData(p => ({ ...p, commercial: { ...p.commercial, email: v } }))}
        />
      </View>

      {/* Calidad */}
      <View style={styles.contactBlock}>
        <Text style={styles.contactRole}>Calidad</Text>
        <TextInput
          style={[styles.textInput, { marginBottom: 6 }]} placeholder="Nombre"
          value={systemsData.quality.name}
          onChangeText={v => setSystemsData(p => ({ ...p, quality: { ...p.quality, name: v } }))}
        />
        <TextInput
          style={styles.textInput} placeholder="Email" keyboardType="email-address"
          value={systemsData.quality.email}
          onChangeText={v => setSystemsData(p => ({ ...p, quality: { ...p.quality, email: v } }))}
        />
      </View>

      {/* Técnico */}
      <View style={styles.contactBlock}>
        <Text style={styles.contactRole}>Técnico</Text>
        <TextInput
          style={[styles.textInput, { marginBottom: 6 }]} placeholder="Nombre"
          value={systemsData.technical.name}
          onChangeText={v => setSystemsData(p => ({ ...p, technical: { ...p.technical, name: v } }))}
        />
        <TextInput
          style={styles.textInput} placeholder="Email" keyboardType="email-address"
          value={systemsData.technical.email}
          onChangeText={v => setSystemsData(p => ({ ...p, technical: { ...p.technical, email: v } }))}
        />
      </View>

      {/* Producción */}
      <View style={styles.contactBlock}>
        <Text style={styles.contactRole}>Producción</Text>
        <TextInput
          style={[styles.textInput, { marginBottom: 6 }]} placeholder="Nombre"
          value={systemsData.production.name}
          onChangeText={v => setSystemsData(p => ({ ...p, production: { ...p.production, name: v } }))}
        />
        <TextInput
          style={styles.textInput} placeholder="Email" keyboardType="email-address"
          value={systemsData.production.email}
          onChangeText={v => setSystemsData(p => ({ ...p, production: { ...p.production, email: v } }))}
        />
      </View>

      {/* SAP SECTION: Información Bancaria */}
      <Text style={[styles.sectionTitle, { marginTop: 24, fontSize: 16, color: '#003E85' }]}>Información Bancaria y Fiscal</Text>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Tipo ID Fiscal</Text>
          <TextInput
            style={styles.textInput}
            placeholder="RUC, Cédula, Pasaporte"
            value={systemsData.taxIdType}
            onChangeText={v => setSystemsData(p => ({ ...p, taxIdType: v }))}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Número ID Fiscal</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Auto-completado de Datos Generales"
            value={systemsData.taxId || generalData.ruc}
            onChangeText={v => setSystemsData(p => ({ ...p, taxId: v }))}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Banco</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Pichincha, Guayaquil, Produbanco, etc."
            value={systemsData.bankName}
            onChangeText={v => setSystemsData(p => ({ ...p, bankName: v }))}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Clave de Banco</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Código swift/identificador"
            value={systemsData.bankKey}
            onChangeText={v => setSystemsData(p => ({ ...p, bankKey: v }))}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Número de Cuenta Bancaria</Text>
          <TextInput
            style={styles.textInput}
            value={systemsData.accountNumber}
            onChangeText={v => setSystemsData(p => ({ ...p, accountNumber: v }))}
            keyboardType="numeric"
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Tipo de Cuenta</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ahorros / Corriente"
            value={systemsData.accountType}
            onChangeText={v => setSystemsData(p => ({ ...p, accountType: v as any }))}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>IBAN (para transferencias internacionales)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="EC..."
          value={systemsData.iban}
          onChangeText={v => setSystemsData(p => ({ ...p, iban: v }))}
          autoCapitalize="characters"
        />
      </View>

      {/* SAP SECTION: Datos de Sociedad (Optional/Read-Only for Provider) */}
      <Text style={[styles.sectionTitle, { marginTop: 24, fontSize: 16, color: '#666' }]}>Datos de Sociedad y Compras (Opcional)</Text>
      <Text style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12, fontStyle: 'italic' }}>
        Estos campos normalmente los completa el Gestor, pero puede dejar sus preferencias aquí.
      </Text>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Sociedad Asignada</Text>
          <TextInput
            style={styles.textInput}
            placeholder="INDURAMA ECUADOR (por defecto)"
            value={systemsData.society}
            onChangeText={v => setSystemsData(p => ({ ...p, society: v }))}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Condición de Pago</Text>
          <TextInput
            style={styles.textInput}
            placeholder="30 días, 60 días, etc."
            value={systemsData.paymentCondition}
            onChangeText={v => setSystemsData(p => ({ ...p, paymentCondition: v }))}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Vías de Pago Aceptadas</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Transferencia, Cheque, Depósito, etc."
          value={systemsData.paymentMethods?.join(', ')}
          onChangeText={v => setSystemsData(p => ({ ...p, paymentMethods: v.split(',').map(s => s.trim()) }))}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>Tipo de Retención</Text>
          <TextInput
            style={styles.textInput}
            placeholder="IVA, Renta, etc."
            value={systemsData.withholdingType}
            onChangeText={v => setSystemsData(p => ({ ...p, withholdingType: v }))}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Organización de Compras</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Org Compras Central"
            value={systemsData.purchasingOrg}
            onChangeText={v => setSystemsData(p => ({ ...p, purchasingOrg: v }))}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Grupo de Compras</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Nacional, Importado, Servicios, etc."
          value={systemsData.purchasingGroup}
          onChangeText={v => setSystemsData(p => ({ ...p, purchasingGroup: v }))}
        />
      </View>

    </View>
  );

  const renderQuestionnaireTab = () => {
    // Helper for Yes/No Question
    const QuestionRow = ({
      label,
      value,
      onChange
    }: { label: string, value: boolean, onChange: (v: boolean) => void }) => (
      <View style={styles.questionRow}>
        <Text style={styles.questionText}>{label}</Text>
        <View style={styles.switchContainer}>
          <TouchableOpacity
            style={[styles.switchOption, value === true && styles.switchActive]}
            onPress={() => onChange(true)}
          >
            <Text style={[styles.switchText, value === true && styles.switchTextActive]}>SÍ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.switchOption, value === false && styles.switchActive]}
            onPress={() => onChange(false)}
          >
            <Text style={[styles.switchText, value === false && styles.switchTextActive]}>NO</Text>
          </TouchableOpacity>
        </View>
      </View>
    );

    return (
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Cuestionario de Evaluación</Text>
        <Text style={styles.helperText}>Seleccione con una X (Si/No):</Text>

        <QuestionRow
          label="¿Disposición a firmar contrato?"
          value={questionnaireData.signContract}
          onChange={v => setQuestionnaireData(p => ({ ...p, signContract: v }))}
        />
        <QuestionRow
          label="¿Está dispuesto a compartir su situación Financiera?"
          value={questionnaireData.shareFinancial}
          onChange={v => setQuestionnaireData(p => ({ ...p, shareFinancial: v }))}
        />
        <QuestionRow
          label="¿Tiene contratos de empleados por escrito y firmados?"
          value={questionnaireData.writtenContracts}
          onChange={v => setQuestionnaireData(p => ({ ...p, writtenContracts: v }))}
        />
        <QuestionRow
          label="¿Tiene procedimientos de Salud y Seguridad Ocupacional?"
          value={questionnaireData.hseProcedures}
          onChange={v => setQuestionnaireData(p => ({ ...p, hseProcedures: v }))}
        />
        <QuestionRow
          label="¿Está al día con Organismos Municipales?"
          value={questionnaireData.governmentCompliance}
          onChange={v => setQuestionnaireData(p => ({ ...p, governmentCompliance: v }))}
        />
        <QuestionRow
          label="¿Acepta reproceso en instalaciones de Indurama?"
          value={questionnaireData.reworkInIndurama}
          onChange={v => setQuestionnaireData(p => ({ ...p, reworkInIndurama: v }))}
        />
        <QuestionRow
          label="¿Acepta nuestras condiciones de Crédito y Pago?"
          value={questionnaireData.creditConditions}
          onChange={v => setQuestionnaireData(p => ({ ...p, creditConditions: v }))}
        />
        <QuestionRow
          label="¿Cuenta con proceso de atención de reclamos (OBLIGATORIO)?"
          value={questionnaireData.claimsProcess}
          onChange={v => setQuestionnaireData(p => ({ ...p, claimsProcess: v }))}
        />
        <QuestionRow
          label="¿Posee Código de Conducta?"
          value={questionnaireData.codeOfConduct}
          onChange={v => setQuestionnaireData(p => ({ ...p, codeOfConduct: v }))}
        />
        <QuestionRow
          label="¿Tiene Eficiencia Energética (ISO 50001)?"
          value={questionnaireData.iso50001}
          onChange={v => setQuestionnaireData(p => ({ ...p, iso50001: v }))}
        />
        <QuestionRow
          label="¿Cumplimiento tributario al día (SRI)?"
          value={questionnaireData.sriCompliance}
          onChange={v => setQuestionnaireData(p => ({ ...p, sriCompliance: v }))}
        />
        <QuestionRow
          label="¿Cumplimiento IESS al día?"
          value={questionnaireData.iessCompliance}
          onChange={v => setQuestionnaireData(p => ({ ...p, iessCompliance: v }))}
        />
        <QuestionRow
          label="¿Tiene sistema propio de facturación?"
          value={questionnaireData.billingSystem}
          onChange={v => setQuestionnaireData(p => ({ ...p, billingSystem: v }))}
        />
        <QuestionRow
          label="¿Ofrece Garantía y servicio Post Venta?"
          value={questionnaireData.warranty}
          onChange={v => setQuestionnaireData(p => ({ ...p, warranty: v }))}
        />

        <View style={[styles.inputGroup, { marginTop: 16 }]}>
          <Text style={styles.inputLabel}>Nombre primer contacto Indurama</Text>
          <TextInput
            style={styles.textInput}
            value={questionnaireData.firstContactName}
            onChangeText={v => setQuestionnaireData(p => ({ ...p, firstContactName: v }))}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Tiempos de reposición (días)</Text>
          <TextInput
            style={styles.textInput}
            value={questionnaireData.replenishmentTime}
            keyboardType="numeric"
            onChangeText={v => setQuestionnaireData(p => ({ ...p, replenishmentTime: v }))}
          />
        </View>
      </View>
    );
  };

  const renderChecklistTab = () => {
    // Helper for Checklist Item
    const ChecklistRow = ({ itemKey, data }: { itemKey: string, data: any }) => (
      <View style={styles.checklistRow}>
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setChecklistData(p => ({
              ...p,
              [itemKey]: { ...p[itemKey as keyof SupplierChecklistData], checked: !data.checked }
            }))}
          >
            <Ionicons name={data.checked ? "checkbox" : "square-outline"} size={24} color="#003E85" />
            <Text style={[styles.checkboxLabel, { marginLeft: 10, fontSize: 14 }]}>
              {data.label} {data.required && <Text style={{ color: 'red' }}>*</Text>}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.uploadButton, data.fileUrl ? styles.uploadButtonSuccess : {}]}
          onPress={() => handleFileUpload(itemKey)}
        >
          <Ionicons name={data.fileUrl ? "document-text" : "cloud-upload-outline"} size={20} color="#fff" />
          <Text style={styles.uploadButtonText}>
            {data.fileUrl ? "Ver/Cambiar" : "Subir"}
          </Text>
        </TouchableOpacity>
      </View>
    );

    const handleFileUpload = async (key: string) => {
      if (!user?.id) {
        Alert.alert('Error', 'No se pudo identificar al usuario');
        return;
      }

      try {
        setSaving(true);
        const media = await pickDocument();

        if (!media) {
          setSaving(false);
          return;
        }

        const url = await uploadSupplierEvidence(
          user.id,
          'evidence',
          key,
          media.uri,
          media.name
        );

        setChecklistData(prev => ({
          ...prev,
          [key]: {
            ...prev[key as keyof SupplierChecklistData],
            fileUrl: url,
            fileName: media.name
          }
        }));

        Alert.alert('Éxito', 'Documento subido correctamente');
      } catch (error) {
        console.error('Error uploading file:', error);
        Alert.alert('Error', 'No se pudo subir el documento');
      } finally {
        setSaving(false);
      }
    };

    return (
      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Checklist de Documentos</Text>
        <Text style={styles.helperText}>Marque y suba los archivos correspondientes:</Text>

        {Object.entries(checklistData).map(([key, item]) => (
          <ChecklistRow key={key} itemKey={key} data={item} />
        ))}
      </View>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'General':
        return renderGeneralTab();
      case 'Operaciones':
        return renderOperationsTab();
      case 'Sistemas':
        return renderSystemsTab();
      case 'Cuestionario':
        return renderQuestionnaireTab();
      case 'Checklist':
        return renderChecklistTab();
      default:
        return renderGeneralTab();
    }
  };

  const getButtonText = () => {
    if (activeTab === 'Checklist') {
      return 'Guardar y Completar';
    }
    return 'Guardar y Continuar';
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Full Width Header */}
      <View style={styles.fullWidthHeader}>
        <View style={styles.headerContentContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Creación de Proveedor EPI</Text>
            <Text style={styles.headerStep}>
              Paso {
                activeTab === 'General' ? 1 :
                  activeTab === 'Operaciones' ? 2 :
                    activeTab === 'Sistemas' ? 3 :
                      activeTab === 'Cuestionario' ? 4 : 5
              } de 5
            </Text>
          </View>

          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="help-circle-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Full Width Tabs */}
      <View style={styles.fullWidthTabs}>
        <View style={styles.tabsContentContainer}>
          {tabs.map(tab => renderTabButton(tab.key, tab.label, tab.icon, tab.step))}
        </View>
      </View>

      {/* Main Content - Centered */}
      <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
        </ScrollView>
      </View>

      {/* Full Width Footer */}
      <View style={styles.fullWidthFooter}>
        <View style={styles.footerContentContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleGoBack}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            disabled={loading || saving}
          >
            <Text style={styles.nextButtonText}>
              {saving ? 'Guardando...' : getButtonText()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Completion Modal */}
      <Modal
        visible={showCompletionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => { }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="checkmark-circle" size={56} color="#10B981" />
            </View>

            <Text style={styles.modalTitle}>EPI Completado</Text>
            <Text style={styles.modalMessage}>
              Has completado exitosamente todos los pasos del proceso EPI.{'\n\n'}
              Ahora puedes continuar con los cuestionarios de evaluación de Calidad y Abastecimiento.
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowCompletionModal(false);
                if (onComplete) {
                  onComplete();
                }
              }}
            >
              <Text style={styles.modalButtonText}>Continuar</Text>
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
    backgroundColor: '#F1F5F9',
  },
  fullWidthHeader: {
    width: '100%',
    backgroundColor: '#003E85',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 24,
  },
  headerContentContainer: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerStep: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidthTabs: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }
    })
  },
  tabsContentContainer: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexWrap: 'wrap',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30,
    gap: 8,
  },
  tabButtonActive: {
    backgroundColor: '#EBF5FF',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#003E85',
  },
  completedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  content: {
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 100, // Space for footer
  },
  formCard: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  miniLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1E293B',
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
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkboxLabel: {
    fontSize: 15,
    marginLeft: 10,
    color: '#334155',
  },
  helperText: {
    fontSize: 12,
    color: '#999999',
    marginTop: -16,
    marginBottom: 20,
    fontStyle: 'italic',
  },

  // Contacts
  contactBlock: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactRole: {
    fontSize: 13,
    fontWeight: '600',
    color: '#003E85',
    marginBottom: 8,
  },

  // Questionnaire Styles
  questionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    marginRight: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
  },
  switchOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  switchActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  switchText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  switchTextActive: {
    color: '#003E85',
  },

  // Checklist Styles
  checklistRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  uploadButtonSuccess: {
    backgroundColor: '#10B981',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#003E85',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagText: {
    fontSize: 13,
    color: '#334155',
  },

  // Footer
  fullWidthFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
    zIndex: 100, // Ensure footer is above other content
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: -4 } },
      web: { boxShadow: '0 -4px 20px rgba(0,0,0,0.05)' },
      android: { elevation: 10 },
    }),
  },
  footerContentContainer: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
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
  // Modal Completion Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#003E85',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    width: '100%',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});