import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../styles/theme';

type DetailTab = 'Resumen' | 'Respuestas' | 'Evidencias' | 'Historial';

interface SupplierDetailScreenProps {
  supplierId: string;
  onNavigateBack?: () => void;
  onApprove?: (supplierId: string) => void;
  onReject?: (supplierId: string) => void;
  onNavigateToEdit?: () => void;
  onNavigateToAudit?: () => void;
}

const SupplierDetailScreen: React.FC<SupplierDetailScreenProps> = ({
  supplierId,
  onNavigateBack,
  onApprove,
  onReject,
  onNavigateToEdit,
  onNavigateToAudit,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('Resumen');
  const [observations, setObservations] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const tabs: DetailTab[] = ['Resumen', 'Respuestas', 'Evidencias', 'Historial'];

  const handleApprove = () => {
    setShowApprovalModal(true);
  };

  const confirmApprove = () => {
    setShowApprovalModal(false);
    if (onApprove) {
      onApprove(supplierId);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header Azul */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
          <Image source={require('../../assets/icons/arrow-left.png')} style={styles.backIcon} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Tornillos S.A.</Text>
        
        <Image source={require('../../assets/icono_indurama.png')} style={styles.logo} resizeMode="contain" />
      </View>

      {/* Score Section */}
      <View style={styles.scoreSection}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreLabel}>Score Total EPI</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Pendiente Revisión</Text>
          </View>
        </View>
        
        <Text style={styles.scoreValue}>88</Text>
        <Text style={styles.scoreSubtext}>de 100 puntos</Text>
        
        <View style={styles.badgeGreen}>
          <Image source={require('../../assets/icons/check.png')} style={styles.badgeIcon} />
          <Text style={styles.badgeText}>CLASIFICACIÓN: CRECER</Text>
        </View>

        {/* Score Cards */}
        <View style={styles.scoreCards}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreCardValue}>85</Text>
            <Text style={styles.scoreCardLabel}>Calidad</Text>
          </View>
          <View style={[styles.scoreCard, styles.scoreCardBlue]}>
            <Text style={styles.scoreCardValueBlue}>90</Text>
            <Text style={styles.scoreCardLabelBlue}>Abastecimiento</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
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

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'Resumen' ? (
          <>
            {/* Datos Internos */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Image source={require('../../assets/icons/profile.png')} style={styles.cardIcon} />
                  <Text style={styles.cardTitle}>DATOS INTERNOS (INDURAMA)</Text>
                </View>
                <TouchableOpacity onPress={onNavigateToEdit}>
                  <Text style={styles.editButton}>Editar</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Ejecutivo de Compra</Text>
                <Text style={styles.dataValue}>Carlos Mendez</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Auditor Asignado</Text>
                <Text style={styles.dataValue}>Ing. Ana López</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Tipo Auditoría</Text>
                <Text style={styles.linkValue}>Inicial / Selección</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Fecha Evaluación</Text>
                <Text style={styles.dataValue}>22-Nov-2025</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Clasificación</Text>
                <View style={styles.tagDark}>
                  <Text style={styles.tagText}>Fabricante Directo</Text>
                </View>
              </View>
            </View>

            {/* Tipo Proveedor y Participación */}
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <View style={styles.dotBlue} />
                  <Text style={styles.infoLabel}>TIPO PROVEEDOR</Text>
                  <Text style={styles.infoValue}>Internacional</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>PARTICIPACIÓN</Text>
                  <Text style={styles.infoValueBlue}>15% Share</Text>
                </View>
              </View>
            </View>

            {/* Productos */}
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>PRODUCTOS</Text>
              <Text style={styles.productText}>
                Láminas de acero inoxidable, aleaciones especiales.
              </Text>
            </View>

            {/* Cumplimiento Financiero */}
            <View style={styles.card}>
              <View style={styles.financeHeader}>
                <View style={styles.financeLeft}>
                  <Text style={styles.financeIcon}>$</Text>
                  <Text style={styles.financeTitle}>Cumplimiento Financiero</Text>
                </View>
                <Text style={styles.policyLink}>Intl. Policy</Text>
              </View>
              
              <View style={styles.alertBox}>
                <Image source={require('../../assets/icons/close.png')} style={styles.alertIcon} />
                <Text style={styles.alertTitle}>Estados Financieros no disponibles</Text>
              </View>
              <Text style={styles.alertText}>
                El proveedor indica políticas de privacidad interna que impiden compartir balances completos
              </Text>
              
              <View style={styles.evidenceRow}>
                <Image source={require('../../assets/icons/document.png')} style={styles.evidenceIcon} />
                <View style={styles.evidenceInfo}>
                  <Text style={styles.evidenceName}>Evidencia_Justificacion.msg</Text>
                  <Text style={styles.evidenceType}>Correo Oficial / Legal</Text>
                </View>
                <TouchableOpacity>
                  <Text style={styles.seeLink}>Ver</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Evaluación Detallada */}
            <View style={styles.card}>
              <View style={styles.evaluationHeader}>
                <Text style={styles.evaluationTitle}>Evaluación Detallada</Text>
                <Text style={styles.autoText}>Auto-evaluación</Text>
              </View>
              
              <View style={styles.progressItem}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Calidad (1-6)</Text>
                  <Text style={styles.progressValue}>85/100</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '85%', backgroundColor: theme.colors.primary }]} />
                </View>
              </View>
              
              <View style={styles.progressItem}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Abastecimiento (7-8)</Text>
                  <Text style={styles.progressValue}>90/100</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '90%', backgroundColor: '#00BCD4' }]} />
                </View>
              </View>
              
              <TouchableOpacity style={styles.auditButton} onPress={onNavigateToAudit}>
                <Image source={require('../../assets/icons/edit.png')} style={styles.auditIcon} />
                <Text style={styles.auditText}>Audiar / Recalibrar Puntaje</Text>
              </TouchableOpacity>
              <Text style={styles.auditSubtext}>
                Utilice esta opción para realizar auditoría en planta
              </Text>
            </View>

            {/* Observaciones */}
            <View style={styles.card}>
              <Text style={styles.observationsTitle}>Observaciones</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Escriba aquí sus observaciones..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={6}
                value={observations}
                onChangeText={setObservations}
                textAlignVertical="top"
              />
            </View>
          </>
        ) : activeTab === 'Respuestas' ? (
          <>
            {/* Sub-tabs para Calidad y Abastecimiento */}
            <View style={styles.subTabsContainer}>
              <TouchableOpacity style={styles.subTabActive}>
                <Text style={styles.subTabTextActive}>Calidad(1-6)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.subTab}>
                <Text style={styles.subTabText}>Abastecimiento(7-8)</Text>
              </TouchableOpacity>
            </View>

            {/* 1. OBJETIVOS Y LIDERAZGO */}
            <View style={styles.card}>
              <Text style={styles.sectionNumber}>1. OBJETIVOS Y LIDERAZGO</Text>
              
              <View style={styles.questionCard}>
                <Text style={styles.questionTitle}>1.1¿Objetivos estratégicos definidos y monitoreados?</Text>
                
                <View style={styles.answerRow}>
                  <View style={styles.answerLeft}>
                    <Image source={require('../../assets/icons/check.png')} style={styles.checkGreen} />
                    <Text style={styles.answerText}>Sí cumple</Text>
                  </View>
                  <View style={styles.pointsBadge}>
                    <Text style={styles.pointsText}>1 pts</Text>
                  </View>
                </View>
                
                <Text style={styles.questionNote}>
                  "Adjuntamos el BSC firmado por gerencia general correspondiente al año 2025"
                </Text>
                
                <View style={styles.fileCard}>
                  <Image source={require('../../assets/icons/document.png')} style={styles.fileIcon} />
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName}>BSC_2025_firmado.pdf</Text>
                    <Text style={styles.fileSize}>2.4mb • 10 ene</Text>
                  </View>
                  <TouchableOpacity>
                    <Image source={require('../../assets/icons/exit.png')} style={styles.downloadIcon} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* 2. SISTEMA DE GESTIÓN */}
            <View style={styles.card}>
              <Text style={styles.sectionNumber}>2. SISTEMA DE GESTIÓN</Text>
              
              <View style={styles.questionCard}>
                <Text style={styles.questionTitle}>1.1¿Dispone de certificaciones de su SGC(ISO 9001)?</Text>
                
                <View style={styles.answerRow}>
                  <View style={styles.answerLeft}>
                    <Image source={require('../../assets/icons/check.png')} style={styles.checkGreen} />
                    <Text style={styles.answerText}>Sí cumple</Text>
                  </View>
                  <View style={styles.pointsBadge}>
                    <Text style={styles.pointsText}>15 pts</Text>
                  </View>
                </View>
                
                <Text style={styles.questionNote}>
                  "Adjuntamos la certificación ISO 9001"
                </Text>
                
                <View style={styles.fileCard}>
                  <Image source={require('../../assets/icons/img.png')} style={styles.fileIconImage} />
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName}>Certificado_ISO.jpg</Text>
                    <Text style={styles.fileSize}>2.4mb • 10 ene</Text>
                  </View>
                  <TouchableOpacity>
                    <Image source={require('../../assets/icons/eye.png')} style={styles.viewIcon} />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.questionCard}>
                <Text style={styles.questionTitle}>5.8 Procedimiento inspección producto terminado</Text>
                
                <View style={styles.answerRow}>
                  <View style={styles.answerLeft}>
                    <Image source={require('../../assets/icons/close.png')} style={styles.checkRed} />
                    <Text style={styles.answerTextRed}>NO CUMPLE</Text>
                  </View>
                  <View style={styles.pointsBadgeGray}>
                    <Text style={styles.pointsTextGray}>0 pts</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        ) : activeTab === 'Evidencias' ? (
          <>
            {/* 1. Legal y Financiero */}
            <View style={styles.card}>
              <View style={styles.evidenceSectionHeader}>
                <Text style={styles.evidenceSectionTitle}>1.Legal y Financiero</Text>
                <Text style={styles.fileCount}>3 archivos</Text>
              </View>
              
              <View style={styles.evidenceFileCard}>
                <Image source={require('../../assets/icons/document.png')} style={styles.evidenceFileIcon} />
                <View style={styles.evidenceFileInfo}>
                  <Text style={styles.evidenceFileName}>Estados_Financieros_2024-pdf</Text>
                  <Text style={styles.evidenceFileRef}>Ref 8.9: Situación Financiera</Text>
                </View>
                <TouchableOpacity>
                  <Image source={require('../../assets/icons/exit.png')} style={styles.evidenceDownloadIcon} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.evidenceFileCard}>
                <Image source={require('../../assets/icons/img.png')} style={styles.evidenceFileIconBlue} />
                <View style={styles.evidenceFileInfo}>
                  <Text style={styles.evidenceFileName}>Ruc_Vigente.jpg</Text>
                  <Text style={styles.evidenceFileRef}>Ref 1.1: Constitución Legal</Text>
                </View>
                <TouchableOpacity>
                  <Image source={require('../../assets/icons/exit.png')} style={styles.evidenceDownloadIcon} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. FLUJO DE PRODUCCIÓN (FOTOS) */}
            <View style={styles.card}>
              <Text style={styles.evidenceSectionTitle}>2.FLUJO DE PRODUCCIÓN (FOTOS)</Text>
              
              <View style={styles.evidencePhotoRow}>
                <View style={styles.evidencePhotoCard}>
                  <View style={styles.evidencePhotoPlaceholder}>
                    <Text style={styles.evidencePhotoLabel}>Evidencia 1</Text>
                  </View>
                  <View style={styles.evidencePhotoFooter}>
                    <Text style={styles.evidencePhotoRefText}>Ref 5.4: Línea Producción</Text>
                  </View>
                  <Text style={styles.evidencePhotoDescription}>Vista General Planta</Text>
                </View>
                
                <View style={styles.evidencePhotoCard}>
                  <View style={styles.evidencePhotoPlaceholder}>
                    <Text style={styles.evidencePhotoLabel}>Evidencia 2</Text>
                  </View>
                  <View style={styles.evidencePhotoFooter}>
                    <Text style={styles.evidencePhotoRefText}>Ref 5.4: Línea Producción</Text>
                  </View>
                  <Text style={styles.evidencePhotoDescription}>Vista General Planta</Text>
                </View>
              </View>
              
              <View style={styles.evidencePhotoRow}>
                <View style={styles.evidencePhotoCard}>
                  <View style={styles.evidencePhotoPlaceholder}>
                    <Text style={styles.evidencePhotoLabel}>Evidencia 3</Text>
                  </View>
                  <View style={styles.evidencePhotoFooter}>
                    <Text style={styles.evidencePhotoRefText}>Ref 5.4: Línea Producción</Text>
                  </View>
                  <Text style={styles.evidencePhotoDescription}>Vista General Planta</Text>
                </View>
                
                <View style={styles.evidencePhotoCardAdd}>
                  <Image source={require('../../assets/icons/camera.png')} style={styles.cameraIcon} />
                  <Text style={styles.addPhotoText}>Agregar Foto</Text>
                </View>
              </View>
            </View>

            {/* 2. ESTACIONES DE CONTROL (CALIDAD) */}
            <View style={styles.card}>
              <Text style={styles.evidenceSectionTitle}>2.ESTACIONES DE CONTROL (CALIDAD)</Text>
              
              <View style={styles.evidencePhotoCardSingle}>
                <View style={styles.evidencePhotoPlaceholder}>
                  <Text style={styles.evidencePhotoLabel}>Evidencia 3</Text>
                </View>
                <View style={styles.evidencePhotoFooter}>
                  <Text style={styles.evidencePhotoRefText}>Ref 5.4: Línea Producción</Text>
                </View>
                <Text style={styles.evidencePhotoDescription}>Vista General Planta</Text>
              </View>
            </View>
          </>
        ) : activeTab === 'Historial' ? (
          <>
            {/* Trazabilidad Completa */}
            <View style={styles.card}>
              <Text style={styles.historyTitle}>Trazabilidad Completa</Text>
              <Text style={styles.historySubtitle}>Seguimiento del proceso de evaluación</Text>
              
              {/* Timeline Item 1 */}
              <View style={styles.timelineItem}>
                <View style={styles.timelineIconContainer}>
                  <View style={styles.timelineIconGreen}>
                    <Image source={require('../../assets/icons/check.png')} style={styles.timelineCheckIcon} />
                  </View>
                  <View style={styles.timelineLine} />
                </View>
                
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineDate}>22 Oct 2025</Text>
                  <Text style={styles.timelineEventTitle}>Invitación Enviada</Text>
                  <Text style={styles.timelineEventBy}>por María González</Text>
                </View>
              </View>
              
              {/* Timeline Item 2 */}
              <View style={styles.timelineItem}>
                <View style={styles.timelineIconContainer}>
                  <View style={styles.timelineIconGreen}>
                    <Image source={require('../../assets/icons/check.png')} style={styles.timelineCheckIcon} />
                  </View>
                  <View style={styles.timelineLine} />
                </View>
                
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineDate}>23 Oct 2025</Text>
                  <Text style={styles.timelineEventTitle}>Proveedor creó su cuenta</Text>
                </View>
              </View>
              
              {/* Timeline Item 3 */}
              <View style={styles.timelineItem}>
                <View style={styles.timelineIconContainer}>
                  <View style={styles.timelineIconGreen}>
                    <Image source={require('../../assets/icons/check.png')} style={styles.timelineCheckIcon} />
                  </View>
                  <View style={styles.timelineLine} />
                </View>
                
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineDate}>24 Oct 2025</Text>
                  <Text style={styles.timelineEventTitle}>Proveedor envió EPI final</Text>
                </View>
              </View>
              
              {/* Timeline Item 4 - Pending */}
              <View style={styles.timelineItem}>
                <View style={styles.timelineIconContainer}>
                  <View style={styles.timelineIconBlue}>
                    <Image source={require('../../assets/icons/clock.png')} style={styles.timelineClockIcon} />
                  </View>
                </View>
                
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineDate}>24 Oct 2025</Text>
                  <Text style={styles.timelineEventTitle}>Pendiente de Auditoria por Indurama</Text>
                </View>
              </View>
            </View>
          </>
        ) : null}

        {/* Buttons */}
        <TouchableOpacity style={styles.approveButton} onPress={handleApprove}>
          <Image source={require('../../assets/icons/check.png')} style={styles.buttonIcon} />
          <Text style={styles.approveText}>Aceptar Solicitud</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.rejectButton} onPress={() => onReject && onReject(supplierId)}>
          <Image source={require('../../assets/icons/close.png')} style={styles.buttonIconRed} />
          <Text style={styles.rejectText}>Rechazar Solicitud</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Approval Modal */}
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
              Esta acción aprobará la solicitud SOL-2025-042 y permitirá continuar con el proceso de búsqueda de proveedores y cotización
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
    width: 120,
    height: 70,
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
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 16,
  },
  badgeIcon: {
    width: 14,
    height: 14,
    tintColor: '#FFF',
    marginRight: 6,
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
    borderBottomWidth: 2,
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
    tintColor: '#374151',
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#374151',
  },
  editButton: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dataLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  dataValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  linkValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
    textDecorationLine: 'underline',
  },
  tagDark: {
    backgroundColor: '#4B5563',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  infoItem: {
    flex: 1,
  },
  dotBlue: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  infoValueBlue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  productText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
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
    fontWeight: 'bold',
    color: '#374151',
    marginRight: 8,
  },
  financeTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#374151',
  },
  policyLink: {
    fontSize: 12,
    color: '#3B82F6',
    textDecorationLine: 'underline',
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  alertIcon: {
    width: 20,
    height: 20,
    tintColor: '#EF4444',
    marginRight: 8,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#991B1B',
    flex: 1,
  },
  alertText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 12,
  },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 12,
  },
  evidenceIcon: {
    width: 20,
    height: 24,
    tintColor: '#6B7280',
    marginRight: 12,
  },
  evidenceInfo: {
    flex: 1,
  },
  evidenceName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  evidenceType: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  seeLink: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  evaluationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  evaluationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  autoText: {
    fontSize: 11,
    color: '#6B7280',
  },
  progressItem: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: '#374151',
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
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  auditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingVertical: 10,
    marginTop: 8,
  },
  auditIcon: {
    width: 16,
    height: 16,
    tintColor: theme.colors.primary,
    marginRight: 8,
  },
  auditText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  auditSubtext: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
  },
  observationsTitle: {
    fontSize: 14,
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
    fontSize: 13,
    color: '#1F2937',
    minHeight: 100,
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginTop: 24,
  },
  buttonIcon: {
    width: 18,
    height: 18,
    tintColor: '#FFF',
    marginRight: 8,
  },
  approveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginTop: 12,
  },
  buttonIconRed: {
    width: 18,
    height: 18,
    tintColor: '#EF4444',
    marginRight: 8,
  },
  rejectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  subTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 8,
    padding: 4,
  },
  subTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  subTabActive: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 6,
  },
  subTabText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  subTabTextActive: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
  },
  sectionNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B7280',
    marginBottom: 12,
  },
  questionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  questionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  answerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    backgroundColor: '#D1FAE5',
    borderRadius: 10,
    padding: 2,
  },
  checkRed: {
    width: 20,
    height: 20,
    tintColor: '#EF4444',
    marginRight: 8,
  },
  answerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  answerTextRed: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  pointsBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pointsText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  pointsBadgeGray: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pointsTextGray: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  questionNote: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fileIcon: {
    width: 22,
    height: 26,
    tintColor: '#EF4444',
    marginRight: 12,
  },
  fileIconImage: {
    width: 24,
    height: 22,
    tintColor: '#3B82F6',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  downloadIcon: {
    width: 24,
    height: 20,
    tintColor: '#3B82F6',
    marginLeft: 8,
  },
  viewIcon: {
    width: 20,
    height: 20,
    tintColor: '#3B82F6',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  evidenceSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  evidenceSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  fileCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  evidenceFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  evidenceFileIcon: {
    width: 22,
    height: 26,
    tintColor: '#EF4444',
    marginRight: 12,
  },
  evidenceFileIconBlue: {
    width: 24,
    height: 22,
    tintColor: '#3B82F6',
    marginRight: 12,
  },
  evidenceFileInfo: {
    flex: 1,
  },
  evidenceFileName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  evidenceFileRef: {
    fontSize: 11,
    color: '#3B82F6',
  },
  evidenceDownloadIcon: {
    width: 24,
    height: 20,
    tintColor: '#9CA3AF',
  },
  evidencePhotoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  evidencePhotoCard: {
    width: '48%',
  },
  evidencePhotoCardSingle: {
    width: '100%',
  },
  evidencePhotoCardAdd: {
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 36,
  },
  evidencePhotoPlaceholder: {
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    height: 136,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  evidencePhotoLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  evidencePhotoFooter: {
    backgroundColor: '#111827',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: 'center',
    marginBottom: 8,
  },
  evidencePhotoRefText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  evidencePhotoDescription: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  cameraIcon: {
    width: 28,
    height: 28,
    tintColor: '#3B82F6',
    marginBottom: 6,
  },
  addPhotoText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
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