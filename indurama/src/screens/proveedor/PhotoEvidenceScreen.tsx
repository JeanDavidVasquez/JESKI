import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Text,
  useWindowDimensions,
  Platform,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { db } from '../../services/firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import {
  takePhoto,
  pickFromGallery,
  pickDocument,
  uploadSupplierEvidence,
} from '../../services/imagePickerService';

// Tipos para las categorías de evidencia
interface EvidenceCategory {
  id: string;
  title: string;
  description: string;
  photosCount: number;
  totalPhotos: number;
  status: 'pending' | 'completed';
}

// Props para la pantalla
interface PhotoEvidenceScreenProps {
  onNavigateBack?: () => void;
  onComplete?: () => void;
  supplierId?: string;
}

/**
 * Pantalla de Evidencias Fotográficas para el rol de Proveedor
 */
export const PhotoEvidenceScreen: React.FC<PhotoEvidenceScreenProps> = ({
  onNavigateBack,
  onComplete,
  supplierId: supplierIdProp
}) => {
  const { user } = useAuth();
  const supplierId = supplierIdProp || user?.id;
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [showEpiModal, setShowEpiModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeUploadCategory, setActiveUploadCategory] = useState<string | null>(null);

  // Store photos per category
  const [categoryPhotos, setCategoryPhotos] = useState<Record<string, string[]>>({
    '1': [],
    '2': [],
    '3': [],
  });

  const [categories, setCategories] = useState<EvidenceCategory[]>([
    {
      id: '1',
      title: 'Flujo de Producción',
      description: 'Fotos de línea de producción y muestras',
      photosCount: 0,
      totalPhotos: 1,
      status: 'pending'
    },
    {
      id: '2',
      title: 'Instalaciones de la Empresa',
      description: 'Fachada, almacenes, oficinas',
      photosCount: 0,
      totalPhotos: 1,
      status: 'pending'
    },
    {
      id: '3',
      title: 'Puntos de control de Calidad',
      description: 'Estaciones de inspección y control',
      photosCount: 0,
      totalPhotos: 1,
      status: 'pending'
    }
  ]);

  // Load saved evidence data
  useEffect(() => {
    const loadEvidenceData = async () => {
      if (!supplierId) return;

      try {
        const evalRef = doc(db, 'supplier_evaluations', supplierId);
        const evalDoc = await getDoc(evalRef);

        if (evalDoc.exists()) {
          const data = evalDoc.data();

          if (data.photoEvidenceByCategory) {
            setCategoryPhotos(data.photoEvidenceByCategory);
            setCategories(prev => prev.map(cat => {
              const photos = data.photoEvidenceByCategory[cat.id] || [];
              return {
                ...cat,
                photosCount: photos.length,
                status: photos.length > 0 ? 'completed' : 'pending'
              };
            }));
          } else if (data.photoEvidence && data.photoEvidence.length > 0) {
            setCategories(prev => prev.map(cat => ({
              ...cat,
              status: 'completed',
              photosCount: 1
            })));
          }
        }
      } catch (error) {
        console.error('Error loading evidence:', error);
      }
    };

    loadEvidenceData();
  }, [supplierId]);

  const handleGoBack = () => {
    if (onNavigateBack) onNavigateBack();
  };

  const handleEpiModalClose = () => {
    setShowEpiModal(false);
    if (onComplete) onComplete();
  };

  const handleAccept = async () => {
    if (!supplierId) {
      Alert.alert('Error', 'No se pudo identificar el usuario');
      return;
    }

    const categoryIds = ['1', '2', '3'];
    const missingCategories = categoryIds.filter(
      catId => !categoryPhotos[catId] || categoryPhotos[catId].length === 0
    );

    if (missingCategories.length > 0) {
      Alert.alert(
        'Fotos Requeridas',
        'Debes subir al menos una foto para cada categoría antes de continuar.'
      );
      return;
    }

    try {
      const allPhotos = Object.values(categoryPhotos).flat();
      const evalRef = doc(db, 'supplier_evaluations', supplierId);

      await setDoc(evalRef, {
        photoEvidence: allPhotos,
        photoEvidenceByCategory: categoryPhotos,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setShowEpiModal(true);
    } catch (error) {
      console.error('Error saving evidence:', error);
      Alert.alert('Error', 'No se pudieron guardar las evidencias');
    }
  };

  const handleUploadPhoto = (categoryId: string) => {
    if (!supplierId) {
      Alert.alert('Error', 'Debes iniciar sesión');
      return;
    }
    setActiveUploadCategory(categoryId);
    setShowUploadModal(true);
  };

  const performUpload = async (type: 'camera' | 'gallery' | 'document') => {
    if (!activeUploadCategory) return;
    const categoryId = activeUploadCategory;

    try {
      setUploading(true);
      let asset = null;
      if (type === 'camera') asset = await takePhoto();
      else if (type === 'gallery') asset = await pickFromGallery();
      else asset = await pickDocument(); // document picker

      if (asset && supplierId) {
        const downloadURL = await uploadSupplierEvidence(
          supplierId,
          'evidence',
          categoryId,
          asset.uri,
          asset.name
        );

        setCategoryPhotos(prev => ({
          ...prev,
          [categoryId]: [...(prev[categoryId] || []), downloadURL]
        }));

        setCategories(prev => prev.map(cat =>
          cat.id === categoryId
            ? { ...cat, photosCount: (cat.photosCount || 0) + 1, status: 'completed' }
            : cat
        ));

        Alert.alert('¡Éxito!', 'Archivo subido correctamente');
      }
    } catch (error) {
      console.error('Error uploading:', error);
      Alert.alert('Error', 'No se pudo subir el archivo');
    } finally {
      setUploading(false);
      setActiveUploadCategory(null);
    }
  };

  const handleRemovePhoto = (categoryId: string, photoUrl: string) => {
    Alert.alert(
      'Eliminar Foto',
      '¿Estás seguro de que deseas eliminar esta foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setCategoryPhotos(prev => ({
              ...prev,
              [categoryId]: prev[categoryId].filter(url => url !== photoUrl)
            }));
            setCategories(prev => prev.map(cat =>
              cat.id === categoryId
                ? {
                  ...cat,
                  photosCount: Math.max(0, (cat.photosCount || 0) - 1),
                  status: (cat.photosCount || 0) - 1 > 0 ? 'completed' : 'pending'
                }
                : cat
            ));
          }
        }
      ]
    );
  };

  const renderEvidenceCard = (category: EvidenceCategory, index: number) => {
    const isCompleted = category.status === 'completed';
    const photos = categoryPhotos[category.id] || [];
    const hasPhotos = photos.length > 0;

    return (
      <View key={category.id} style={[styles.evidenceCard, isMobile && styles.evidenceCardMobile]}>
        <View style={styles.cardHeader}>
          <View style={[styles.stepBadge, isCompleted && styles.stepBadgeCompleted]}>
            {isCompleted ? <Ionicons name="checkmark" size={14} color="#FFF" /> : <Text style={styles.stepBadgeText}>{index + 1}</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{category.title}</Text>
            <Text style={styles.cardDescription}>{category.description}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.miniUploadButton,
              isCompleted && styles.miniUploadButtonCompleted
            ]}
            onPress={() => handleUploadPhoto(category.id)}
          >
            <Ionicons name="add" size={20} color={isCompleted ? '#16A34A' : '#003E85'} />
          </TouchableOpacity>
        </View>

        {/* Separator */}
        <View style={styles.cardSeparator} />

        {/* Photos Preview Section */}
        <View style={styles.photosSection}>
          {hasPhotos ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photosScrollContent}
            >
              {photos.map((url, idx) => (
                <View key={idx} style={styles.photoThumbnailContainer}>
                  <Image source={{ uri: url }} style={styles.photoThumbnail} />
                  <TouchableOpacity
                    style={styles.removeThumbnailButton}
                    onPress={() => handleRemovePhoto(category.id, url)}
                  >
                    <Ionicons name="close-circle" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyPhotosState}>
              <Ionicons name="images-outline" size={24} color="#CBD5E1" />
              <Text style={styles.emptyPhotosText}>No hay fotos subidas</Text>
            </View>
          )}
        </View>

        {/* Footer Info */}
        <View style={styles.cardFooter}>
          <Text style={styles.photoCountText}>
            {photos.length} {photos.length === 1 ? 'archivo' : 'archivos'}
          </Text>
          {hasPhotos && (
            <TouchableOpacity onPress={() => {
              setSelectedCategory(category.id);
              setShowPhotosModal(true);
            }}>
              <Text style={styles.viewAllText}>Ver Detalle</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.fullWidthHeader}>
        <View style={styles.headerContentContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Evidencias Fotográficas</Text>
            <Text style={styles.headerSubtitle}>
              {categories.filter(c => c.status === 'completed').length} de {categories.length} completadas
            </Text>
          </View>
          <View style={styles.logoContainer}>
            <Image source={require('../../../assets/icono_indurama.png')} style={styles.logoImage} resizeMode="contain" />
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1, width: '100%', alignItems: 'center' }}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.screenDescription}>
            Por favor, sube las fotografías requeridas para cada categoría.{"\n"}
            Asegúrate de que sean claras y legibles.
          </Text>

          <View style={styles.gridContainer}>
            {categories.map((category, index) => renderEvidenceCard(category, index))}
          </View>
        </ScrollView>
      </View>

      {/* Footer */}
      <View style={styles.fullWidthFooter}>
        <View style={styles.footerContentContainer}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={handleAccept}
          >
            <Text style={styles.acceptButtonText}>Completar Evaluación</Text>
            <Ionicons name="checkmark-circle" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Modals */}
      <Modal visible={showEpiModal} transparent animationType="fade" onRequestClose={() => { }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Ionicons name="checkmark-circle" size={60} color="#22C55E" style={{ marginBottom: 16 }} />
            <Text style={styles.modalTitle}>¡Excelente!</Text>
            <Text style={styles.modalMessage}>
              Has completado el registro de evidencias exitosamente.
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleEpiModalClose}>
              <Text style={styles.modalButtonText}>Finalizar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showUploadModal} transparent animationType="fade" onRequestClose={() => setShowUploadModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowUploadModal(false)}>
          <TouchableOpacity activeOpacity={1} style={{ alignItems: 'center' }}>
            <View style={styles.uploadModalContainer}>
              <Text style={styles.uploadModalTitle}>Añadir Evidencia</Text>
              <TouchableOpacity style={styles.uploadOptionButton} onPress={() => { setShowUploadModal(false); performUpload('camera'); }}>
                <Text style={styles.uploadOptionText}>📷 Tomar Foto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadOptionButton} onPress={() => { setShowUploadModal(false); performUpload('gallery'); }}>
                <Text style={styles.uploadOptionText}>🖼️ Galería</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadOptionButton} onPress={() => { setShowUploadModal(false); performUpload('document'); }}>
                <Text style={styles.uploadOptionText}>📄 Documento</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadCancelButton} onPress={() => setShowUploadModal(false)}>
                <Text style={styles.uploadCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Full Screen Gallery Modal */}
      <Modal visible={showPhotosModal} transparent animationType="slide" onRequestClose={() => setShowPhotosModal(false)}>
        <View style={styles.fullScreenModal}>
          <View style={styles.fullScreenModalHeader}>
            <Text style={styles.fullScreenModalTitle}>Galería de Evidencias</Text>
            <TouchableOpacity onPress={() => setShowPhotosModal(false)} style={styles.closeModalButton}>
              <Ionicons name="close" size={24} color="#1E293B" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1, padding: 20 }}>
            {selectedCategory && categoryPhotos[selectedCategory]?.map((url, idx) => (
              <View key={idx} style={styles.largePhotoCard}>
                <Image source={{ uri: url }} style={styles.largePhotoImage} resizeMode="contain" />
                <View style={styles.largePhotoFooter}>
                  <Text style={styles.photoIndexText}>Imagen {idx + 1}</Text>
                  <TouchableOpacity
                    style={styles.deleteLargeButton}
                    onPress={() => handleRemovePhoto(selectedCategory, url)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    <Text style={{ color: '#EF4444', fontWeight: '600', marginLeft: 4 }}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    maxWidth: 1024,
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
  headerSubtitle: {
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
  logoContainer: {
    width: 40,
    height: 40,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 32,
    height: 32,
    tintColor: '#FFF'
  },
  content: {
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 120, // Space for footer
    paddingHorizontal: 20,
  },
  screenDescription: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 600,
    marginBottom: 32,
    lineHeight: 22,
  },
  gridContainer: {
    width: '100%',
    maxWidth: 1024,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'center',
  },
  evidenceCard: {
    width: '31%', // Three columns on desktop
    minWidth: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 },
      android: { elevation: 3 },
      web: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 6 },
    }),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  evidenceCardMobile: {
    width: '100%', // Full width on mobile
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  stepBadgeCompleted: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 24,
  },
  cardDescription: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  miniUploadButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  miniUploadButtonCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  cardSeparator: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 16,
  },
  photosSection: {
    minHeight: 80,
    justifyContent: 'center',
  },
  photosScrollContent: {
    gap: 12,
    paddingRight: 10,
  },
  photoThumbnailContainer: {
    position: 'relative',
    width: 70,
    height: 70,
  },
  photoThumbnail: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  removeThumbnailButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFF',
    borderRadius: 10,
  },
  emptyPhotosState: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 70,
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderStyle: 'dashed',
  },
  emptyPhotosText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  photoCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#003E85',
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
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: -4 } },
      web: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 20 },
      android: { elevation: 10 },
    }),
  },
  footerContentContainer: {
    width: '100%',
    maxWidth: 700,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  acceptButton: {
    backgroundColor: '#003E85',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
    gap: 10,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 5 },
      web: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 25 }
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#003E85',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  uploadModalContainer: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  uploadModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 20,
  },
  uploadOptionButton: {
    width: '100%',
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  uploadOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  uploadCancelButton: {
    marginTop: 8,
    paddingVertical: 10,
  },
  uploadCancelText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },

  // Full Screen Gallery
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  fullScreenModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  fullScreenModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeModalButton: {
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  largePhotoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  largePhotoImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#F1F5F9',
  },
  largePhotoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  photoIndexText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  deleteLargeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
});