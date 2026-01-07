import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { SupplierResponseService } from '../services/supplierResponseService';
import { theme } from '../styles/theme';

type DetailTab = 'Resumen' | 'Respuestas' | 'Evidencias' | 'Historial';

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
  const [loading, setLoading] = useState(true);
  const [supplierData, setSupplierData] = useState<any>(null);
  const [epiSubmission, setEpiSubmission] = useState<any>(null);
  const [epiConfig, setEpiConfig] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<DetailTab>('Resumen');
  const [observations, setObservations] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const tabs: DetailTab[] = ['Resumen', 'Respuestas', 'Evidencias', 'Historial'];

  useEffect(() => {
    loadData();
  }, [supplierId]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('=== Loading supplier detail for ID:', supplierId, '===');

      // 1. Get User Data
      const userDoc = await getDoc(doc(db, 'users', supplierId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('User data loaded:', userData);
        setSupplierData(userData);
      } else {
        console.log('No user data found');
      }

      // 2. Try to load from epi_submissions first (submitted evaluations)
      let submission = await SupplierResponseService.getEPISubmission(supplierId);
      console.log('EPI Submission from epi_submissions:', submission);

      // 3. If submission exists, ensure it has scores (calculate if missing)
      if (submission) {
        let calidadScore = submission.calidadScore ?? 0;
        let abastecimientoScore = submission.abastecimientoScore ?? 0;
        let totalScore = submission.calculatedScore ?? submission.globalScore ?? 0;

        // Calculate scores from responses if they're 0
        if (totalScore === 0 || calidadScore === 0 || abastecimientoScore === 0) {
          console.log('Calculating scores from responses...');

          // Calidad: count YES answers
          const qualityResponses = submission.qualityResponses || [];
          const qualityYesCount = qualityResponses.filter((r: any) =>
            r.answer?.toUpperCase() === 'SI' || r.answer?.toUpperCase() === 'CUMPLE'
          ).length;
          const qualityTotal = Math.max(qualityResponses.length, 1);
          calidadScore = calidadScore || (qualityYesCount / qualityTotal) * 100;

          // Abastecimiento: count YES answers
          const supplyResponses = submission.supplyResponses || [];
          const supplyYesCount = supplyResponses.filter((r: any) =>
            r.answer?.toUpperCase() === 'SI' || r.answer?.toUpperCase() === 'CUMPLE'
          ).length;
          const supplyTotal = Math.max(supplyResponses.length, 1);
          abastecimientoScore = abastecimientoScore || (supplyYesCount / supplyTotal) * 100;

          // Global score
          totalScore = totalScore || (calidadScore + abastecimientoScore) / 2;

          console.log('Calculated scores:', { calidadScore, abastecimientoScore, totalScore, qualityYesCount, supplyYesCount });

          // Update submission with calculated scores
          submission = {
            ...submission,
            calculatedScore: totalScore,
            calidadScore: calidadScore,
            abastecimientoScore: abastecimientoScore,
          };
        }
      }

      // 4. If no submission, try supplier_evaluations (in-progress evaluations)
      if (!submission) {
        console.log('No epi_submission, trying supplier_evaluations...');

        // Read directly from Firebase
        const evalDoc = await getDoc(doc(db, 'supplier_evaluations', supplierId));

        if (evalDoc.exists()) {
          const evalData = evalDoc.data();
          console.log('=== RAW DATA from supplier_evaluations ===', evalData);

          // Handle different field names for scores
          const calidadScore = evalData.calidadScore ?? evalData.qualityScore ?? 0;
          const abastecimientoScore = evalData.abastecimientoScore ?? evalData.supplyScore ?? 0;
          const totalScore = evalData.globalScore ?? evalData.calculatedScore ?? evalData.totalScore ?? 0;

          console.log('Extracted scores:', { calidadScore, abastecimientoScore, totalScore });

          submission = {
            id: evalDoc.id,
            supplierId: supplierId,
            status: evalData.status || 'draft',
            calculatedScore: totalScore,
            calidadScore: calidadScore,
            abastecimientoScore: abastecimientoScore,
            classification: evalData.classification || '',
            qualityResponses: evalData.responses?.filter((r: any) => r.category === 'calidad') || [],
            supplyResponses: evalData.responses?.filter((r: any) => r.category === 'abastecimiento') || [],
            photoEvidence: evalData.photoEvidence || [],
            submittedAt: evalData.submittedAt,
            createdAt: evalData.createdAt,
            updatedAt: evalData.updatedAt,
          };
          console.log('Mapped submission:', submission);
        } else {
          console.log('No supplier_evaluations document found');
        }
      }

      setEpiSubmission(submission);
      console.log('Final epiSubmission state:', submission);

      // 4. Get EPI Config
      const { EpiService } = await import('../services/epiService');
      const config = await EpiService.getEpiConfig();
      setEpiConfig(config);

    } catch (error) {
      console.error('Error loading supplier detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    if (status === 'approved') return '#10B981';
    if (status === 'submitted') return '#F59E0B';
    if (status === 'revision_requested') return '#EF4444';
    return '#6B7280';
  };

  const getStatusText = (status?: string) => {
    if (status === 'approved') return 'Aprobado';
    if (status === 'submitted') return 'Pendiente Revisión';
    if (status === 'revision_requested') return 'Revisión Solicitada';
    return 'En Progreso';
  };

  const handleApprove = () => {
    setShowApprovalModal(true);
  };

  const confirmApprove = () => {
    setShowApprovalModal(false);
    if (onApprove) {
      onApprove(supplierId);
    }
  };

  const renderResumenTab = () => (
    <>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Image source={require('../../assets/icons/profile.png')} style={styles.cardIcon} />
            <Text style={styles.cardTitle}>DATOS INTERNOS (INDURAMA)</Text>
          </View>
        </View>

        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Ejecutivo de Compra</Text>
          <Text style={styles.dataValue}>N/A</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Auditor Asignado</Text>
          <Text style={styles.dataValue}>{loading ? '...' : (epiSubmission?.reviewedBy || 'Sin asignar')}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Tipo Auditoría</Text>
          <Text style={styles.linkValue}>EPI Inicial</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Fecha Evaluación</Text>
          <Text style={styles.dataValue}>
            {epiSubmission?.submittedAt?.toDate().toLocaleDateString() || 'N/A'}
          </Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Clasificación</Text>
          <View style={styles.tagDark}>
            <Text style={styles.tagText}>{epiSubmission?.classification || 'Pendiente'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <View style={styles.dotBlue} />
            <Text style={styles.infoLabel}>TIPO PROVEEDOR</Text>
            <Text style={styles.infoValue}>{supplierData?.supplierType || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>PARTICIPACIÓN</Text>
            <Text style={styles.infoValueBlue}>{supplierData?.induramaParticipation || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {epiSubmission && (
        <View style={styles.card}>
          <View style={styles.evaluationHeader}>
            <Text style={styles.evaluationTitle}>Evaluación Detallada</Text>
            <Text style={styles.autoText}>Auto-evaluación</Text>
          </View>

          <View style={styles.progressItem}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Calidad (1-6)</Text>
              <Text style={styles.progressValue}>{Math.round(epiSubmission.calidadScore || 0)}/100</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(epiSubmission.calidadScore || 0, 100)}%`, backgroundColor: theme.colors.primary }]} />
            </View>
          </View>

          <View style={styles.progressItem}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Abastecimiento (7-8)</Text>
              <Text style={styles.progressValue}>{Math.round(epiSubmission.abastecimientoScore || 0)}/100</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(epiSubmission.abastecimientoScore || 0, 100)}%`, backgroundColor: '#00BCD4' }]} />
            </View>
          </View>

          {onNavigateToAudit && (
            <>
              <TouchableOpacity
                style={styles.auditButton}
                onPress={() => onNavigateToAudit(epiSubmission.id)}
              >
                <Image source={require('../../assets/icons/edit.png')} style={styles.auditIcon} />
                <Text style={styles.auditText}>Auditar / Recalibrar Puntaje</Text>
              </TouchableOpacity>
              <Text style={styles.auditSubtext}>
                Utilice esta opción para realizar auditoría en planta
              </Text>
            </>
          )}
        </View>
      )}
    </>
  );

  const renderRespuestasList = (responses: any[], category: 'calidad' | 'abastecimiento') => {
    if (!epiConfig || !epiConfig[category]) return <ActivityIndicator />;

    const sections = epiConfig[category].sections;

    return (
      <View>
        {sections.map((section: any, i: number) => (
          <View key={i} style={styles.card}>
            <Text style={styles.sectionNumber}>{section.title}</Text>
            {section.questions.map((q: any, j: number) => {
              const answerObj = responses?.find((r: any) => r.questionId === q.id);
              const isYes = answerObj?.answer === 'SI';
              const points = isYes ? (category === 'calidad' ? 5 : 5.5) : 0;

              return (
                <View key={j} style={styles.questionCard}>
                  <Text style={styles.questionTitle}>{q.text}</Text>
                  <View style={styles.answerRow}>
                    <View style={styles.answerLeft}>
                      <Image
                        source={isYes ? require('../../assets/icons/check.png') : require('../../assets/icons/close.png')}
                        style={isYes ? styles.checkGreen : styles.checkRed}
                      />
                      <Text style={isYes ? styles.answerText : styles.answerTextRed}>
                        {isYes ? 'Sí cumple' : 'NO CUMPLE'}
                      </Text>
                    </View>
                    <View style={isYes ? styles.pointsBadge : styles.pointsBadgeGray}>
                      <Text style={isYes ? styles.pointsText : styles.pointsTextGray}>{points} pts</Text>
                    </View>
                  </View>
                  {answerObj?.observation && (
                    <Text style={styles.questionNote}>"{answerObj.observation}"</Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    )
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#003E85" />
          <Text style={{ marginTop: 10, color: '#666' }}>Cargando detalles del proveedor...</Text>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
              <Image source={require('../../assets/icons/arrow-left.png')} style={styles.backIcon} />
            </TouchableOpacity>

            <Text style={styles.headerTitle} numberOfLines={1}>
              {loading ? 'Cargando...' : supplierData?.companyName || 'Proveedor'}
            </Text>

            <Image source={require('../../assets/icono_indurama.png')} style={styles.logo} resizeMode="contain" />
          </View>

          <View style={styles.scoreSection}>
            <View style={styles.scoreHeader}>
              <Text style={styles.scoreLabel}>Score Total EPI</Text>
              <View style={styles.statusBadge}>
                <Text style={[styles.statusText, { color: getStatusColor(epiSubmission?.status) }]}>
                  {getStatusText(epiSubmission?.status)}
                </Text>
              </View>
            </View>

            <Text style={styles.scoreValue}>{Math.round(epiSubmission?.calculatedScore || 0)}</Text>
            <Text style={styles.scoreSubtext}>de 100 puntos</Text>

            {epiSubmission?.classification && (
              <View style={[styles.badgeGreen, { backgroundColor: '#10B981' }]}>
                <Text style={styles.badgeText}>CLASIFICACIÓN: {epiSubmission.classification}</Text>
              </View>
            )}

            <View style={styles.scoreCards}>
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

          <View style={styles.tabsContainer}>
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

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {activeTab === 'Resumen' && renderResumenTab()}

            {activeTab === 'Respuestas' && epiSubmission && (
              <>
                <View style={[styles.card, { backgroundColor: 'transparent', shadowOpacity: 0 }]}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: theme.colors.primary, marginBottom: 8 }}>
                    CALIDAD (1-6)
                  </Text>
                  {renderRespuestasList(epiSubmission.qualityResponses, 'calidad')}

                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#00BCD4', marginVertical: 16 }}>
                    ABASTECIMIENTO (7-8)
                  </Text>
                  {renderRespuestasList(epiSubmission.supplyResponses, 'abastecimiento')}
                </View>
              </>
            )}

            {activeTab === 'Evidencias' && epiSubmission?.photoEvidence && (
              <View style={styles.card}>
                <Text style={styles.evidenceSectionTitle}>FOTOS CARGADAS</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 10 }}>
                  {epiSubmission.photoEvidence.map((photo: any, index: number) => (
                    <View key={index} style={[styles.evidencePhotoCard, { width: '48%', marginBottom: 12 }]}>
                      <Image source={{ uri: photo.uri }} style={{ width: '100%', height: 120, borderRadius: 8, backgroundColor: '#eee' }} />
                      <Text style={styles.evidencePhotoDescription}>{photo.description || `Foto ${index + 1}`}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {activeTab === 'Historial' && (
              <View style={styles.card}>
                <Text style={styles.historyTitle}>Trazabilidad</Text>
                {epiSubmission?.createdAt && (
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineIconContainer}>
                      <View style={styles.timelineIconGreen}>
                        <Image source={require('../../assets/icons/check.png')} style={styles.timelineCheckIcon} />
                      </View>
                      <View style={styles.timelineLine} />
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineDate}>{epiSubmission.createdAt.toDate().toLocaleDateString()}</Text>
                      <Text style={styles.timelineEventTitle}>EPI Enviado por Proveedor</Text>
                    </View>
                  </View>
                )}
                <View style={styles.timelineItem}>
                  <View style={styles.timelineIconContainer}>
                    <View style={styles.timelineIconBlue}>
                      <Image source={require('../../assets/icons/clock.png')} style={styles.timelineClockIcon} />
                    </View>
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineEventTitle}>Estado Actual: {getStatusText(epiSubmission?.status)}</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>

          <Modal
            visible={showApprovalModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowApprovalModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>¿Aprobar Solicitud?</Text>
                <Text style={styles.modalMessage}>
                  Esta acción aprobará la solicitud y permitirá continuar con el proceso.
                </Text>

                <TouchableOpacity style={styles.modalApproveButton} onPress={confirmApprove}>
                  <Text style={styles.modalApproveText}>Aprobar</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#FFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
  },
  logo: {
    width: 60,
    height: 35,
  },
  scoreSection: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 16,
    color: '#FFF',
  },
  statusBadge: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scoreSubtext: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
    marginBottom: 12,
  },
  badgeGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scoreCards: {
    flexDirection: 'row',
    gap: 12,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  scoreCardBlue: {
    backgroundColor: '#DBEAFE',
  },
  scoreCardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  scoreCardValueBlue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  scoreCardLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  scoreCardLabelBlue: {
    fontSize: 12,
    color: '#1E3A8A',
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    tintColor: '#6B7280',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4B5563',
    textTransform: 'uppercase',
  },
  editButton: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dataLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  dataValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  linkValue: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  tagDark: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoItem: {
    alignItems: 'center',
  },
  dotBlue: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  infoValueBlue: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: 'bold',
  },
  sectionLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  productText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  financeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  financeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  financeIcon: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: 'bold',
    marginRight: 8,
  },
  financeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4B5563',
  },
  policyLink: {
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertIcon: {
    width: 16,
    height: 16,
    tintColor: '#EF4444',
    marginRight: 8,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  alertText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 16,
  },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  evidenceIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  evidenceInfo: {
    flex: 1,
  },
  evidenceName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  evidenceType: {
    fontSize: 11,
    color: '#6B7280',
  },
  seeLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
  evaluationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  evaluationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  autoText: {
    fontSize: 12,
    color: '#9CA3AF',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  progressItem: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
    color: '#4B5563',
  },
  progressValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  auditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  auditIcon: {
    width: 16,
    height: 16,
    tintColor: '#3B82F6',
    marginRight: 8,
  },
  auditText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 14,
  },
  auditSubtext: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  subTabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 16,
  },
  subTabActive: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  subTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  subTabTextActive: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  subTabText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  sectionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  questionCard: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  questionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  answerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  answerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkGreen: {
    width: 20,
    height: 20,
    tintColor: '#10B981',
    marginRight: 8,
  },
  checkRed: {
    width: 20,
    height: 20,
    tintColor: '#EF4444',
    marginRight: 8,
  },
  answerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  answerTextRed: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  pointsBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  pointsBadgeGray: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  pointsTextGray: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  questionNote: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  evidenceSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  evidenceSectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  fileCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  evidenceFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  evidenceFileIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
    tintColor: '#EF4444',
  },
  evidenceFileIconBlue: {
    width: 32,
    height: 32,
    marginRight: 12,
    tintColor: '#3B82F6',
  },
  evidenceFileInfo: {
    flex: 1,
  },
  evidenceFileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  evidenceFileRef: {
    fontSize: 11,
    color: '#3B82F6',
  },
  evidenceDownloadIcon: {
    width: 20,
    height: 20,
    tintColor: '#9CA3AF',
    marginLeft: 12,
  },
  evidencePhotoCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  evidencePhotoDescription: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    padding: 8,
    textAlign: 'center',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  historySubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 24,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineIconContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIconGreen: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineIconBlue: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineCheckIcon: {
    width: 18,
    height: 18,
    tintColor: '#10B981',
  },
  timelineClockIcon: {
    width: 18,
    height: 18,
    tintColor: '#3B82F6',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 8,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
  },
  timelineDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  timelineEventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  timelineEventBy: {
    fontSize: 12,
    color: '#6B7280',
  },
  observationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    height: 120,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalApproveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalApproveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  modalCancelButton: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
});

export default SupplierDetailScreen;