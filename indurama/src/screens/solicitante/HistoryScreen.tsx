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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

// Tipos para las solicitudes del historial
interface HistoryRequest {
  id: string;
  code: string;
  title: string;
  date: string;
  status: 'En Progreso' | 'Completado';
}

// Props para la pantalla
interface HistoryScreenProps {
  onNavigateToRequests?: () => void;
  onNavigateToNewRequest?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToDetail?: (requestId: string) => void;
}

/**
 * Pantalla de Historial de Solicitudes para el rol de Solicitante
 */
export const HistoryScreen: React.FC<HistoryScreenProps> = ({ 
  onNavigateToRequests, 
  onNavigateToNewRequest,
  onNavigateToProfile,
  onNavigateToDetail
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [historyRequests] = useState<HistoryRequest[]>([
    {
      id: '1',
      code: 'SOL-2025-042',
      title: 'Materia prima línea A',
      date: '15 Ene 2025',
      status: 'En Progreso'
    },
    {
      id: '2',
      code: 'SOL-2025-038',
      title: 'Repuestos de Maquinaria',
      date: '25 Feb 2025',
      status: 'Completado'
    },
    {
      id: '3',
      code: 'SOL-2025-035',
      title: 'Registros de Calibración',
      date: '05 May 2025',
      status: 'En Progreso'
    },
    {
      id: '4',
      code: 'SOL-2025-042',
      title: 'Materiales de Empaque',
      date: '15 Ene 2025',
      status: 'Completado'
    },
    {
      id: '5',
      code: 'SOL-2025-025',
      title: 'Componentes Electrónicos',
      date: '28 Ene 2025',
      status: 'En Progreso'
    },
    {
      id: '6',
      code: 'SOL-2025-042',
      title: 'Televisores Empacados',
      date: '16 Dic 2025',
      status: 'En Progreso'
    }
  ]);

  const handleBackToRequests = () => {
    if (onNavigateToRequests) {
      onNavigateToRequests();
    } else {
      console.log('Función de navegación a solicitudes no disponible');
    }
  };

  const handleNewRequest = () => {
    if (onNavigateToNewRequest) {
      onNavigateToNewRequest();
    } else {
      console.log('Función de navegación a nueva solicitud no disponible');
    }
  };

  const handleProfile = () => {
    if (onNavigateToProfile) {
      onNavigateToProfile();
    } else {
      console.log('Función de navegación a perfil no disponible');
    }
  };

  const handleViewDetails = (requestId: string) => {
    if (onNavigateToDetail) {
      onNavigateToDetail(requestId);
    } else {
      console.log('Ver detalles:', requestId);
    }
  };

  const filteredRequests = historyRequests.filter(request =>
    request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>HISTORIAL DE SOLICITUDES</Text>
            
            {/* Logo de Indurama */}
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../../assets/icono_indurama.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>
      </View>

      {/* Contenido */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Subtítulo */}
        <Text style={styles.subtitle}>
          Revise todas sus solicitudes anteriores
        </Text>

        {/* Barra de Búsqueda */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Image 
              source={require('../../../assets/icons/search.png')} 
              style={styles.searchIcon}
              resizeMode="contain"
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar Solicitudes"
              placeholderTextColor="#999999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Solicitudes Recientes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Solicitudes Recientes</Text>
          
          <View style={styles.requestsList}>
            {filteredRequests.map((request) => (
              <HistoryCard
                key={request.id}
                request={request}
                onViewDetails={handleViewDetails}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={handleBackToRequests}>
          <Image 
            source={require('../../../assets/icons/home.png')} 
            style={styles.navIconImage}
          />
          <Text style={styles.navText}>Mis Solicitudes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={handleNewRequest}>
          <Image 
            source={require('../../../assets/icons/plus.png')} 
            style={styles.navIconImage}
          />
          <Text style={styles.navText}>Nueva Solicitud</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Image 
            source={require('../../../assets/icons/chart.png')} 
            style={[styles.navIconImage, styles.navIconActive]}
          />
          <Text style={[styles.navText, styles.navTextActive]}>Historial</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={handleProfile}>
          <Image 
            source={require('../../../assets/icons/profile.png')} 
            style={styles.navIconImage}
          />
          <Text style={styles.navText}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Componente de tarjeta de historial
const HistoryCard: React.FC<{
  request: HistoryRequest;
  onViewDetails: (id: string) => void;
}> = ({ request, onViewDetails }) => {
  const getStatusColor = (status: string) => {
    return status === 'En Progreso' ? '#003E85' : '#CACACA';
  };

  const getStatusText = (status: string) => {
    return status === 'En Progreso' ? 'En Progreso' : 'Completado';
  };

  const getStatusTextColor = (status: string) => {
    return status === 'En Progreso' ? '#FFFFFF' : '#333333';
  };

  return (
    <TouchableOpacity 
      style={styles.historyCard}
      onPress={() => onViewDetails(request.id)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.requestCode}>{request.code}</Text>
        <View style={styles.cardMiddle}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
            <Text style={[styles.statusText, { color: getStatusTextColor(request.status) }]}>
              {getStatusText(request.status)}
            </Text>
          </View>
        </View>
        <Text style={styles.requestDate}>{request.date}</Text>
      </View>
      
      <Text style={styles.requestTitle}>{request.title}</Text>
    </TouchableOpacity>
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
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 15,
  },
  title: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: 'bold',
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
  subtitle: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 24,
  },
  searchContainer: {
    marginBottom: 32,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    tintColor: '#666666',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  requestsList: {
    gap: 12,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flex: 1,
    marginRight: 16,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    width: '100%',
  },
  cardMiddle: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    flexShrink: 0,
  },
  requestCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 0,
    flex: 2,
    flexShrink: 0,
  },
  requestDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 0,
    textAlign: 'right',
    minWidth: 80,
    flexShrink: 0,
  },
  requestTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 0,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 0,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bottomNav: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingBottom: Platform.OS === 'ios' ? 25 : 12,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navItemActive: {
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
  },
  navIconImage: {
    width: 20,
    height: 20,
    marginBottom: 4,
    tintColor: '#666666',
  },
  navIconActive: {
    tintColor: '#003E85',
  },
  navText: {
    fontSize: 12,
    color: '#666666',
  },
  navTextActive: {
    color: '#003E85',
    fontWeight: '600',
  },
});