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

// Tipos para las solicitudes
interface RequestItem {
  id: string;
  code: string;
  title: string;
  description: string;
  solicitante: string;
  departamento: string;
  fechaSolicitud: string;
  fechaLimite: string;
  estado: 'alta' | 'baja' | 'media';
  urgencia: 'alta' | 'baja' | 'media';
}

// Props para la pantalla
interface ManagerRequestsScreenProps {
  onNavigateBack?: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateToProveedores?: () => void;
  onNavigateToReview?: (requestId: string) => void;
  onNavigateToProfile?: () => void;
  initialFilter?: 'all' | 'pending' | 'completed';
}

/**
 * Pantalla de Solicitudes Pendientes para el rol de Gestor
 */
export const ManagerRequestsScreen: React.FC<ManagerRequestsScreenProps> = ({ 
  onNavigateBack,
  onNavigateToDashboard,
  onNavigateToProveedores,
  onNavigateToReview,
  onNavigateToProfile,
  initialFilter = 'pending'
}) => {
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentFilter, setCurrentFilter] = useState(initialFilter);

  // Datos de ejemplo basados en la imagen
  const [requests] = useState<RequestItem[]>([
    {
      id: '1',
      code: 'SOL-2025-042',
      title: 'Materia prima para línea de producción A',
      description: 'Solicitud de materia prima para la línea de producción A',
      solicitante: 'Juan Pérez',
      departamento: 'Producción',
      fechaSolicitud: '15 Ene 2025',
      fechaLimite: '30 Ene 2025',
      estado: 'alta',
      urgencia: 'alta'
    },
    {
      id: '2',
      code: 'SOL-2025-042',
      title: 'Materia prima para línea de producción A',
      description: 'Solicitud de materia prima para la línea de producción A',
      solicitante: 'Ana Lopez',
      departamento: 'Calidad',
      fechaSolicitud: '12 Ene 2025',
      fechaLimite: '28 Ene 2025',
      estado: 'baja',
      urgencia: 'baja'
    },
    {
      id: '3',
      code: 'SOL-2025-042',
      title: 'Materia prima para línea de producción A',
      description: 'Solicitud de materia prima para la línea de producción A',
      solicitante: 'Ana Lopez',
      departamento: 'Calidad',
      fechaSolicitud: '12 Ene 2025',
      fechaLimite: '28 Ene 2025',
      estado: 'media',
      urgencia: 'media'
    }
  ]);

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

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'alta':
        return { text: 'Alta', color: '#FF4444', backgroundColor: '#FFE6E6' };
      case 'baja':
        return { text: 'Baja', color: '#00C851', backgroundColor: '#E8F5E8' };
      case 'media':
        return { text: 'Media', color: '#007BFF', backgroundColor: '#E3F2FD' };
      default:
        return { text: 'Media', color: '#007BFF', backgroundColor: '#E3F2FD' };
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchText.toLowerCase()) ||
                         request.solicitante.toLowerCase().includes(searchText.toLowerCase()) ||
                         request.departamento.toLowerCase().includes(searchText.toLowerCase());
    
    switch (currentFilter) {
      case 'pending':
        return matchesSearch && request.estado !== 'baja';
      case 'completed':
        return matchesSearch && request.estado === 'baja';
      default:
        return matchesSearch;
    }
  });

  const renderRequestItem = (request: RequestItem) => {
    const estadoBadge = getEstadoBadge(request.estado);
    
    return (
      <View key={request.id} style={styles.requestCard}>
        {/* Header con código y badge */}
        <View style={styles.requestHeader}>
          <Text style={styles.requestCode}>{request.code}</Text>
          <View style={styles.rightHeader}>
            <View style={styles.urgencyIcon}>
              <Image 
                source={require('../../assets/icons/clock.png')}
                style={styles.urgencyIconImage}
                resizeMode="contain"
              />
              <Text style={styles.urgencyText}>Con urgencia</Text>
            </View>
            <View style={[styles.estadoBadge, { backgroundColor: estadoBadge.backgroundColor }]}>
              <Text style={[styles.estadoText, { color: estadoBadge.color }]}>
                {estadoBadge.text}
              </Text>
            </View>
          </View>
        </View>

        {/* Título y descripción */}
        <Text style={styles.requestTitle}>{request.title}</Text>

        {/* Información del solicitante */}
        <View style={styles.requestInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Solicitante</Text>
            <Text style={styles.infoValue}>{request.solicitante}</Text>
            <Text style={styles.infoLabel}>Fecha Límite</Text>
            <Text style={[styles.infoValue, styles.fechaLimite]}>{request.fechaLimite}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Departamento</Text>
            <Text style={styles.infoValue}>{request.departamento}</Text>
            <Text style={styles.infoLabel}>Fecha de Solicitud</Text>
            <Text style={styles.infoValue}>{request.fechaSolicitud}</Text>
          </View>
        </View>

        {/* Botón de acción */}
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onNavigateToReview && onNavigateToReview(request.id)}
        >
          <Text style={styles.actionButtonText}>Revisar y Decidir</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>SOLICITUDES PENDIENTES</Text>
            
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

      {/* QUIERO AJUSTAR PAR QUE DESDE LA LINEA 218 HASTA LA 230 ESTEN EN LA MISMA FILA, como hago? 
        tambien quiero ajustarlo para que el texto solo utilize una porcion y esten ajustados*/}
        <View style={styles.row}>
            <Text style={styles.subtitle}>
                Revise y gestione las solicitudes de necesidades recibidas
            </Text>
            
            {/* Contador de pendientes */}
            <View style={styles.pendingCounter}>
                <Image 
                    source={require('../../assets/icons/clock.png')}
                    style={styles.pendingIcon}
                    resizeMode="contain"
                />
            <Text style={styles.pendingText}>{filteredRequests.length} pendientes</Text>
            </View>
        </View>

      {/* Barra de búsqueda y filtros */}
      <View style={styles.searchSection}>

        <View style={styles.searchContainer}>
          <Image 
            source={require('../../assets/icons/search.png')}
            style={styles.searchIcon}
            resizeMode="contain"
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por Id, solicitantes y departamento"
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#999999"
          />
        </View>
        
        <TouchableOpacity 
          style={styles.filtersButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Image 
            source={require('../../assets/icons/filter.png')}
            style={styles.filtersIcon}
            resizeMode="contain"
          />
          <Text style={styles.filtersText}>Filtros</Text>
        </TouchableOpacity>
      </View>

      {/* Dropdown de Filtros */}
      {showFilters && (
        <View style={styles.filtersDropdown}>
          <TouchableOpacity 
            style={[styles.filterOption, currentFilter === 'all' && styles.filterOptionActive]}
            onPress={() => {
              setCurrentFilter('all');
              setShowFilters(false);
            }}
          >
            <Image 
              source={require('../../assets/icons/document.png')}
              style={[styles.filterIcon, currentFilter === 'all' && styles.filterIconActive]}
              resizeMode="contain"
            />
            <Text style={[styles.filterText, currentFilter === 'all' && styles.filterTextActive]}>
              Todas
            </Text>
          </TouchableOpacity>

          <View style={styles.filterDivider} />

          <TouchableOpacity 
            style={[styles.filterOption, currentFilter === 'pending' && styles.filterOptionActive]}
            onPress={() => {
              setCurrentFilter('pending');
              setShowFilters(false);
            }}
          >
            <Image 
              source={require('../../assets/icons/clock.png')}
              style={[styles.filterIcon, currentFilter === 'pending' && styles.filterIconActive]}
              resizeMode="contain"
            />
            <Text style={[styles.filterText, currentFilter === 'pending' && styles.filterTextActive]}>
              En Progreso
            </Text>
          </TouchableOpacity>

          <View style={styles.filterDivider} />

          <TouchableOpacity 
            style={[styles.filterOption, currentFilter === 'completed' && styles.filterOptionActive]}
            onPress={() => {
              setCurrentFilter('completed');
              setShowFilters(false);
            }}
          >
            <Image 
              source={require('../../assets/icons/check.png')}
              style={[styles.filterIcon, currentFilter === 'completed' && styles.filterIconActive]}
              resizeMode="contain"
            />
            <Text style={[styles.filterText, currentFilter === 'completed' && styles.filterTextActive]}>
              Completados
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista de solicitudes */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.requestsList}>
          {filteredRequests.map(request => renderRequestItem(request))}
        </View>
        
        {/* Espacio inferior */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={handleNavigateToDashboard}
        >
          <Image 
            source={require('../../assets/icons/home.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
          <Text style={styles.navText}>Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Image 
            source={require('../../assets/icons/document.png')}
            style={[styles.navIcon, styles.activeNavIcon]}
            resizeMode="contain"
          />
          <Text style={[styles.navText, styles.activeNavText]}>Solicitudes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={handleNavigateToProveedores}
        >
          <Image 
            source={require('../../assets/icons/users.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
          <Text style={styles.navText}>Proveedores</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={onNavigateToProfile}
        >
          <Image 
            source={require('../../assets/icons/profile.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
          <Text style={styles.navText}>Perfil</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
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
  subtitle: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 16,
    flex: 1,

  },
  pendingCounter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingIcon: {
    width: 16,
    height: 16,
    tintColor: '#666666',
    marginRight: 8,
  },
  pendingText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isMobile ? 20 : 40,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: '#666666',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
  },
  filtersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filtersIcon: {
    width: 16,
    height: 16,
    tintColor: '#666666',
    marginRight: 6,
  },
  filtersText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: isMobile ? 20 : 40,
    paddingTop: 16,
  },
  requestsList: {
    gap: 16,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  urgencyIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  urgencyIconImage: {
    width: 16,
    height: 16,
    tintColor: '#FF9800',
    marginRight: 4,
  },
  urgencyText: {
    fontSize: 12,
    color: '#666666',
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
    lineHeight: 22,
  },
  requestInfo: {
    gap: 8,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666666',
    minWidth: 80,
  },
  infoValue: {
    fontSize: 12,
    color: '#333333',
    fontWeight: '500',
    flex: 1,
  },
  fechaLimite: {
    color: '#FF4444',
  },
  actionButton: {
    backgroundColor: '#003E85',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomSpacing: {
    height: 100,
  },
  bottomNavigation: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        paddingBottom: 34,
      },
    }),
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navIcon: {
    width: 26,
    height: 24,
    tintColor: '#999999',
    marginBottom: 4,
  },
  activeNavIcon: {
    tintColor: '#003E85',
  },
  navText: {
    fontSize: 12,
    color: '#999999',
  },
  activeNavText: {
    color: '#003E85',
    fontWeight: '600',
  },
  // Estilos para dropdown de filtros
  filtersDropdown: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: isMobile ? 20 : 40,
    borderRadius: 12,
    paddingVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
    marginBottom: 16,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterOptionActive: {
    backgroundColor: '#F0F8FF',
  },
  filterIcon: {
    width: 20,
    height: 20,
    tintColor: '#666666',
    marginRight: 12,
  },
  filterIconActive: {
    tintColor: '#003E85',
  },
  filterText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#003E85',
    fontWeight: '600',
  },
  filterDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isMobile ? 20 : 40,
    marginBottom: 8,
    marginTop: 12,
    maxWidth: '100%',
    },
});