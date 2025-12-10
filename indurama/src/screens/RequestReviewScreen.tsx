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

// Tipos para los datos de la solicitud
interface RequestReviewData {
  id: string;
  code: string;
  title: string;
  solicitante: {
    nombre: string;
    departamento: string;
  };
  fechaSolicitud: string;
  fechaLimite: string;
  tipoProyecto: string;
  claseBusqueda: string;
  descripcion: string;
  proveedorSugerido?: {
    nombre: string;
    razon: string;
  };
  documentos: {
    id: string;
    nombre: string;
    tamaño: string;
  }[];
  stepProgress: {
    current: number;
    total: number;
    steps: string[];
  };
}

// Props para la pantalla
interface RequestReviewScreenProps {
  requestId?: string;
  onNavigateBack?: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateToProveedores?: () => void;
  onNavigateToSupplierDetail?: (supplierId: string) => void;
  onApprove?: (requestId: string, comment?: string) => void;
  onReject?: (requestId: string, comment: string) => void;
}

/**
 * Pantalla de Revisión de Solicitud para el rol de Gestor
 */
export const RequestReviewScreen: React.FC<RequestReviewScreenProps> = ({
  requestId = 'SOL-2025-042',
  onNavigateBack,
  onNavigateToDashboard,
  onNavigateToProveedores,
  onNavigateToSupplierDetail,
  onApprove,
  onReject
}) => {
  const [comment, setComment] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  // Datos de ejemplo basados en la imagen
  const [requestData] = useState<RequestReviewData>({
    id: requestId,
    code: 'SOL-2025-042',
    title: 'IDENTIFICAR NECESIDAD',
    solicitante: {
      nombre: 'Juan Pérez',
      departamento: 'Producción'
    },
    fechaSolicitud: '15 Ene 2025',
    fechaLimite: '30 Ene 2025',
    tipoProyecto: 'Presupuesto aprobado / SCMP',
    claseBusqueda: 'Materia Prima',
    descripcion: 'Se requiere materia prima de alta calidad para la línea de producción A. Cantidad estimada: 55000 test(s). Especificaciones técnicas detalladas en los documentos adjuntos. Se requiere que el proveedor presente certificaciones ISO 9001 y capacidad de entrega inmediata.',
    proveedorSugerido: {
      nombre: 'TecnoPartes S.A.',
      razon: 'Proveedor actual con buen historial de entregas'
    },
    documentos: [
      {
        id: '1',
        nombre: 'Pliego_Tecnico.pdf',
        tamaño: '2.3 MB'
      },
      {
        id: '2',
        nombre: 'Procesos.pdf',
        tamaño: '1.1 MB'
      },
      {
        id: '3',
        nombre: 'Especificaciones_detalladas.docx',
        tamaño: '1.1 MB'
      }
    ],
    stepProgress: {
      current: 1,
      total: 3,
      steps: ['Identificar Necesidad', 'Búsqueda', 'Cotización']
    }
  });

  const handleNavigateBack = () => {
    if (onNavigateBack) {
      onNavigateBack();
    }
  };

  const handleNavigateToDashboard = () => {
    if (onNavigateToDashboard) {
      onNavigateToDashboard();
    }
  };

  const handleNavigateToProveedores = () => {
    if (onNavigateToProveedores) {
      onNavigateToProveedores();
    }
  };

  const handleApprove = () => {
    setShowApprovalModal(true);
  };

  const confirmApprove = () => {
    setShowApprovalModal(false);
    if (onNavigateToProveedores) {
      onNavigateToProveedores();
    }
  };

  const handleReject = () => {
    if (onReject && comment.trim()) {
      onReject(requestData.id, comment);
    }
  };

  const renderStepProgress = () => {
    return (
      <View style={styles.progressContainer}>
        {requestData.stepProgress.steps.map((step, index) => (
          <View key={index} style={styles.stepContainer}>
            <View style={[
              styles.stepCircle,
              index < requestData.stepProgress.current
                ? styles.stepCompleted
                : index === requestData.stepProgress.current - 1
                  ? styles.stepActive
                  : styles.stepPending
            ]}>
              <Text style={[
                styles.stepNumber,
                index < requestData.stepProgress.current
                  ? styles.stepNumberCompleted
                  : index === requestData.stepProgress.current - 1
                    ? styles.stepNumberActive
                    : styles.stepNumberPending
              ]}>
                {index + 1}
              </Text>
            </View>
            <Text style={[
              styles.stepLabel,
              index === requestData.stepProgress.current - 1 && styles.stepLabelActive
            ]}>
              {step}
            </Text>
            {index < requestData.stepProgress.steps.length - 1 && (
              <View style={styles.stepConnector} />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderDocumentItem = (documento: typeof requestData.documentos[0]) => {
    return (
      <View key={documento.id} style={styles.documentItem}>
        <View style={styles.documentInfo}>
          <Image
            source={require('../../assets/icons/download.png')}
            style={styles.documentIcon}
            resizeMode="contain"
          />
          <View style={styles.documentDetails}>
            <Text style={styles.documentName}>{documento.nombre}</Text>
            <Text style={styles.documentSize}>{documento.tamaño}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.downloadButton}>
          <Image
            source={require('../../assets/icons/download.png')}
            style={styles.downloadIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleNavigateBack}
          >
            <Image
              source={require('../../assets/icons/arrow-left.png')}
              style={styles.backIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <Text style={styles.requestCode}>{requestData.code}</Text>

          <Image
            source={require('../../assets/icono_indurama.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>{requestData.title}</Text>
        <Text style={styles.subtitle}>Materia prima para línea de producción A</Text>

        {/* Progress Steps */}
        {renderStepProgress()}

        {/* Información del Solicitante */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Solicitante</Text>

          <View style={styles.infoCard}>
            <View style={styles.userInfoHeader}>
              <Image
                source={require('../../assets/icons/profile.png')}
                style={styles.userIcon}
                resizeMode="contain"
              />
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{requestData.solicitante.nombre}</Text>
                <Text style={styles.userDepartment}>{requestData.solicitante.departamento}</Text>
              </View>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Fecha de Solicitud:</Text>
                <Text style={styles.infoValue}>{requestData.fechaSolicitud}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Fecha Límite:</Text>
                <Text style={[styles.infoValue, styles.fechaLimite]}>{requestData.fechaLimite}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tipo de Proyecto:</Text>
                <Text style={styles.infoValue}>{requestData.tipoProyecto}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Clase de Búsqueda:</Text>
                <Text style={styles.infoValue}>{requestData.claseBusqueda}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Detalle de la Necesidad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalle de la Necesidad</Text>
          <View style={styles.infoCard}>
            <Text style={styles.description}>{requestData.descripcion}</Text>
          </View>
        </View>

        {/* Sugerencia de Proveedor */}
        {requestData.proveedorSugerido && (
          <View style={styles.section}>
            <View style={styles.suggestionHeader}>
              <Image
                source={require('../../assets/icons/comment.png')}
                style={styles.suggestionIcon}
                resizeMode="contain"
              />
              <Text style={styles.sectionTitle}>Sugerencia de Proveedor</Text>
            </View>

            <View style={styles.providerCard}>
              <View style={styles.providerHeader}>
                <View style={styles.providerAvatar}>
                  <Text style={styles.providerInitial}>T</Text>
                </View>
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>{requestData.proveedorSugerido.nombre}</Text>
                  <Text style={styles.providerReason}>{requestData.proveedorSugerido.razon}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.providerInfoButton}
                onPress={() => onNavigateToSupplierDetail && onNavigateToSupplierDetail('tornillos-sa')}
              >
                <Text style={styles.providerInfoButtonText}>Ver información del Proveedor</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Documentos Técnicos Adjuntos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documentos Técnicos Adjuntos</Text>

          <View style={styles.documentsContainer}>
            <Text style={styles.documentsSubtitle}>Documentos Adjuntos</Text>
            {requestData.documentos.map(documento => renderDocumentItem(documento))}
          </View>
        </View>



        {/* Agregar Comentario */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agregar Comentario</Text>
          <Text style={styles.commentInstruction}>
            El solicitante recibirá una notificación y podrá ver su comentario en la trazabilidad de la solicitud.
          </Text>

          <View style={styles.commentContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Escriba sus observaciones o solicitudes adicionales..."
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={6}
              placeholderTextColor="#9CA3AF"
            />

            <TouchableOpacity style={styles.sendCommentButton}>
              <Image
                source={require('../../assets/icons/send.png')}
                style={styles.sendIcon}
                resizeMode="contain"
              />
              <Text style={styles.sendCommentText}>Enviar Comentario</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Espacio inferior */}
        <View style={styles.bottomSpacing} />

      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => onReject && onReject(requestData.id, comment)}
        >
          <Image
            source={require('../../assets/icons/close.png')}
            style={styles.rejectIcon}
            resizeMode="contain"
          />
          <Text style={styles.rejectButtonText}>Rechazar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.validateButton}
          onPress={handleApprove}
        >
          <Image
            source={require('../../assets/icons/check.png')}
            style={styles.validateIcon}
            resizeMode="contain"
          />
          <Text style={styles.validateButtonText}>Validar y Buscar</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de Confirmación */}
      <Modal
        visible={showApprovalModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowApprovalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>¿Aprobar Solicitud?</Text>
            <Text style={styles.modalMessage}>
              Esta acción aprobará la solicitud {requestData.code} y permitirá continuar con el proceso de búsqueda de proveedores y cotización
            </Text>

            <TouchableOpacity
              style={styles.modalApproveButton}
              onPress={confirmApprove}
            >
              <Text style={styles.modalApproveButtonText}>Aprobar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowApprovalModal(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancelar</Text>
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
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  backButton: {
    padding: 4,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#1F2937',
  },
  requestCode: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  logoImage: {
    width: 48,
    height: 48,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    backgroundColor: '#F9FAFB',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 28,
    paddingHorizontal: 10,
    paddingVertical: 16,
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  stepCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
  },
  stepActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  stepCompleted: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  stepPending: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepNumberCompleted: {
    color: '#1D4ED8',
  },
  stepNumberPending: {
    color: '#9CA3AF',
  },
  stepLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 14,
    maxWidth: 80,
  },
  stepLabelActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  stepConnector: {
    position: 'absolute',
    top: 22,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: '#E5E7EB',
    zIndex: -1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 14,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  userInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userIcon: {
    width: 40,
    height: 40,
    tintColor: '#003E85',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 2,
  },
  userDepartment: {
    fontSize: 14,
    color: '#666666',
  },
  infoGrid: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  fechaLimite: {
    color: '#FF4444',
  },
  description: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestionIcon: {
    width: 20,
    height: 20,
    tintColor: '#003E85',
    marginRight: 8,
  },
  providerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  providerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#003E85',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  providerInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 2,
  },
  providerReason: {
    fontSize: 12,
    color: '#666666',
  },
  providerInfoButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  providerInfoButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  documentsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  documentsSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentIcon: {
    width: 24,
    height: 24,
    tintColor: '#003E85',
    marginRight: 12,
  },
  documentDetails: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 2,
  },
  documentSize: {
    fontSize: 12,
    color: '#666666',
  },
  downloadButton: {
    padding: 8,
  },
  downloadIcon: {
    width: 20,
    height: 20,
    tintColor: '#666666',
  },

  commentInstruction: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 14,
    lineHeight: 18,
  },
  commentContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    color: '#1F2937',
    textAlignVertical: 'top',
    minHeight: 120,
    marginBottom: 14,
    backgroundColor: '#F9FAFB',
  },
  sendCommentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4B5563',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  sendIcon: {
    width: 18,
    height: 18,
    tintColor: '#FFFFFF',
    marginRight: 8,
  },
  sendCommentText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomSpacing: {
    height: 100,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    ...Platform.select({
      ios: {
        paddingBottom: 34,
      },
    }),
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#EF4444',
    flex: 1,
  },
  rejectIcon: {
    width: 20,
    height: 20,
    tintColor: '#EF4444',
    marginRight: 8,
  },
  rejectButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  validateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D4ED8',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flex: 1,
  },
  validateIcon: {
    width: 20,
    height: 20,
    tintColor: '#FFFFFF',
    marginRight: 8,
  },
  validateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
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
    paddingVertical: 32,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  modalApproveButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalApproveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalCancelButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
});