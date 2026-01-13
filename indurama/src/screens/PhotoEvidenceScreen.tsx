import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Text,
  Dimensions,
  Platform,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../hooks/useAuth';
import {
  takePhoto,
  pickFromGallery,
  pickMultipleImages,
  pickDocument,
  uploadSupplierEvidence,
} from '../services/imagePickerService';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

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
  supplierId?: string; // NEW: Accept supplierId as prop
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
  // Prioritize prop supplierId, then context user
  const supplierId = supplierIdProp || user?.id;
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
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../services/firebaseConfig');

        const evalRef = doc(db, 'supplier_evaluations', supplierId);
        const evalDoc = await getDoc(evalRef);

        if (evalDoc.exists()) {
          const data = evalDoc.data();

          // Load saved category photos if available
          if (data.photoEvidenceByCategory) {
            setCategoryPhotos(data.photoEvidenceByCategory);

            // Update categories with actual photo counts
            setCategories(prev => prev.map(cat => {
              const photos = data.photoEvidenceByCategory[cat.id] || [];
              return {
                ...cat,
                photosCount: photos.length,
                status: photos.length > 0 ? 'completed' : 'pending'
              };
            }));
          } else if (data.photoEvidence && data.photoEvidence.length > 0) {
            // Backward compatibility: if only old format exists
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
    if (onNavigateBack) {
      onNavigateBack();
    } else {
      console.log('Función de navegación de regreso no disponible');
    }
  };

  const handleEpiModalClose = () => {
    setShowEpiModal(false);
    if (onComplete) {
      onComplete();
    }
  };

  const handleAccept = async () => {
    console.log('=== DEBUG handleAccept START ===');
    console.log('User:', user);
    console.log('Supplier ID resolved:', supplierId);
    console.log('Category Photos:', categoryPhotos);

    if (!supplierId) {
      console.error('❌ Error: No supplier ID found');
      if (Platform.OS === 'web') {
        window.alert('Error: No se pudo identificar el usuario (ID no encontrado).');
      } else {
        Alert.alert('Error', 'No se pudo identificar el usuario');
      }
      return;
    }

    // Check if at least one photo uploaded per category using categoryPhotos state
    const categoryIds = ['1', '2', '3'];
    const missingCategories = categoryIds.filter(
      catId => !categoryPhotos[catId] || categoryPhotos[catId].length === 0
    );

    console.log('missingCategories:', missingCategories);

    if (missingCategories.length > 0) {
      Alert.alert(
        'Fotos Requeridas',
        'Debes subir al menos una foto para cada categoría antes de continuar.'
      );
      return;
    }

    try {
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../services/firebaseConfig');

      // Flatten all photos from all categories
      const allPhotos = Object.values(categoryPhotos).flat();

      const evalRef = doc(db, 'supplier_evaluations', supplierId);

      // Save real photo evidence URLs
      await setDoc(evalRef, {
        photoEvidence: allPhotos,
        photoEvidenceByCategory: categoryPhotos,
        updatedAt: serverTimestamp()
      }, { merge: true });

      console.log('✅ Evidencias guardadas correctamente');
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

    if (type === 'camera') {
      await handleTakePhoto(activeUploadCategory);
    } else if (type === 'gallery') {
      await handlePickFromGallery(activeUploadCategory);
    } else {
      await handlePickDocument(activeUploadCategory);
    }
    setActiveUploadCategory(null);
  };

  const handleTakePhoto = async (categoryId: string) => {
    try {
      setUploading(true);
      const photo = await takePhoto();
      if (!photo || !supplierId) return;

      const downloadURL = await uploadSupplierEvidence(
        supplierId,
        'evidence',
        categoryId,
        photo.uri,
        photo.name
      );

      // Add photo to category
      setCategoryPhotos(prev => ({
        ...prev,
        [categoryId]: [...(prev[categoryId] || []), downloadURL]
      }));

      // Update category photo count
      setCategories(prev => prev.map(cat =>
        cat.id === categoryId
          ? { ...cat, photosCount: (cat.photosCount || 0) + 1, status: 'completed' }
          : cat
      ));

      Alert.alert('¡Éxito!', 'Foto subida correctamente');
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'No se pudo subir la foto');
    } finally {
      setUploading(false);
    }
  };

  const handlePickFromGallery = async (categoryId: string) => {
    try {
      setUploading(true);
      const photo = await pickFromGallery();
      if (!photo || !supplierId) return;

      const downloadURL = await uploadSupplierEvidence(
        supplierId,
        'evidence',
        categoryId,
        photo.uri,
        photo.name
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

      Alert.alert('¡Éxito!', 'Foto subida correctamente');
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'No se pudo subir la foto');
    } finally {
      setUploading(false);
    }
  };

  const handlePickDocument = async (categoryId: string) => {
    try {
      setUploading(true);
      const doc = await pickDocument();
      if (!doc || !supplierId) return;

      const downloadURL = await uploadSupplierEvidence(
        supplierId,
        'evidence',
        categoryId,
        doc.uri,
        doc.name
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
    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert('Error', 'No se pudo subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleViewPhotos = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setShowPhotosModal(true);
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
            // Remove from categoryPhotos
            setCategoryPhotos(prev => ({
              ...prev,
              [categoryId]: prev[categoryId].filter(url => url !== photoUrl)
            }));

            // Update count
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

  const renderEvidenceCard = (category: EvidenceCategory) => {
    const isCompleted = category.status === 'completed';
    const hasPhotos = category.photosCount > 0;

    return (
      <View key={category.id} style={styles.evidenceCard}>
        <View style={styles.cardHeader}>
          <View style={[
            styles.statusIcon,
            { backgroundColor: isCompleted ? '#4CAF50' : '#E0E0E0' }
          ]}>
            {isCompleted ? (
              <Image
                source={require('../../assets/icons/check.png')}
                style={styles.statusIconImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.statusIconEmpty} />
            )}
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{category.title}</Text>
            <Text style={styles.cardDescription}>{category.description}</Text>

            <View style={styles.photoCount}>
              <Image
                source={require('../../assets/icons/document.png')}
                style={styles.photoCountIcon}
                resizeMode="contain"
              />
              <Text style={styles.photoCountText}>
                {category.photosCount} Fotos subidas
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.actionButton,
            hasPhotos ? styles.viewButton : styles.uploadButton
          ]}
          onPress={hasPhotos ?
            () => handleViewPhotos(category.id) :
            () => handleUploadPhoto(category.id)
          }
        >
          <Image
            source={require('../../assets/icons/plus.png')}
            style={[
              styles.actionButtonIcon,
              { tintColor: hasPhotos ? '#666666' : '#FFFFFF' }
            ]}
            resizeMode="contain"
          />
          <Text style={[
            styles.actionButtonText,
            hasPhotos ? styles.viewButtonText : styles.uploadButtonText
          ]}>
            {hasPhotos ? 'Ver/Agregar' : 'Subir'}
          </Text>
        </TouchableOpacity>
      </View>
    );
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
          <Text style={styles.headerTitle}>Evidencias Fotográficas</Text>
        </View>

        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/icono_indurama.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        <Text style={styles.subtitle}>Sube fotografías de evidencia</Text>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categorías de Evidencia</Text>
          <Text style={styles.sectionDescription}>
            Sube fotografías para cada categoría requerida
          </Text>
        </View>

        <View style={styles.categoriesContainer}>
          {categories.map(category => renderEvidenceCard(category))}
        </View>

      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.acceptButton,
            pressed && { opacity: 0.8 },
            Platform.OS === 'web' && { cursor: 'pointer' }
          ]}
          onPress={() => {
            console.log('🔴 Button pressed!');
            handleAccept();
          }}
        >
          <Text style={styles.acceptButtonText}>Aceptar</Text>
        </Pressable>
      </View>

      {/* Modal de Epi Enviada */}
      <Modal
        visible={showEpiModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEpiModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Epi Enviada</Text>
            <Text style={styles.modalMessage}>
              Se le notificara una vez finalizado la{"\n"}evaluacion
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleEpiModalClose}
            >
              <Text style={styles.modalButtonText}>Listo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Upload Options Modal */}
      <Modal
        visible={showUploadModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUploadModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowUploadModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={{ alignItems: 'center' }}>
            <View style={styles.uploadModalContainer}>
              <Text style={styles.uploadModalTitle}>Subir Evidencia</Text>

              <TouchableOpacity
                style={styles.uploadOptionButton}
                onPress={() => {
                  setShowUploadModal(false);
                  performUpload('camera');
                }}
              >
                <Text style={styles.uploadOptionText}>📷 Tomar Foto</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.uploadOptionButton}
                onPress={() => {
                  setShowUploadModal(false);
                  performUpload('gallery');
                }}
              >
                <Text style={styles.uploadOptionText}>🖼️ Desde Galería</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.uploadOptionButton}
                onPress={() => {
                  setShowUploadModal(false);
                  performUpload('document');
                }}
              >
                <Text style={styles.uploadOptionText}>📄 Seleccionar Archivo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.uploadCancelButton}
                onPress={() => setShowUploadModal(false)}
              >
                <Text style={styles.uploadCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Photo Viewing Modal */}
      <Modal
        visible={showPhotosModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPhotosModal(false)}
      >
        <View style={styles.photoViewModalOverlay}>
          <View style={styles.photoViewModalContainer}>
            <View style={styles.photoViewModalHeader}>
              <Text style={styles.photoViewModalTitle}>
                {categories.find(c => c.id === selectedCategory)?.title || 'Fotos'}
              </Text>
              <TouchableOpacity onPress={() => setShowPhotosModal(false)}>
                <Text style={styles.photoViewModalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={selectedCategory ? (categoryPhotos[selectedCategory] || []) : []}
              keyExtractor={(item, index) => `${item}-${index}`}
              numColumns={2}
              contentContainerStyle={styles.photoGridContainer}
              renderItem={({ item: photoUrl }) => (
                <View style={styles.photoGridItem}>
                  <Image source={{ uri: photoUrl }} style={styles.photoGridImage} />
                  <TouchableOpacity
                    style={styles.photoRemoveButton}
                    onPress={() => selectedCategory && handleRemovePhoto(selectedCategory, photoUrl)}
                  >
                    <Text style={styles.photoRemoveButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyPhotosText}>No hay fotos en esta categoría</Text>
              }
            />
            <TouchableOpacity
              style={styles.addMorePhotosButton}
              onPress={() => {
                setShowPhotosModal(false);
                selectedCategory && handleUploadPhoto(selectedCategory);
              }}
            >
              <Text style={styles.addMorePhotosButtonText}>+ Agregar Más Fotos</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Upload Loading Indicator */}
      {uploading && (
        <View style={styles.uploadingOverlay}>
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.uploadingText}>Subiendo...</Text>
          </View>
        </View>
      )}
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
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666666',
  },
  categoriesContainer: {
    gap: 16,
    marginBottom: 80,
  },
  evidenceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusIconImage: {
    width: 24,
    height: 24,
    tintColor: '#FFFFFF',
  },
  statusIconEmpty: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  photoCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoCountIcon: {
    width: 12,
    height: 12,
    marginRight: 4,
    tintColor: '#666666',
  },
  photoCountText: {
    fontSize: 12,
    color: '#666666',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  uploadButton: {
    backgroundColor: '#003E85',
  },
  viewButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionButtonIcon: {
    width: 12,
    height: 12,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  uploadButtonText: {
    color: '#FFFFFF',
  },
  viewButtonText: {
    color: '#666666',
  },
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  acceptButton: {
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
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    marginHorizontal: 40,
    minWidth: 280,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Photo viewing modal styles
  photoViewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoViewModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  photoViewModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  photoViewModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  photoViewModalClose: {
    fontSize: 28,
    color: '#666666',
    fontWeight: 'bold',
  },
  photoGridContainer: {
    paddingBottom: 16,
  },
  photoGridItem: {
    flex: 1,
    margin: 4,
    aspectRatio: 1,
    position: 'relative',
  },
  photoGridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  photoRemoveButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoRemoveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyPhotosText: {
    textAlign: 'center',
    color: '#999999',
    fontSize: 14,
    marginTop: 40,
  },
  addMorePhotosButton: {
    backgroundColor: '#003E85',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  addMorePhotosButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Upload indicator styles
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  uploadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  uploadModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxWidth: 400,
  },
  uploadModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003E85',
    marginBottom: 20,
    textAlign: 'center',
  },
  uploadOptionButton: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  uploadOptionText: {
    fontSize: 16,
    color: '#333',
  },
  uploadCancelButton: {
    marginTop: 20,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  uploadCancelText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 15,
  },
});