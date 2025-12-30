import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { Request, RequestStatus } from '../types';
import { getRelativeTime } from '../services/requestService';

interface RequestDetailScreenProps {
  requestId: string;
  onBack: () => void;
  onNavigateToEdit?: (request: Request) => void; // New prop for editing
}

export const RequestDetailScreen: React.FC<RequestDetailScreenProps> = ({ requestId, onBack, onNavigateToEdit }) => {
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const docRef = doc(db, 'requests', requestId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRequest({ id: docSnap.id, ...docSnap.data() } as Request);
        }
      } catch (error) {
        console.error("Error fetching request:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1565C0" />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.container}>
        <Text>No se encontró la solicitud</Text>
        <TouchableOpacity onPress={onBack}><Text>Volver</Text></TouchableOpacity>
      </View>
    );
  }

  // Mock Timeline Data for visual match
  // Dynamic Timeline Events
  const timelineEvents = [
    {
      title: 'Solicitud Creada',
      user: request.userName || 'Usuario',
      role: 'Solicitante',
      date: request.createdAt,
      icon: 'document-text-outline',
      active: true
    }
  ];

  if (request.status === 'pending') {
    timelineEvents.push({
      title: 'Esperando Revisión',
      user: 'Gestor',
      role: 'Pendiente',
      date: null,
      icon: 'time-outline',
      active: false
    });
  } else {
    // In progress (En revisión)
    timelineEvents.push({
      title: 'En Revisión',
      user: 'Gestor de Compras',
      role: 'Gestor',
      date: request.updatedAt,
      icon: 'search-outline',
      active: true
    });
  }

  if (request.status === 'completed') {
    timelineEvents.push({
      title: 'Solicitud Aprobada',
      user: 'Gestor de Compras',
      role: 'Gestor',
      date: (request as any).completedAt || request.updatedAt,
      icon: 'checkmark-circle-outline',
      active: true
    });
  } else if (request.status === 'rejected' || request.status === RequestStatus.REJECTED) {
    timelineEvents.push({
      title: 'Solicitud Rechazada',
      user: 'Gestor de Compras',
      role: 'Gestor',
      date: (request as any).reviewedAt || request.updatedAt,
      icon: 'close-circle-outline',
      active: true
    });
  } else if (request.status === RequestStatus.RECTIFICATION_REQUIRED) {
    timelineEvents.push({
      title: 'Corrección Requerida',
      user: 'Gestor de Compras',
      role: 'Gestor',
      date: (request as any).reviewedAt || request.updatedAt,
      icon: 'alert-circle-outline',
      active: true
    });
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{request.code}</Text>
        <Image
          source={require('../../assets/icono_indurama.png')}
          style={{ width: 80, height: 30 }}
          resizeMode="contain"
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.mainTitle} numberOfLines={2}>
          {request.description}
        </Text>

        {/* General Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Información General</Text>
            <Ionicons name="create-outline" size={20} color="#333" />
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Solicitante</Text>
            <Text style={styles.value}>{request.userName || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Departamento</Text>
            <Text style={styles.value}>{request.department || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Fecha de Solicitud</Text>
            <Text style={styles.value}>{getRelativeTime(request.createdAt)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Fecha Límite</Text>
            <Text style={styles.value}>{request.dueDate ? String(request.dueDate) : 'No definida'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Tipo de Proyecto</Text>
            <Text style={styles.value}>{request.tipoProyecto}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Clase de Búsqueda</Text>
            <Text style={styles.value}>{request.claseBusqueda}</Text>
          </View>
        </View>

        {/* Detail Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detalle de la Necesidad</Text>
          <Text style={styles.detailText}>
            {request.description}
          </Text>
        </View>

        {/* Rectification Alert */}
        {request.status === RequestStatus.RECTIFICATION_REQUIRED && (
          <View style={styles.rectificationCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Ionicons name="warning" size={24} color="#F57C00" style={{ marginRight: 10 }} />
              <Text style={styles.rectificationTitle}>Corrección Requerida</Text>
            </View>
            <Text style={styles.rectificationMessage}>
              El gestor ha solicitado cambios en tu solicitud:
            </Text>
            <View style={styles.commentBox}>
              <Text style={styles.commentText}>"{request.rectificationComment || 'Por favor revisar los detalles.'}"</Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => onNavigateToEdit && onNavigateToEdit(request)}
            >
              <Ionicons name="create-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.editButtonText}>Editar Solicitud</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Attachments Card */}
        {/* Mocking attachments visualization */}
        {/* Attachments Card */}
        {request.documents && request.documents.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Documentos Adjuntos</Text>
            {request.documents.map((doc: any, index: number) => (
              <View key={index} style={styles.attachmentItem}>
                <View style={styles.fileIconContainer}>
                  <Ionicons name="document-text-outline" size={24} color="#1976D2" />
                </View>
                <View style={{ flex: 1, paddingHorizontal: 12 }}>
                  <Text style={styles.fileName}>{doc.name || `Documento ${index + 1}`}</Text>
                  <Text style={styles.fileSize}>Adjunto</Text>
                </View>
                <TouchableOpacity>
                  <Ionicons name="download-outline" size={20} color="#333" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}

        {/* Trazabilidad / Timeline */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { marginBottom: 20 }]}>TRAZABILIDAD</Text>

          {timelineEvents.map((event, index) => (
            <View key={index} style={styles.timelineItem}>
              {/* Line */}
              {index < timelineEvents.length - 1 && <View style={styles.timelineLine} />}

              <View style={styles.timelineIconContainer}>
                <Ionicons name={event.icon as any} size={20} color="#1565C0" />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>{event.title}</Text>
                <Text style={styles.timelineUser}>{event.user} ({event.role})</Text>
                <Text style={styles.timelineDate}>{event.date ? getRelativeTime(event.date) : 'Pendiente'}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#FFF',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  mainTitle: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 20,
    marginTop: 5,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 8,
  },
  infoRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
  },
  detailText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#424242',
  },
  attachmentCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    elevation: 1,
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  fileSize: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 14, // Center of icon (30/2 roughly)
    top: 30,
    bottom: -20,
    width: 2,
    backgroundColor: '#E0E0E0',
    zIndex: 1,
  },
  timelineIconContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    zIndex: 2,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  timelineUser: {
    fontSize: 12,
    color: '#616161',
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 11,
    color: '#9E9E9E',
  },
  rectificationCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  rectificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
  },
  rectificationMessage: {
    fontSize: 14,
    color: '#5D4037',
    marginBottom: 10,
  },
  commentBox: {
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#F57C00',
  },
  commentText: {
    fontStyle: 'italic',
    color: '#333',
  },
  editButton: {
    backgroundColor: '#F57C00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 8
  }
});