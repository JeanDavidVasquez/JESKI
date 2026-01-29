import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Image,
  Modal,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { doc, getDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage'; // <--- IMPORTANTE
import { db, storage } from '../../services/firebaseConfig';
import { loadSupplierEpiData } from './../../services/supplierDataService'; // <--- IMPORTANTE: Asegurate de importar 'storage'
import { SupplierResponseService } from '../../services/supplierResponseService';
import { EpiService } from '../../services/epiService';
import { useResponsive, BREAKPOINTS } from '../../styles/responsive';
import { theme } from '../../styles/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

type DetailTab = 'Datos Generales' | 'Operaciones' | 'Sistemas' | 'Cuestionario' | 'Documentos';

interface SupplierDetailScreenProps {
  supplierId: string;
  onNavigateBack?: () => void;
  onApprove?: (supplierId: string) => void;
  onReject?: (supplierId: string) => void;
  onNavigateToEdit?: () => void;
  onNavigateToAudit?: (submissionId?: string) => void;
}

const SupplierDetailScreen: React.FC<SupplierDetailScreenProps> = ({
  supplierId,
  onNavigateBack,
  onApprove,
  onReject,
  onNavigateToEdit,
  onNavigateToAudit,
}) => {
  const { isDesktopView, width } = useResponsive();
  const containerMaxWidth = 1200;

  const [loading, setLoading] = useState(true);
  const [supplierData, setSupplierData] = useState<any>(null);
  const [epiSubmission, setEpiSubmission] = useState<any>(null);
  const [epiConfig, setEpiConfig] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<string>('Datos Generales');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [epiFormData, setEpiFormData] = useState<any>(null);

  const tabs = ['Datos Generales', 'Operaciones', 'Sistemas', 'Cuestionario', 'Documentos'];

  useEffect(() => {
    loadData();
  }, [supplierId]);

  // --- FUNCIÓN PARA OBTENER URLS REALES DE STORAGE ---
  // --- FUNCIÓN PARA OBTENER URLS REALES DE STORAGE ---
  const processEvidenceUrls = async (items: any[]) => {
    if (!items || items.length === 0) return [];

    // Validar si items es un array de strings (URLs antiguas/simples) o de objetos
    const normalizedItems = items.map(item => {
      if (typeof item === 'string') {
        return { uri: item, type: 'unknown', name: 'Archivo' };
      }
      return item;
    });

    return Promise.all(normalizedItems.map(async (item) => {
      // 1. Identificar la propiedad donde está la ruta o url
      let currentPath = item.uri || item.url || item.downloadUrl || item.path || item.finalUri;

      let finalUri = null;
      let finalName = item.name || 'Archivo';

      // 2. Si ya es un link web (http/https), lo usamos directo
      if (typeof currentPath === 'string' && (currentPath.startsWith('http') || currentPath.startsWith('file'))) {
        finalUri = currentPath;
      }
      // 3. Si no es http, asumimos que es una ruta de Storage (ej: "suppliers/abc.jpg")
      else if (currentPath) {
        try {
          const storageRef = ref(storage, currentPath);
          finalUri = await getDownloadURL(storageRef);
          console.log("URL resuelta para", currentPath, "=>", finalUri);
        } catch (error) {
          console.error("Error obteniendo URL de storage para:", currentPath, error);
        }
      }

      // Intentar deducir nombre y extension si tenemos URI
      if (finalUri) {
        try {
          // Decodificar la URL para obtener el nombre real si viene de Firebase
          const decoded = decodeURIComponent(finalUri);
          // Firebase suele poner el nombre antes del ?
          const urlPart = decoded.split('?')[0];
          const namePart = urlPart.split('/').pop() || 'Archivo';
          if (finalName === 'Archivo') {
            finalName = namePart;
          }
        } catch (e) { }
      }

      return { ...item, finalUri, name: finalName };
    }));
  };

  const isImageFile = (url: string | null) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.includes('.jpg') || lower.includes('.jpeg') || lower.includes('.png') || lower.includes('.webp') || lower.includes('.heic');
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Cargar datos del Usuario
      const userDoc = await getDoc(doc(db, 'users', supplierId));
      if (userDoc.exists()) {
        setSupplierData(userDoc.data());
      }

      // 2. Cargar submission
      let submission = await SupplierResponseService.getEPISubmission(supplierId);

      // 2.1 Fallback: Buscar en supplier_evaluations si no hay submission
      if (!submission) {
        const evalDoc = await getDoc(doc(db, 'supplier_evaluations', supplierId));
        if (evalDoc.exists()) {
          const evalData = evalDoc.data();
          submission = {
            id: evalDoc.id,
            supplierId: supplierId,
            status: evalData.status || 'draft',
            calculatedScore: evalData.globalScore ?? evalData.calculatedScore ?? evalData.totalScore ?? 0,
            calidadScore: evalData.calidadScore ?? evalData.qualityScore ?? 0,
            abastecimientoScore: evalData.abastecimientoScore ?? evalData.supplyScore ?? 0,
            classification: evalData.classification || '',
            qualityResponses: evalData.responses?.filter((r: any) => r.category === 'calidad') || [],
            supplyResponses: evalData.responses?.filter((r: any) => r.category === 'abastecimiento') || [],

            // Datos crudos
            rawPhotos: evalData.photoEvidence || evalData.images || evalData.evidencias || [],
            rawDocs: evalData.documentEvidence || evalData.files || evalData.documents || [],

            submittedAt: evalData.submittedAt,
            createdAt: evalData.createdAt,
          };
        }
      }

      // --- PASO CRÍTICO: PROCESAR Y CLASIFICAR EVIDENCIAS ---
      if (submission) {
        // Recopilar arrays originales sin mezclarlos
        const rawPhotos = [
          ...(Array.isArray(submission.photoEvidence) ? submission.photoEvidence : []),
          ...(Array.isArray(submission.rawPhotos) ? submission.rawPhotos : []),
        ];

        const rawDocs = [
          ...(Array.isArray(submission.documentEvidence) ? submission.documentEvidence : []),
          ...(Array.isArray(submission.rawDocs) ? submission.rawDocs : [])
        ];

        // Procesar URLs por separado para mantener la categorización original
        // Esto soluciona el problema de fotos sin extensión que eran clasificadas como documentos
        submission.photoEvidence = await processEvidenceUrls(rawPhotos);
        submission.documentEvidence = await processEvidenceUrls(rawDocs);

        console.log("Fotos procesadas:", submission.photoEvidence.length);
        console.log("Documentos procesados:", submission.documentEvidence.length);
      }

      setEpiSubmission(submission);

      // 3. Config
      try {
        const config = await EpiService.getEpiConfig();
        setEpiConfig(config);
      } catch (e) {
        console.log("No se pudo cargar config, usando defaults");
      }

      // 4. Cargar datos completos del formulario EPI
      try {
        const epiData = await loadSupplierEpiData(supplierId);
        setEpiFormData(epiData);
      } catch (e) {
        console.log("No se pudo cargar EPI data:", e);
      }

    } catch (error) {
      console.error('Error cargando detalles:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved':
      case 'epi_approved': return '#10B981';
      case 'submitted':
      case 'epi_submitted': return '#F59E0B';
      case 'revision_requested': return '#EF4444';
      case 'rejected': return '#EF4444';
      case 'suspended': return '#991B1B';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'approved': return 'Aprobado';
      case 'epi_approved': return 'EPI Aprobado';
      case 'submitted':
      case 'epi_submitted': return 'EPI Enviado';
      case 'revision_requested': return 'Revisión Solicitada';
      case 'rejected': return 'Rechazado';
      case 'suspended': return 'Suspendido';
      default: return 'En Progreso';
    }
  };

  const confirmApprove = () => {
    setShowApprovalModal(false);
    if (onApprove) onApprove(supplierId);
  };

  const handleOpenDocument = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(err => console.error("Error al abrir link", err));
    } else {
      alert("No se pudo obtener el enlace del documento.");
    }
  };

  // --- RENDERIZADO ---

  /* --- RENDERIZADO --- */

  /* --- RENDERIZADO DE TABS --- */

  const renderDatosGeneralesTab = () => {
    const data = supplierData || {};

    // Helper para filas de datos
    const DataRow = ({ label, value, subLabel }: { label: string, value: any, subLabel?: string }) => (
      <View style={styles.dataRow}>
        <Text style={styles.dataLabel}>{label}</Text>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={styles.dataValue}>{value || '-'}</Text>
          {subLabel && <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{subLabel}</Text>}
        </View>
      </View>
    );

    return (
      <View style={styles.tabContent}>
        {/* SECCIÓN 1: IDENTIFICACIÓN */}
        <View style={[styles.card, isDesktopView && { width: '100%', maxWidth: 1200 }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="card-outline" size={20} color="#6B7280" style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>IDENTIFICACIÓN Y DATOS MAESTROS (BP)</Text>
            </View>
          </View>

          <DataRow label="Tipo de BP" value={data.bpType === 'Person' ? 'Persona' : 'Organización'} />
          <DataRow label="Agrupador" value={data.groupingType} />
          <DataRow label="Tratamiento" value={data.treatment} />
          <DataRow label="Razón Social / Nombre" value={data.companyName} subLabel={data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : undefined} />

          {data.bpType === 'Person' && (
            <>
              <DataRow label="Apellidos" value={data.lastName} />
              <DataRow label="Estado Civil" value={data.maritalStatus} />
            </>
          )}

          <DataRow label="Nacionalidad" value={data.nationality} />
          <DataRow label="Forma Jurídica" value={data.legalForm} />
          <DataRow label="Categoría Tributaria" value={data.taxCategory} />
          <DataRow label="Idioma" value={data.language} />
          <DataRow label="Concepto de Búsqueda" value={data.searchTerm} />
        </View>

        {/* SECCIÓN 2: UBICACIÓN Y CONTACTO */}
        <View style={[styles.card, isDesktopView && { width: '100%', maxWidth: 1200 }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="location-outline" size={20} color="#6B7280" style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>UBICACIÓN Y CONTACTO</Text>
            </View>
          </View>

          <DataRow label="País" value={data.country} />
          <DataRow label="Región / Provincia" value={data.region} />
          <DataRow label="Ciudad" value={data.city} />
          <DataRow label="Distrito / Población" value={data.district} />
          <DataRow label="Código Postal" value={data.postalCode} />

          <View style={{ marginVertical: 8, height: 1, backgroundColor: '#E5E7EB' }} />

          <DataRow label="Calle Principal" value={data.street || data.address} />
          <DataRow label="Calle 2" value={data.street2} />
          <DataRow label="Calle 3" value={data.street3} />
          <DataRow label="Número de Casa" value={data.houseNumber} />

          <View style={{ marginVertical: 8, height: 1, backgroundColor: '#E5E7EB' }} />

          <DataRow label="Email Facturación" value={data.email} />
          <DataRow label="Teléfono Fijo" value={data.centralPhone || data.phone} />
          <DataRow label="Teléfono Celular" value={data.mobilePhone} />
        </View>
      </View>
    );
  };

  const renderEvidenciasTab = () => {
    // Usamos las listas procesadas que ya tienen 'finalUri'
    const photos = epiSubmission?.photoEvidence || [];
    const documents = epiSubmission?.documentEvidence || [];
    const hasData = photos.length > 0 || documents.length > 0;

    if (!hasData) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-open-outline" size={60} color="#ccc" style={{ marginBottom: 10 }} />
          <Text style={styles.emptyText}>El proveedor no ha cargado evidencias.</Text>
        </View>
      );
    }

    const photoWidth = width >= BREAKPOINTS.desktop ? '18%' : '48%';

    return (
      <View style={{ paddingBottom: 40, alignItems: isDesktopView ? 'center' : undefined }}>
        {photos.length > 0 && (
          <View style={[styles.card, isDesktopView && { width: '100%', maxWidth: 1200 }]}>
            <Text style={styles.evidenceSectionTitle}>FOTOGRAFÍAS ({photos.length})</Text>
            <View style={[styles.photosGrid, isDesktopView && { gap: 16 }]}>
              {photos.map((photo: any, index: number) => {
                // Usamos finalUri que calculamos en loadData
                const imgUri = photo.finalUri;

                return (
                  <View key={index} style={[styles.photoContainer, { width: photoWidth }]}>
                    <TouchableOpacity
                      onPress={() => imgUri && handleOpenDocument(imgUri)}
                      activeOpacity={imgUri ? 0.7 : 1}
                    >
                      {imgUri ? (
                        <Image
                          source={{ uri: imgUri }}
                          style={styles.photoImage}
                          resizeMode="cover"
                          onError={(e) => console.log("Error cargando imagen:", e.nativeEvent.error)}
                        />
                      ) : (
                        <View style={[styles.photoImage, styles.photoError]}>
                          <Ionicons name="image-outline" size={24} color="#999" />
                          <Text style={{ fontSize: 10, color: '#999', textAlign: 'center', marginTop: 4 }}>
                            No se pudo cargar
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    <Text style={styles.evidencePhotoDescription} numberOfLines={2}>
                      {photo.description || photo.name || `Foto ${index + 1}`}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {documents.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.evidenceSectionTitle}>DOCUMENTOS ({documents.length})</Text>
            {documents.map((doc: any, index: number) => (
              <TouchableOpacity
                key={index}
                style={styles.evidenceFileCard}
                onPress={() => handleOpenDocument(doc.finalUri)}
                disabled={!doc.finalUri}
              >
                <Ionicons name="document-text" size={28} color="#E11D48" style={{ marginRight: 12 }} />
                <View style={styles.evidenceFileInfo}>
                  <Text style={styles.evidenceFileName} numberOfLines={1}>{doc.name || `Documento ${index + 1}`}</Text>
                  <Text style={styles.evidenceFileRef}>{doc.finalUri ? (doc.type || 'Archivo') : 'Enlace no disponible'}</Text>
                </View>
                <Ionicons name="download-outline" size={20} color={doc.finalUri ? "#999" : "#eee"} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderRespuestasList = (responses: any[], category: 'calidad' | 'abastecimiento') => {
    if (!epiConfig || !epiConfig[category]) return <ActivityIndicator />;

    return (
      <View>
        {epiConfig[category].sections.map((section: any, i: number) => (
          <View key={i} style={[styles.card, isDesktopView && { maxWidth: 1200, alignSelf: 'center', width: '100%' }]}>
            <Text style={styles.sectionNumber}>{section.title}</Text>

            <View style={isDesktopView ? { flexDirection: 'row', flexWrap: 'wrap', gap: 16 } : undefined}>
              {section.questions.map((q: any, j: number) => {
                const answerObj = responses?.find((r: any) => r.questionId === q.id);
                const answerText = answerObj?.answer?.toUpperCase() || 'NO RESPONDIÓ';
                const isYes = answerText === 'SI' || answerText === 'CUMPLE';
                const points = isYes ? (category === 'calidad' ? 5 : 5.5) : 0;

                return (
                  <View
                    key={j}
                    style={[
                      styles.questionCard,
                      isDesktopView && {
                        width: '48%',
                        borderWidth: 1,
                        borderRadius: 8,
                        padding: 12,
                        borderColor: '#E5E7EB',
                        borderBottomWidth: 1
                      }
                    ]}
                  >
                    <Text style={styles.questionTitle}>{q.text}</Text>
                    <View style={styles.answerRow}>
                      <View style={styles.answerLeft}>
                        <Ionicons
                          name={isYes ? "checkmark-circle" : "close-circle"}
                          size={18}
                          color={isYes ? '#10B981' : '#EF4444'}
                          style={{ marginRight: 6 }}
                        />
                        <Text style={isYes ? styles.answerTextGreen : styles.answerTextRed}>
                          {isYes ? 'CUMPLE' : 'NO CUMPLE'}
                        </Text>
                      </View>
                      <View style={styles.pointsBadge}>
                        <Text style={styles.pointsText}>{points} pts</Text>
                      </View>
                    </View>
                    {answerObj?.observation ? (
                      <View style={styles.observationBox}>
                        <Text style={styles.observationLabel}>Obs:</Text>
                        <Text style={styles.questionNote}>{answerObj.observation}</Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    );
  };

  /* --- TAB OPERACIONES --- */
  const renderOperacionesTab = () => {
    const data = supplierData || {};
    // Service Focus helper
    const FocusCard = ({ label, selected }: { label: string, selected: boolean }) => (
      <View style={{
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: selected ? '#FFEB3B' : '#1E3A8A', // Yellow if selected, Dark Blue if not
        borderRadius: 8,
        marginBottom: 8,
        minWidth: '45%',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: selected ? '#F59E0B' : '#1E3A8A'
      }}>
        <Text style={{
          color: selected ? '#000' : '#FFF',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          {label}
        </Text>
        {selected && (
          <View style={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#10B981', borderRadius: 10, padding: 2 }}>
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
        )}
      </View>
    );

    const focusOptions = ["Servicio Reparación", "Servicios de Construcción", "Servicio de Asesoramiento", "Venta de Repuestos", "Suministros / Materia Prima"];

    return (
      <View style={styles.tabContent}>

        {/* ENFOQUE DE SERVICIO (Visual) */}
        <View style={[styles.card, isDesktopView && { width: '100%', maxWidth: 1200 }]}>
          <View style={{ padding: 12, backgroundColor: '#06b6d4', borderRadius: 8, marginBottom: 16 }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>
              Su servicio se enfoca en:
            </Text>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            {focusOptions.map(opt => (
              <FocusCard key={opt} label={opt} selected={data.serviceFocus === opt} />
            ))}
          </View>

          {data.serviceFocus && (
            <View style={{ marginTop: 20, backgroundColor: '#FFEB3B', padding: 8, alignItems: 'center' }}>
              <Text style={{ fontWeight: 'bold', fontSize: 12, color: '#000' }}>HA ELEGIDO:</Text>
              <Text style={{ fontWeight: '900', fontSize: 16, color: '#000' }}>{data.serviceFocus.toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* ACTIVIDAD COMERCIAL */}
        <View style={[styles.card, isDesktopView && { width: '100%', maxWidth: 1200 }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="briefcase-outline" size={20} color="#6B7280" style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>ACTIVIDAD COMERCIAL</Text>
            </View>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Tipos de Negocio</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, flex: 1, justifyContent: 'flex-end' }}>
              {data.businessType && Array.isArray(data.businessType) ? data.businessType.map((b: string) => (
                <View key={b} style={{ backgroundColor: '#DBEAFE', padding: 4, borderRadius: 4 }}>
                  <Text style={{ fontSize: 12, color: '#1E40AF' }}>{b}</Text>
                </View>
              )) : <Text style={styles.dataValue}>-</Text>}
            </View>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Plazo de Entrega (Días)</Text>
            <Text style={styles.dataValue}>{data.deliveryTime || '-'}</Text>
          </View>

          <View style={{ marginTop: 12 }}>
            <Text style={[styles.dataLabel, { marginBottom: 4 }]}>Descripción Comercial</Text>
            <Text style={[styles.dataValue, { textAlign: 'left', color: '#4B5563' }]}>{data.commercialDescription || 'Sin descripción'}</Text>
          </View>
        </View>
      </View>
    )
  }

  /* --- TAB SISTEMAS --- */
  const renderSistemasTab = () => {
    const data = supplierData || {};
    const DataRow = ({ label, value }: { label: string, value: any }) => (
      <View style={styles.dataRow}>
        <Text style={styles.dataLabel}>{label}</Text>
        <Text style={styles.dataValue}>{value || '-'}</Text>
      </View>
    );

    return (
      <View style={styles.tabContent}>
        {/* INFORMACION BANCARIA */}
        <View style={[styles.card, isDesktopView && { width: '100%', maxWidth: 1200 }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="wallet-outline" size={20} color="#6B7280" style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>INFORMACIÓN BANCARIA Y FISCAL</Text>
            </View>
          </View>
          <DataRow label="Tipo ID Fiscal" value={data.taxIdType} />
          <DataRow label="Número ID Fiscal" value={data.taxId} />
          <DataRow label="Banco" value={data.bankName} />
          <DataRow label="Clave de Banco" value={data.bankKey} />
          <DataRow label="Cuenta Bancaria" value={data.accountNumber || data.bankAccount} />
          <DataRow label="Tipo de Cuenta" value={data.accountType} />
          <DataRow label="IBAN" value={data.iban} />
        </View>

        {/* DATOS DE SOCIEDAD */}
        <View style={[styles.card, isDesktopView && { width: '100%', maxWidth: 1200 }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="business-outline" size={20} color="#6B7280" style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>DATOS DE SOCIEDAD Y COMPRAS</Text>
            </View>
          </View>
          <DataRow label="Sociedad (Asignada)" value={data.society || 'INDURAMA'} />
          <DataRow label="Condición de Pago" value={data.paymentCondition} />

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Vías de Pago</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, flex: 1, justifyContent: 'flex-end' }}>
              {data.paymentMethods && Array.isArray(data.paymentMethods) ? data.paymentMethods.map((p: string) => (
                <View key={p} style={{ backgroundColor: '#ECFDF5', padding: 4, borderRadius: 4, borderWidth: 0.5, borderColor: '#10B981' }}>
                  <Text style={{ fontSize: 11, color: '#047857' }}>{p}</Text>
                </View>
              )) : <Text style={styles.dataValue}>-</Text>}
            </View>
          </View>

          <DataRow label="Tipo de Retención" value={data.withholdingType} />
          <DataRow label="Organización de Compras" value={data.purchasingOrg} />
          <DataRow label="Grupo de Compras" value={data.purchasingGroup} />
        </View>
      </View>
    )
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando información...</Text>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <View style={[styles.headerContent, isDesktopView && { width: '100%', maxWidth: 1200, alignSelf: 'center' }]}>
              <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {supplierData?.companyName || 'Detalle Proveedor'}
              </Text>
              <Image source={require('../../../assets/icono_indurama.png')} style={styles.logo} resizeMode="contain" />
            </View>
          </View>

          <View style={styles.scoreSection}>
            <View style={[isDesktopView && { width: '100%', maxWidth: 1200, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>

              {/* Left Side: Score & Info */}
              <View style={[!isDesktopView && { width: '100%' }]}>
                <View style={[styles.scoreHeader, isDesktopView && { justifyContent: 'flex-start', gap: 12 }]}>
                  <Text style={styles.scoreLabel}>Score Total EPI</Text>
                  <View style={styles.statusBadge}>
                    <Text style={[styles.statusText, { color: getStatusColor(epiSubmission?.status) }]}>
                      {getStatusText(epiSubmission?.status)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.scoreValue}>{Math.round(epiSubmission?.calculatedScore || 0)}</Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: isDesktopView ? 0 : 12 }}>
                  <Text style={[styles.scoreSubtext, { marginBottom: 0 }]}>puntos totales</Text>
                  {epiSubmission?.classification && (
                    <View style={[styles.classificationBadge, { marginBottom: 0 }]}>
                      <Text style={styles.classificationText}>CLASE: {epiSubmission.classification}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Right Side: Detail Cards */}
              <View style={[styles.scoreCards, isDesktopView && { width: 400 }]}>
                <View style={styles.scoreCard}>
                  <Text style={styles.scoreCardValue}>{Math.round(epiSubmission?.calidadScore || 0)}</Text>
                  <Text style={styles.scoreCardLabel}>Calidad</Text>
                </View>
                <View style={[styles.scoreCard, styles.scoreCardBlue]}>
                  <Text style={styles.scoreCardValueBlue}>{Math.round(epiSubmission?.abastecimientoScore || 0)}</Text>
                  <Text style={styles.scoreCardLabelBlue}>Abastecimiento</Text>
                </View>
              </View>

            </View>
          </View>

          <View style={[styles.tabsContainer, isDesktopView && { justifyContent: 'center' }]}>
            <View style={{ flexDirection: 'row', width: '100%', maxWidth: 1200 }}>
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.tabActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={isDesktopView ? { alignItems: 'center' } : undefined}
          >
            <View style={{ width: '100%', maxWidth: 1200, marginTop: isDesktopView ? 30 : 0 }}>
              {activeTab === 'Datos Generales' && renderDatosGeneralesTab()}
              {activeTab === 'Operaciones' && renderOperacionesTab()}
              {activeTab === 'Sistemas' && renderSistemasTab()}

              {activeTab === 'Cuestionario' && (
                <View style={{ paddingBottom: 40 }}>
                  <Text style={[styles.sectionHeaderTitle, { color: theme.colors.primary, margin: 20 }]}>CALIDAD</Text>
                  {epiSubmission ? renderRespuestasList(epiSubmission.qualityResponses, 'calidad') : <Text style={styles.emptyText}>Sin datos</Text>}

                  <Text style={[styles.sectionHeaderTitle, { color: '#00BCD4', margin: 20 }]}>ABASTECIMIENTO</Text>
                  {epiSubmission ? renderRespuestasList(epiSubmission.supplyResponses, 'abastecimiento') : <Text style={styles.emptyText}>Sin datos</Text>}
                </View>
              )}

              {activeTab === 'Documentos' && renderEvidenciasTab()}

              <View style={{ height: 40 }} />
            </View>
          </ScrollView>
          {/* End of content */}

          <Modal
            visible={showApprovalModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowApprovalModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Ionicons name="checkmark-circle" size={50} color="#10B981" style={{ marginBottom: 10 }} />
                <Text style={styles.modalTitle}>¿Aprobar Proveedor?</Text>
                <TouchableOpacity style={styles.modalApproveButton} onPress={confirmApprove}>
                  <Text style={styles.modalApproveText}>Confirmar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalCancelButton} onPress={() => setShowApprovalModal(false)}>
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View >
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#666', fontSize: 16 },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 20,
    paddingBottom: 16
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%'
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF', flex: 1, textAlign: 'center' },
  logo: { width: 50, height: 30 },
  scoreSection: { backgroundColor: theme.colors.primary, paddingHorizontal: 20, paddingBottom: 25, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  scoreLabel: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
  statusBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  scoreValue: { fontSize: 48, fontWeight: 'bold', color: '#FFF' },
  scoreSubtext: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 12 },
  classificationBadge: { backgroundColor: '#10B981', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 15 },
  classificationText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  scoreCards: { flexDirection: 'row', gap: 12 },
  scoreCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 12, padding: 15, alignItems: 'center', elevation: 3 },
  scoreCardBlue: { backgroundColor: '#DBEAFE' },
  scoreCardValue: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  scoreCardValueBlue: { fontSize: 24, fontWeight: 'bold', color: '#1E3A8A' },
  scoreCardLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  scoreCardLabelBlue: { fontSize: 12, color: '#1E3A8A', marginTop: 4 },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingHorizontal: 10, marginTop: 10 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: theme.colors.primary },
  tabText: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  tabTextActive: { color: theme.colors.primary, fontWeight: 'bold' },
  content: { flex: 1 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginHorizontal: 20, marginTop: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  cardHeader: { flexDirection: 'row', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#4B5563', letterSpacing: 0.5 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  dataLabel: { fontSize: 14, color: '#9CA3AF', flex: 1 },
  dataValue: { fontSize: 14, fontWeight: '600', color: '#333', flex: 1.5, textAlign: 'right' },
  evaluationHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  evaluationTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  autoText: { fontSize: 11, backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, color: '#666' },
  progressItem: { marginBottom: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 13, color: '#4B5563' },
  progressValue: { fontSize: 13, fontWeight: 'bold' },
  progressBar: { height: 10, backgroundColor: '#E5E7EB', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  auditButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, borderWidth: 1, borderColor: '#3B82F6', borderRadius: 8, padding: 12, backgroundColor: '#EFF6FF' },
  auditText: { color: '#3B82F6', fontWeight: '600' },
  evidenceSectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#6B7280', marginBottom: 12, textTransform: 'uppercase' },
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  photoContainer: { width: '48%', marginBottom: 15, backgroundColor: '#FFF', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
  photoImage: { width: '100%', height: 120, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  photoError: { backgroundColor: '#f9f9f9' },
  evidencePhotoDescription: { fontSize: 11, padding: 8, textAlign: 'center', color: '#444', backgroundColor: '#FAFAFA' },
  evidenceFileCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, marginBottom: 10, backgroundColor: '#FAFAFA' },
  evidenceFileInfo: { flex: 1 },
  evidenceFileName: { fontSize: 14, fontWeight: '600', color: '#333' },
  evidenceFileRef: { fontSize: 11, color: '#999' },
  emptyContainer: { alignItems: 'center', marginTop: 50, opacity: 0.6 },
  emptyText: { fontSize: 16, color: '#999' },
  sectionHeaderTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  sectionNumber: { fontWeight: 'bold', color: '#9CA3AF', marginBottom: 15, fontSize: 13, textTransform: 'uppercase' },
  questionCard: { marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  questionTitle: { fontSize: 15, color: '#374151', marginBottom: 10, lineHeight: 22 },
  answerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  answerLeft: { flexDirection: 'row', alignItems: 'center' },
  answerTextGreen: { color: '#10B981', fontWeight: 'bold', fontSize: 13 },
  answerTextRed: { color: '#EF4444', fontWeight: 'bold', fontSize: 13 },
  pointsBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  pointsText: { fontSize: 12, fontWeight: 'bold', color: '#6B7280' },
  observationBox: { marginTop: 10, backgroundColor: '#FEF3C7', padding: 10, borderRadius: 6, borderLeftWidth: 3, borderLeftColor: '#F59E0B' },
  observationLabel: { fontSize: 11, fontWeight: 'bold', color: '#B45309', marginBottom: 2 },
  questionNote: { fontSize: 13, color: '#4B5563', fontStyle: 'italic' },
  historyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 20 },
  timelineItem: { flexDirection: 'row', marginBottom: 0, height: 70 },
  timelineIconContainer: { width: 30, alignItems: 'center' },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#CBD5E1', zIndex: 1 },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#E2E8F0', marginTop: -2 },
  timelineContent: { flex: 1, paddingLeft: 10 },
  timelineLabel: { fontSize: 12, color: '#94A3B8' },
  timelineDate: { fontSize: 15, color: '#334155', fontWeight: '500', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', padding: 25, borderRadius: 16, width: '85%', alignItems: 'center', elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', color: '#1F2937' },
  modalApproveButton: { backgroundColor: '#10B981', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, marginTop: 10, width: '100%' },
  modalApproveText: { color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
  modalCancelButton: { marginTop: 15, padding: 10 },
  modalCancelText: { textAlign: 'center', color: '#6B7280', fontWeight: '500' },

  // Responsive Styles
  tabContent: { flexDirection: 'column', gap: 16 },
  tabContentDesktop: { flexDirection: 'row', gap: 24, alignItems: 'flex-start' },
  emptyFieldText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});

export default SupplierDetailScreen;