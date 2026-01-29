import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Dimensions,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Linking
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../hooks/useAuth';
import { getRequestById, updateRequestStatus, getRelativeTime } from '../../services/requestService';
import { Request, RequestStatus, RequestPriority, User } from '../../types';
import { RequestProcessStepper } from '../../components/RequestProcessStepper';
import { ProcessHeader } from '../../components/ProcessHeader';
import { useResponsive, BREAKPOINTS } from '../../styles/responsive';
import { Ionicons } from '@expo/vector-icons';


interface RequestReviewScreenProps {
  requestId?: string;
  onNavigateBack?: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateToProveedores?: (requestId: string) => void;
  onNavigateToSupplierDetail?: (supplierId: string) => void;
  onApprove?: (requestId: string, comment?: string) => void;
  onReject?: (requestId: string, comment: string) => void;
  currentUser?: User | null; // Added prop
}

const { width } = Dimensions.get('window');
// const isMobile = width < 768;

export const RequestReviewScreen: React.FC<RequestReviewScreenProps> = ({
  requestId,
  onNavigateBack,
  onNavigateToDashboard,
  onNavigateToProveedores,
  onNavigateToSupplierDetail,
  onApprove,
  onReject,
  currentUser
}) => {
  const { user: contextUser, isLoading: authLoading } = useAuth();
  // Fallback to prop user if context user is missing (Test Mode support)
  const user = contextUser || currentUser;
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const { isDesktopView } = useResponsive();

  // UI States
  const [comment, setComment] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRectificationModal, setShowRectificationModal] = useState(false);

  const loadRequest = useCallback(async () => {
    if (!requestId) return;
    try {
      setLoading(true);
      const data = await getRequestById(requestId);
      setRequest(data);
    } catch (error) {
      console.error('Error loading request:', error);
      Alert.alert('Error', 'No se pudo cargar la solicitud.');
      if (onNavigateBack) onNavigateBack();
    } finally {
      setLoading(false);
    }
  }, [requestId, onNavigateBack]);

  useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  const handleApprove = async () => {
    if (!request) return;
    if (!user) { Alert.alert('Error', 'Sesión no válida.'); return; }

    try {
      setActionLoading(true);
      // Logic: If pending, change to IN_PROGRESS (Approved/In Review)
      await updateRequestStatus(request.id, RequestStatus.IN_PROGRESS, user.id);

      setShowApprovalModal(false);

      // Auto-navigate without blocking alert
      if (Platform.OS === 'web') {
        // window.alert('Solicitud validada. Redirigiendo a búsqueda de proveedores...');
      }
      onNavigateToProveedores?.(request.id);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!request || !user) return;
    if (!comment.trim()) {
      Alert.alert('Atención', 'Por favor ingrese un motivo para el rechazo en el campo de comentarios.');
      return;
    }

    try {
      setActionLoading(true);
      await updateRequestStatus(request.id, RequestStatus.REJECTED, user.id);
      Alert.alert('Solicitud Rechazada', 'La solicitud ha sido rechazada.', [
        { text: 'OK', onPress: onNavigateBack }
      ]);
    } catch (error) {
      console.error('Error rejecting request:', error);
      Alert.alert('Error', 'No se pudo rechazar la solicitud.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRectification = async () => {
    if (!comment.trim()) {
      Alert.alert('Atención', 'Para solicitar corrección, debe explicar qué se debe corregir en el comentario.');
      return;
    }
    setShowRectificationModal(true);
  };

  const confirmRectification = async () => {
    if (!request) return;
    if (!user) { Alert.alert('Error', 'Sesión no válida.'); return; }

    try {
      setActionLoading(true);
      // @ts-ignore: RECTIFICATION_REQUIRED is new
      await updateRequestStatus(request.id, RequestStatus.RECTIFICATION_REQUIRED, user.id, comment); // Pass comment

      // Update local state immediately
      setRequest({
        ...request,
        status: RequestStatus.RECTIFICATION_REQUIRED,
        rectificationComment: comment
      });

      setShowRectificationModal(false);
      Alert.alert('Corrección Solicitada', 'Se ha notificado al solicitante. La solicitud quedará en espera de corrección.', [
        { text: 'OK', onPress: onNavigateBack }
      ]);
    } catch (error) {
      console.error('Error requesting rectification:', error);
      Alert.alert('Error', 'No se pudo enviar la solicitud de corrección.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDocument = async (url: string) => {
    console.log('Attempting to open document URL:', url);

    // Check for blob URL (invalid for other users)
    if (typeof url === 'string' && url.startsWith('blob:')) {
      const msg = 'Este documento tiene un enlace local caducado. El solicitante debe editar la solicitud y volver a subir el archivo.';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Archivo no disponible', msg);
      }
      return;
    }

    try {
      if (Platform.OS === 'web') {
        // On Web, open immediately to avoid popup blockers
        window.open(url, '_blank');
      } else {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert('Error', 'No se puede abrir este archivo');
        }
      }
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert('Error', 'No se pudo abrir el archivo');
    }
  };



  if (loading || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#003E85" />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.errorContainer}>
        <Text>No se encontró la solicitud.</Text>
        <TouchableOpacity onPress={onNavigateBack} style={{ marginTop: 20 }}>
          <Text style={{ color: '#003E85' }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <StatusBar style="dark" />
      <ProcessHeader
        title={request.code || 'SOLICITUD'}
        onBack={onNavigateBack || (() => { })}
      />

      <ScrollView contentContainerStyle={[
        styles.content,
        isDesktopView && { maxWidth: 1200, alignSelf: 'center', width: '100%' }
      ]}>

        <Text style={styles.mainTitle}>{request.title || 'IDENTIFICAR NECESIDAD'}</Text>
        <Text style={styles.subTitle}>Materia prima para línea de producción</Text>

        <RequestProcessStepper currentStep={1} />

        {/* Información del Solicitante */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Información del Solicitante</Text>
          <View style={styles.userInfoRow}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{request.userName ? request.userName.charAt(0) : 'U'}</Text>
            </View>
            <View>
              <Text style={styles.userName}>{request.userName}</Text>
              <Text style={styles.userRole}>
                {request.companyIdentifier ? `${request.companyIdentifier} · ` : ''}
                {request.department}
              </Text>
            </View>
          </View>

          <View style={isDesktopView ? { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -10 } : {}}>
            <View style={isDesktopView ? { width: '50%', paddingHorizontal: 10 } : {}}>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Fecha de Solicitud:</Text><Text style={styles.infoValue}>{getRelativeTime(request.createdAt)}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Fecha Límite:</Text><Text style={[styles.infoValue, { color: '#FF4444' }]}>{request.dueDate ? new Date(request.dueDate).toLocaleDateString() : 'N/A'}</Text></View>
            </View>
            <View style={isDesktopView ? { width: '50%', paddingHorizontal: 10 } : {}}>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Tipo de Proyecto:</Text><Text style={styles.infoValue}>{request.tipoProyecto || 'Presupuesto Aprobado'}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Clase de Búsqueda:</Text><Text style={styles.infoValue}>{request.claseBusqueda || 'Materia Prima'}</Text></View>
            </View>
          </View>
        </View>

        {/* Detalle de la Necesidad */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detalle de la Necesidad</Text>
          <Text style={styles.descriptionText}>{request.description}</Text>
        </View>

        {/* Supplier Criteria - NEW */}
        {(request.requiredBusinessType || request.requiredCategories?.length ||
          request.requiredTags?.length || request.customRequiredTags?.length) && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Criterios de Búsqueda de Proveedor</Text>

              {request.requiredBusinessType && request.requiredBusinessType !== 'cualquiera' && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tipo:</Text>
                  <Text style={styles.infoValue}>
                    {request.requiredBusinessType.charAt(0).toUpperCase() + request.requiredBusinessType.slice(1)}
                  </Text>
                </View>
              )}

              {request.requiredCategories && request.requiredCategories.length > 0 && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={styles.infoLabel}>Categorías:</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {request.requiredCategories.map((cat, idx) => (
                      <View key={idx} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#D1D5DB' }}>
                        <Text style={{ fontSize: 12, color: '#4B5563' }}>{cat.replace(/_/g, ' ')}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {request.requiredTags && request.requiredTags.length > 0 && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={styles.infoLabel}>Tags:</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {request.requiredTags.map((tag, idx) => (
                      <View key={idx} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: '#DBEAFE', borderWidth: 1, borderColor: '#3B82F6' }}>
                        <Text style={{ fontSize: 12, color: '#1E40AF' }}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {request.customRequiredTags && request.customRequiredTags.length > 0 && (
                <View>
                  <Text style={styles.infoLabel}>Custom:</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {request.customRequiredTags.map((tag, idx) => (
                      <View key={idx} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FCD34D' }}>
                        <Text style={{ fontSize: 12, color: '#92400E' }}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

        {/* Sugerencia de Proveedor */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
            <Image source={require('../../../assets/icons/comment.png')} style={{ width: 22, height: 22, marginRight: 10, tintColor: '#003E85' }} resizeMode="contain" />
            <Text style={[styles.cardTitle, { marginBottom: 0 }]}>Sugerencia de Proveedor</Text>
          </View>

          {request.supplierSuggestion ? (
            <View
              style={[
                isDesktopView ? { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } : {},
                { width: '100%' }
              ]}
            >
              <View style={styles.supplierRow}>
                <View style={styles.supplierAvatar}><Text style={styles.supplierAvatarText}>{request.supplierSuggestion.charAt(0)}</Text></View>
                <View>
                  <Text style={styles.supplierName}>{request.supplierSuggestion}</Text>
                  <Text style={styles.supplierSub}>Proveedor sugerido</Text>
                </View>
              </View>
            </View>
          ) : (
            <Text style={{ color: '#666', fontStyle: 'italic', marginLeft: 32 }}>No hay sugerencia de proveedor.</Text>
          )}
        </View>

        {/* Documentos */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Documentos Técnicos Adjuntos</Text>
          <View style={styles.grayBox}>
            <Text style={{ fontWeight: 'bold', marginBottom: 10, color: '#555' }}>Documentos Adjuntos</Text>
            {/* @ts-ignore: documents property issue */}
            {request.documents && request.documents.length > 0 ? (
              // @ts-ignore
              // @ts-ignore
              request.documents.map((doc: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={styles.docItem}
                  onPress={() => handleOpenDocument(doc.url)}
                >
                  <View style={styles.docIconContainer}><Image source={require('../../../assets/icons/download.png')} style={{ width: 20, height: 20, tintColor: '#003E85' }} resizeMode="contain" /></View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={{ fontWeight: 'bold', color: '#333' }}>{doc.name || `Documento ${index + 1}`}</Text>
                    <Text style={{ fontSize: 12, color: '#999' }}>Click para abrir</Text>
                  </View>
                  <Image source={require('../../../assets/icons/download.png')} style={{ width: 20, height: 20 }} resizeMode="contain" />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={{ color: '#999' }}>No hay documentos.</Text>
            )}
          </View>
        </View>

        {/* Agregar Comentario - SOLO EN FASE IDENTIFICAR (PENDING) Y SI NO HAY CORRECCION */}
        {request.status === RequestStatus.PENDING && !request.rectificationComment && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Agregar Comentario</Text>
            <Text style={styles.commentInstruction}>
              El solicitante recibirá una notificación y podrá ver su comentario en la trazabilidad de la solicitud.
            </Text>

            <View style={styles.commentBox}>
              <TextInput
                style={styles.commentInput}
                placeholder="Escriba sus observaciones o solicitudes adicionales..."
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TouchableOpacity style={styles.sendCommentButton} onPress={handleRequestRectification} disabled={actionLoading}>
              <Image source={require('../../../assets/icons/send.png')} style={{ width: 16, height: 16, tintColor: '#FFF', marginRight: 8 }} />
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Solicitar Corrección</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Mostrar Corrección Solicitada - SI EXISTE UN COMENTARIO */}
        {request.rectificationComment && (
          <View style={[styles.card, { backgroundColor: '#FFF3E0', borderColor: '#FFE0B2', borderWidth: 1 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Image source={require('../../../assets/icons/bell.png')} style={{ width: 20, height: 20, tintColor: '#F57C00', marginRight: 10 }} resizeMode="contain" />
              <Text style={[styles.cardTitle, { color: '#E65100', marginBottom: 0 }]}>Corrección Solicitada</Text>
            </View>
            <Text style={{ color: '#5D4037', marginBottom: 10 }}>Usted ha solicitado la siguiente corrección:</Text>
            <View style={{ backgroundColor: '#FFF', padding: 10, borderRadius: 5, borderLeftWidth: 3, borderLeftColor: '#F57C00' }}>
              <Text style={{ fontStyle: 'italic', color: '#333' }}>"{request.rectificationComment}"</Text>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacing} />

      </ScrollView>

      {/* Footer Actions - Only for PENDING */}
      {request.status === RequestStatus.PENDING && (
        <View style={styles.footerContainer}>
          <View style={styles.footerContent}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={handleReject}
              disabled={actionLoading}
            >
              <Image source={require('../../../assets/icons/close.png')} style={styles.rejectIcon} resizeMode="contain" />
              <Text style={styles.rejectButtonText}>Rechazar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.validateButton}
              onPress={() => setShowApprovalModal(true)}
              disabled={actionLoading}
            >
              <Image source={require('../../../assets/icons/check.png')} style={styles.validateIcon} resizeMode="contain" />
              <Text style={styles.validateButtonText}>Validar y Buscar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Footer Actions - For IN_PROGRESS (Already Approved) */}
      {request.status === RequestStatus.IN_PROGRESS && (
        <View style={styles.footerContainer}>
          <View style={styles.footerContent}>
            <TouchableOpacity
              style={[styles.validateButton, { flex: 1, backgroundColor: '#10B981' }]}
              onPress={() => onNavigateToProveedores?.(request.id)}
            >
              <Image source={require('../../../assets/icons/search.png')} style={styles.validateIcon} resizeMode="contain" />
              <Text style={styles.validateButtonText}>Continuar a Búsqueda de Proveedores</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* @ts-ignore: RECTIFICATION_REQUIRED is new */}
      {request.status === RequestStatus.RECTIFICATION_REQUIRED && (
        <View style={[styles.footerContainer, { backgroundColor: '#FFF3CD', borderTopColor: '#FFECB3' }]}>
          <View style={[styles.footerContent, { justifyContent: 'center' }]}>
            <Text style={{ color: '#856404', fontWeight: 'bold' }}>⚠️ Esperando corrección del solicitante...</Text>
          </View>
        </View>
      )}

      {/* Modal de Confirmación */}
      <Modal
        visible={showApprovalModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowApprovalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>¿Validar Solicitud?</Text>
            <Text style={styles.modalMessage}>
              Esta acción validará la solicitud y procederá a la fase de búsqueda de proveedores.
            </Text>

            <TouchableOpacity
              style={styles.modalApproveButton}
              onPress={handleApprove}
            >
              {actionLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalApproveButtonText}>Confirmar Validación</Text>}
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

      {/* Modal de Rectificación */}
      <Modal
        visible={showRectificationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRectificationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>¿Solicitar Corrección?</Text>
            <Text style={styles.modalMessage}>
              Esta acción devolverá la solicitud al solicitante para que realice los cambios indicados en el comentario.
            </Text>
            <Text style={[styles.modalMessage, { fontStyle: 'italic', color: '#555', marginTop: -10 }]}>
              "{comment}"
            </Text>

            <TouchableOpacity
              style={[styles.modalApproveButton, { backgroundColor: '#F59E0B' }]}
              onPress={confirmRectification}
            >
              {actionLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalApproveButtonText}>Solicitar Corrección</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowRectificationModal(false)}
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
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  // Header styles removed (using component)
  content: { padding: 20 },
  mainTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  subTitle: { fontSize: 14, color: '#666', marginBottom: 20 },

  stepsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  stepItem: { alignItems: 'center', width: 80 },
  stepCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#00BFFF', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', marginBottom: 5 },
  stepActive: { backgroundColor: '#E0F7FF' },
  stepNumber: { color: '#00BFFF', fontWeight: 'bold', fontSize: 16 },
  stepTextActive: { color: '#003E85' },
  stepLabel: { fontSize: 10, textAlign: 'center', color: '#666' },
  stepLabelActive: { color: '#003E85', fontWeight: 'bold' },
  stepLine: { height: 1, backgroundColor: '#00BFFF', flex: 1, marginTop: -20 },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 12, // More rounded
    padding: 24, // Wider padding
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003E85', // Brand color
    marginBottom: 20
  },

  userInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatarContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E0F7FF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#003E85' },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  userRole: { fontSize: 13, color: '#666' },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center', // Align center vertically
    marginBottom: 12,
    borderBottomWidth: 1, // Subtle separator
    borderBottomColor: '#F9FAFB',
    paddingBottom: 8
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    width: 160, // Fixed width for alignment 
    fontWeight: '600'
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1, // Take remaining space
    fontWeight: '500'
  },

  descriptionText: { fontSize: 15, color: '#374151', lineHeight: 24 },

  supplierRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  supplierAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0E0FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  supplierAvatarText: { fontSize: 18, fontWeight: 'bold', color: '#555' },
  supplierName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  supplierSub: { fontSize: 12, color: '#666' },
  viewSupplierButton: { backgroundColor: '#E0E7FF', paddingVertical: 10, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center', borderRadius: 8, flexDirection: 'row' },
  viewSupplierText: { color: '#003E85', fontWeight: 'bold', fontSize: 13 },

  grayBox: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 16 },
  docItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#BFDBFE' },
  docIconContainer: { width: 32, height: 32, backgroundColor: '#FFF', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },

  commentInstruction: { fontSize: 13, color: '#666', marginBottom: 12 },
  commentBox: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: '#FAFAFA' },
  commentInput: { minHeight: 80, textAlignVertical: 'top', fontSize: 14 },
  sendCommentButton: { backgroundColor: '#4B5563', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },


  bottomSpacing: { height: 100 },
  footerContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF',
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 10,
    zIndex: 100
  },
  footerContent: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-between',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 1200,
  },
  rejectButton: {
    flex: 0.48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EF4444',
    borderRadius: 10, paddingVertical: 14
  },
  rejectIcon: { width: 18, height: 18, tintColor: '#EF4444', marginRight: 8 },
  rejectButtonText: { color: '#EF4444', fontWeight: '700', fontSize: 15 },
  validateButton: {
    flex: 0.48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#003E85', borderRadius: 10, paddingVertical: 14,
    shadowColor: '#003E85', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
  },
  validateIcon: { width: 18, height: 18, tintColor: '#FFF', marginRight: 8 },
  validateButtonText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '80%', maxWidth: 500, padding: 30, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: '#111827' },
  modalMessage: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  modalApproveButton: { backgroundColor: '#003E85', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 10, marginBottom: 12, width: '100%', alignItems: 'center' },
  modalApproveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  modalCancelButton: { paddingVertical: 12 },
  modalCancelButtonText: { color: '#6B7280', fontWeight: '600' }
});