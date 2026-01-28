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

type DetailTab = 'Resumen' | 'Datos EPI' | 'Respuestas' | 'Evidencias' | 'Historial';

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

  const [activeTab, setActiveTab] = useState<DetailTab>('Resumen');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [epiFormData, setEpiFormData] = useState<any>(null);

  const tabs: DetailTab[] = ['Resumen', 'Datos EPI', 'Respuestas', 'Evidencias', 'Historial'];

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

  const renderResumenTab = () => {
    // Usar datos completos de EPI si están disponibles, sino usar supplierData básico
    const generalData = epiFormData?.general || {};
    const displayName = generalData.companyName || supplierData?.companyName || 'N/A';
    const displayRUC = generalData.ruc || supplierData?.ruc || supplierData?.id || 'N/A';
    const displayEmail = supplierData?.email || 'N/A';
    const displayPhone = generalData.contactPersonPhone || supplierData?.phone || 'N/A';
    const displayAddress = generalData.address || 'N/A';
    const displayCity = generalData.city || 'N/A';
    const displayCountry = generalData.country || 'N/A';

    return (
      <View style={[styles.tabContent, isDesktopView && styles.tabContentDesktop]}>
        {/* Columna Izquierda / Superior: Datos */}
        <View style={[styles.card, isDesktopView && { flex: 1, marginTop: 0 }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="business" size={20} color="#6B7280" style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>DATOS DEL PROVEEDOR</Text>
            </View>
          </View>

          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Empresa</Text>
            <Text style={styles.dataValue}>{displayName}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>RUC</Text>
            <Text style={styles.dataValue}>{displayRUC}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Email</Text>
            <Text style={styles.dataValue}>{displayEmail}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Teléfono</Text>
            <Text style={styles.dataValue}>{displayPhone}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Dirección</Text>
            <Text style={styles.dataValue}>{displayAddress}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Ciudad</Text>
            <Text style={styles.dataValue}>{displayCity}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>País</Text>
            <Text style={styles.dataValue}>{displayCountry}</Text>
          </View>
        </View>

        {/* Columna Derecha / Inferior: Métricas */}
        {epiSubmission && (
          <View style={[styles.card, isDesktopView && { flex: 1, marginTop: 0 }]}>
            <View style={styles.evaluationHeader}>
              <Text style={styles.evaluationTitle}>Métricas de Evaluación</Text>
              <Text style={styles.autoText}>Auto-evaluación</Text>
            </View>

            <View style={styles.progressItem}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Calidad</Text>
                <Text style={styles.progressValue}>{Math.round(epiSubmission.calidadScore || 0)}/100</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min(epiSubmission.calidadScore || 0, 100)}%`, backgroundColor: theme.colors.primary }]} />
              </View>
            </View>

            <View style={styles.progressItem}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Abastecimiento</Text>
                <Text style={styles.progressValue}>{Math.round(epiSubmission.abastecimientoScore || 0)}/100</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min(epiSubmission.abastecimientoScore || 0, 100)}%`, backgroundColor: '#00BCD4' }]} />
              </View>
            </View>

            {onNavigateToAudit && (
              <TouchableOpacity style={styles.auditButton} onPress={() => onNavigateToAudit(epiSubmission.id)}>
                <MaterialCommunityIcons name="clipboard-check-outline" size={18} color="#3B82F6" style={{ marginRight: 8 }} />
                <Text style={styles.auditText}>Realizar Auditoría / Recalibrar</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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

  const renderDatosEpiContent = () => {
    if (!epiFormData) return null;
    const { general, operations, systems, questionnaire, checklist } = epiFormData;

    const renderField = (label: string, value: any) => (
      <View style={styles.dataRow}>
        <Text style={styles.dataLabel}>{label}</Text>
        <Text style={value ? styles.dataValue : styles.emptyFieldText}>
          {value || 'No proporcionado'}
        </Text>
      </View>
    );

    return (
      <>
        {/* SECCION 1: DATOS GENERALES */}
        <View style={[styles.card, isDesktopView && { maxWidth: 1200, width: '100%' }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="business" size={20} color="#6B7280" style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>1. DATOS GENERALES</Text>
            </View>
          </View>
          {renderField('Empresa', general?.companyName)}
          {renderField('RUC', general?.ruc)}
          {renderField('Dirección', general?.address)}
          {renderField('Ciudad', general?.city)}
          {renderField('País', general?.country)}
          {renderField('Representante Legal', general?.legalRepresentative)}
          {renderField('Forma Jurídica', general?.legalForm)}
          {renderField('Tipo de Proveedor', general?.supplierType)}
          {renderField('Tiempo en Mercado', general?.marketTime)}
          {renderField('Contacto', general?.contactPersonName)}
        </View>

        {/* SECCION 2: OPERACIONES */}
        <View style={[styles.card, isDesktopView && { maxWidth: 1200, width: '100%' }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="stats-chart" size={20} color="#6B7280" style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>2. OPERACIONES Y VENTAS</Text>
            </View>
          </View>
          {renderField('Enfoque Principal', operations?.mainFocus)}
          {renderField('Productos/Servicios', operations?.productsOrServices)}

          {operations?.productTags && operations.productTags.length > 0 && (
            <View style={{ marginBottom: 16, paddingHorizontal: 16 }}>
              <Text style={[styles.dataLabel, { marginBottom: 8 }]}>Productos</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {operations.productTags.map((tag: string, i: number) => (
                  <View key={i} style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                    <Text style={{ color: '#FFF', fontSize: 12 }}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {operations?.mainClients && operations.mainClients.length > 0 && (
            <View style={{ marginBottom: 16, paddingHorizontal: 16 }}>
              <Text style={[styles.dataLabel, { marginBottom: 8, fontWeight: '600' }]}>Principales Clientes</Text>
              {operations.mainClients.map((c: any, i: number) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#E5E7EB' }}>
                  <Text style={{ flex: 1, fontSize: 14, color: '#374151' }}>{c.name || 'No especificado'}</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.primary }}>{c.share || '-'}%</Text>
                </View>
              ))}
            </View>
          )}

          {renderField('Ventas 2023', operations?.sales2023)}
          {renderField('Ventas 2024', operations?.sales2024)}
          {renderField('Ventas 2025', operations?.sales2025)}
          {renderField('Empleados', operations?.employeesCount)}
          {renderField('Certificaciones', operations?.certifications)}
        </View>

        {/* SECCION 3: SISTEMAS */}
        <View style={[styles.card, isDesktopView && { maxWidth: 1200, width: '100%' }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="hardware-chip" size={20} color="#6B7280" style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>3. SISTEMAS Y CONTACTOS</Text>
            </View>
          </View>

          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <Text style={[styles.dataLabel, { marginBottom: 12, fontWeight: '600' }]}>Sistemas Implementados</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {['ERP', 'CRM', 'MRP', 'WMS', 'SCM', 'BI'].map((sys) => (
                <View key={sys} style={{ flexDirection: 'row', alignItems: 'center', width: '45%' }}>
                  <Ionicons
                    name={systems?.[`has${sys}`] ? "checkbox" : "square-outline"}
                    size={20}
                    color={systems?.[`has${sys}`] ? "#10B981" : "#9CA3AF"}
                  />
                  <Text style={{ marginLeft: 8, fontSize: 14, color: '#374151' }}>{sys}</Text>
                </View>
              ))}
            </View>
          </View>

          {systems?.additionalContacts && systems.additionalContacts.length > 0 && (
            <View style={{ paddingHorizontal: 16 }}>
              <Text style={[styles.dataLabel, { marginBottom: 8, fontWeight: '600' }]}>Contactos Adicionales</Text>
              {systems.additionalContacts.map((ct: any, i: number) => (
                <View key={i} style={{ backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4 }}>{ct.name}</Text>
                  <Text style={{ fontSize: 13, color: '#6B7280' }}>Cargo: {ct.position || 'N/A'}</Text>
                  <Text style={{ fontSize: 13, color: '#6B7280' }}>Tel: {ct.phone}</Text>
                  <Text style={{ fontSize: 13, color: '#6B7280' }}>Email: {ct.email}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* SECCION 4: CUESTIONARIO */}
        <View style={[styles.card, isDesktopView && { maxWidth: 1200, width: '100%' }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="help-circle" size={20} color="#6B7280" style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>4. CUESTIONARIO</Text>
            </View>
          </View>

          {questionnaire?.responses && questionnaire.responses.length > 0 ? (
            questionnaire.responses.map((item: any, i: number) => (
              <View key={i} style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#E5E7EB' }}>
                <Text style={{ fontSize: 14, color: '#374151', marginBottom: 6 }}>{i + 1}. {item.question}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons
                    name={item.answer === 'Si' ? "checkmark-circle" : "close-circle"}
                    size={18}
                    color={item.answer === 'Si' ? "#10B981" : "#EF4444"}
                  />
                  <Text style={{ marginLeft: 6, fontSize: 14, fontWeight: '600', color: item.answer === 'Si' ? "#10B981" : "#EF4444" }}>
                    {item.answer || 'No respondida'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={styles.emptyFieldText}>No hay respuestas al cuestionario</Text>
            </View>
          )}
        </View>

        {/* SECCION 5: CHECKLIST */}
        <View style={[styles.card, isDesktopView && { maxWidth: 1200, width: '100%' }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="documents" size={20} color="#6B7280" style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>5. CHECKLIST DE DOCUMENTOS</Text>
            </View>
          </View>

          {checklist?.items && checklist.items.length > 0 ? (
            checklist.items.map((item: any, i: number) => (
              <TouchableOpacity
                key={i}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#E5E7EB' }}
                onPress={() => item.uri && handleOpenDocument(item.uri)}
                disabled={!item.uri}
              >
                <Ionicons
                  name={item.uri ? "checkmark-circle" : "close-circle-outline"}
                  size={24}
                  color={item.uri ? "#10B981" : "#9CA3AF"}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#111827' }}>{item.name}</Text>
                  <Text style={{ fontSize: 12, color: item.uri ? '#10B981' : '#EF4444', marginTop: 2 }}>
                    {item.uri ? '✓ Cargado' : 'No cargado'}
                  </Text>
                </View>
                {item.uri && <Ionicons name="open-outline" size={20} color="#3B82F6" />}
              </TouchableOpacity>
            ))
          ) : (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={styles.emptyFieldText}>No hay documentos</Text>
            </View>
          )}
        </View>
      </>
    );
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
              {activeTab === 'Resumen' && renderResumenTab()}

              {activeTab === 'Datos EPI' && !epiFormData && (
                <View style={styles.emptyContainer}>
                  <Ionicons name="document-outline" size={60} color="#ccc" style={{ marginBottom: 10 }} />
                  <Text style={styles.emptyText}>No hay datos EPI disponibles.</Text>
                </View>
              )}

              {activeTab === 'Datos EPI' && epiFormData && (
                <View style={{ paddingBottom: 40 }}>
                  <Text style={[styles.sectionHeaderTitle, { color: theme.colors.primary, marginBottom: 20 }]}>DATOS FORMULARIO EPI</Text>
                  {renderDatosEpiContent()}
                </View>
              )}

              {activeTab === 'Respuestas' && epiSubmission && (
                <View style={{ paddingBottom: 40 }}>
                  <Text style={[styles.sectionHeaderTitle, { color: theme.colors.primary, margin: 20 }]}>CALIDAD</Text>
                  {renderRespuestasList(epiSubmission.qualityResponses, 'calidad')}
                  <Text style={[styles.sectionHeaderTitle, { color: '#00BCD4', margin: 20 }]}>ABASTECIMIENTO</Text>
                  {renderRespuestasList(epiSubmission.supplyResponses, 'abastecimiento')}
                </View>
              )}

              {activeTab === 'Evidencias' && renderEvidenciasTab()}

              {activeTab === 'Historial' && (
                <View style={[styles.card, isDesktopView && { width: '100%', maxWidth: 1200, alignSelf: 'center' }]}>
                  <Text style={styles.historyTitle}>Trazabilidad</Text>
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineIconContainer}>
                      <View style={styles.timelineDot} />
                      <View style={styles.timelineLine} />
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineLabel}>Envío</Text>
                      <Text style={styles.timelineDate}>
                        {epiSubmission?.createdAt?.toDate ? epiSubmission.createdAt.toDate().toLocaleDateString() : 'N/A'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineIconContainer}>
                      <View style={[styles.timelineDot, { backgroundColor: getStatusColor(epiSubmission?.status) }]} />
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineLabel}>Estado Actual</Text>
                      <Text style={[styles.timelineDate, { color: getStatusColor(epiSubmission?.status) }]}>
                        {getStatusText(epiSubmission?.status)}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
              <View style={{ height: 40 }} />
            </View>
          </ScrollView>

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
    </View>
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