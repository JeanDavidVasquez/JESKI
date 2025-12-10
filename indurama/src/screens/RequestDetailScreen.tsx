import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

// Props para la pantalla
interface RequestDetailScreenProps {
  onNavigateBack?: () => void;
  requestId?: string;
}

/**
 * Pantalla de Detalle de Solicitud
 */
export const RequestDetailScreen: React.FC<RequestDetailScreenProps> = ({ 
  onNavigateBack,
  requestId 
}) => {
  const handleGoBack = () => {
    if (onNavigateBack) {
      onNavigateBack();
    } else {
      console.log('Función de navegación de regreso no disponible');
    }
  };

  // Datos simulados de la solicitud (en producción vendrían de una API)
  const requestDetail = {
    id: 'SOL-2025-042',
    title: 'Materia prima para línea de Producción A',
    solicitante: 'Juan Pérez',
    departamento: 'Producción',
    fechaSolicitud: '15 Ene 2025',
    fechaLimite: '30 Ene 2025',
    tipoProyecto: 'Presupuesto aprobado / SCMP',
    claseBusqueda: 'Materia Prima',
    detalleNecesidad: 'Se requiere materia prima de alta calidad para la línea de producciona A. Cantidad estimada 5000 kg. Especificaciones técnicas detalladas en los documentos adjuntos.',
    documentos: [
      { nombre: 'Pliego_Tecnico.pdf', tamaño: '2.3 MB' },
      { nombre: 'Pliego_Tecnico.pdf', tamaño: '11 MB' }
    ],
    trazabilidad: [
      {
        tipo: 'created',
        titulo: 'Solicitud Creada',
        usuario: 'Juan Pérez (Solicitante)',
        fecha: '15 Ene 2025 09:30'
      },
      {
        tipo: 'received',
        titulo: 'Solicitud recibida - En revisión',
        usuario: 'María Maldonado(Gestor)',
        fecha: '15 Ene 2025 14:30'
      },
      {
        tipo: 'comment',
        titulo: 'Comentario Añadido',
        usuario: 'María Maldonado(Gestor)',
        fecha: '16 Ene 2025 10:30'
      }
    ]
  };

  const getStatusIcon = (tipo: string) => {
    switch (tipo) {
      case 'created':
        return require('../../assets/icons/document.png');
      case 'received':
        return require('../../assets/icons/clock.png');
      case 'comment':
        return require('../../assets/icons/comment.png');
      default:
        return require('../../assets/icons/document.png');
    }
  };

  const getStatusColor = (tipo: string) => {
    switch (tipo) {
      case 'created':
        return '#F3F4F6'; // Fondo gris claro
      case 'received':
        return '#F3F4F6'; // Fondo gris claro
      case 'comment':
        return '#F3F4F6'; // Fondo gris claro
      default:
        return '#F3F4F6';
    }
  };

  const getIconColor = (tipo: string) => {
    switch (tipo) {
      case 'created':
        return '#1E40AF'; // Icono azul claro
      case 'received':
        return '#1E40AF'; // Icono azul medio
      case 'comment':
        return '#1E40AF'; // Icono azul oscuro
      default:
        return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
              <Image 
                source={require('../../assets/icons/arrow-left.png')} 
                style={styles.backIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text style={styles.requestId}>{requestDetail.id}</Text>
            
            {/* Logo de Indurama */}
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/icono_indurama.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>
      </View>

      {/* Contenido */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Título de la solicitud */}
        <Text style={styles.requestTitle}>Materia prima para línea de Producción A</Text>


        {/* Información General - Todo en un solo cuadro */}
        <View style={styles.infoContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Información General</Text>
            <TouchableOpacity style={styles.editButton}>
              <Image 
                source={require('../../assets/icons/document.png')} 
                style={styles.editIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
          
          <InfoRow label="Solicitante" value={requestDetail.solicitante} />
          <InfoRow label="Departamento" value={requestDetail.departamento} />
          <InfoRow label="Fecha de Solicitud" value={requestDetail.fechaSolicitud} />
          <InfoRow label="Fecha Límite" value={requestDetail.fechaLimite} />
          <InfoRow label="Tipo de Proyecto" value={requestDetail.tipoProyecto} />
          <InfoRow label="Clase de Búsqueda" value={requestDetail.claseBusqueda} />
        </View>

        {/* Detalle de la Necesidad */}
        <View style={styles.detailContainer}>
          <Text style={styles.sectionTitle}>Detalle de la Necesidad</Text>
          <Text style={styles.detailText}>{requestDetail.detalleNecesidad}</Text>
        </View>

        {/* Documentos Adjuntos */}
        <View style={styles.documentsContainer}>
          <Text style={styles.sectionTitle}>Documentos Adjuntos</Text>
          {requestDetail.documentos.map((doc, index) => (
            <View key={index} style={styles.documentItem}>
              <View style={styles.documentInfo}>
                <Image 
                  source={require('../../assets/icons/document.png')} 
                  style={styles.documentIcon}
                  resizeMode="contain"
                />
                <View style={styles.documentDetails}>
                  <Text style={styles.documentName}>{doc.nombre}</Text>
                  <Text style={styles.documentSize}>{doc.tamaño}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.downloadButton}>
                <Image 
                  source={require('../../assets/icons/download.png')} 
                  style={[styles.downloadIcon]}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Trazabilidad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TRAZABILIDAD</Text>
          
          <View style={styles.timelineContainer}>
            {requestDetail.trazabilidad.map((item, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineIconContainer}>
                  <View style={[styles.timelineIconCircle, { backgroundColor: getStatusColor(item.tipo) }]}>
                    <Image 
                      source={getStatusIcon(item.tipo)}
                      style={[styles.timelineIcon, { tintColor: getIconColor(item.tipo) }]}
                      resizeMode="contain"
                    />
                  </View>
                  {index < requestDetail.trazabilidad.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>{item.titulo}</Text>
                  <Text style={styles.timelineUser}>{item.usuario}</Text>
                  <Text style={styles.timelineDate}>{item.fecha}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// Componente para filas de información
const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: isMobile ? 20 : 40,
    paddingBottom: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerContent: {
    alignItems: 'flex-start',
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: '#003E85',
  },
  requestId: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: 52,
    height: 52,
  },
  content: {
    flex: 1,
    paddingHorizontal: isMobile ? 20 : 40,
    paddingTop: 20,
  },
  projectInfoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  headerInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  projectType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  projectTypeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  searchClass: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  searchClassLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    marginTop: 12,
  },
  searchClassValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  requestTitle: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 24,
    lineHeight: 22,
    fontWeight: '500',
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  editButton: {
    padding: 4,
  },
  editIcon: {
    width: 20,
    height: 20,
    tintColor: '#6B7280',
  },
  infoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  infoRow: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  detailContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  detailText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  documentsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  documentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
  },
  documentContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentIcon: {
    width: 24,
    height: 24,
    tintColor: '#3B82F6',
    marginRight: 12,
  },
  documentDetails: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  documentSize: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  downloadButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  downloadIcon: {
    width: 20,
    height: 20,
    tintColor: '#6B7280',
  },
  timelineContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineIconContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineIcon: {
    width: 20,
    height: 20,
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
  timelineTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  timelineUser: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});