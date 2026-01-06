import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Dimensions,
  Platform,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../hooks/useAuth';

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
}

/**
 * Pantalla de Evidencias Fotográficas para el rol de Proveedor
 */
export const PhotoEvidenceScreen: React.FC<PhotoEvidenceScreenProps> = ({
  onNavigateBack,
  onComplete
}) => {
  const { user } = useAuth();
  const [showEpiModal, setShowEpiModal] = useState(false);
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
      if (!user?.id) return;

      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../services/firebaseConfig');

        const evalRef = doc(db, 'supplier_evaluations', user.id);
        const evalDoc = await getDoc(evalRef);

        if (evalDoc.exists()) {
          const data = evalDoc.data();
          if (data.photoEvidence && data.photoEvidence.length > 0) {
            // Mark all as completed if evidence exists
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
  }, [user?.id]);

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
    if (!user?.id) {
      Alert.alert('Error', 'No se pudo identificar el usuario');
      return;
    }

    try {
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../services/firebaseConfig');

      // Create temporary evidence data
      const tempEvidence = categories.map(cat => ({
        categoryId: cat.id,
        categoryTitle: cat.title,
        photoUrl: 'https://placeholder.com/photo.jpg', // Temporal
        uploadedAt: new Date().toISOString()
      }));

      const evalRef = doc(db, 'supplier_evaluations', user.id);

      // Save evidence
      await setDoc(evalRef, {
        photoEvidence: tempEvidence,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Mark all categories as completed
      setCategories(prev => prev.map(cat => ({
        ...cat,
        status: 'completed',
        photosCount: 1
      })));

      console.log('✅ Evidencias guardadas temporalmente');
      setShowEpiModal(true);
    } catch (error) {
      console.error('Error saving evidence:', error);
      Alert.alert('Error', 'No se pudieron guardar las evidencias');
    }
  };

  const handleUploadPhoto = (categoryId: string) => {
    Alert.alert(
      'Función Temporal',
      'La subida de fotos será implementada próximamente. Por ahora, haz click en "Aceptar" para marcar como completado.',
      [{ text: 'OK' }]
    );
  };

  const handleViewPhotos = (categoryId: string) => {
    Alert.alert(
      'Fotos Temporales',
      'Esta categoría ha sido marcada como completada temporalmente.',
      [{ text: 'OK' }]
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
        <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
          <Text style={styles.acceptButtonText}>Aceptar</Text>
        </TouchableOpacity>
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
});