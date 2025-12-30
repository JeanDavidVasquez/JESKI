import React, { useState, useCallback, useEffect } from 'react';
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
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ManagerBottomNav } from '../components/ManagerBottomNav';
import { getAllRequests, getRelativeTime } from '../services/requestService';
import { Request, RequestStatus, RequestPriority } from '../types';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

interface ManagerRequestsScreenProps {
  onNavigateBack?: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateToProveedores?: () => void;
  onNavigateToSearch?: (requestId: string) => void;
  onNavigateToReview?: (requestId: string) => void;
  onNavigateToProfile?: () => void;
  initialFilter?: 'all' | 'pending' | 'completed';
}

export const ManagerRequestsScreen: React.FC<ManagerRequestsScreenProps> = ({
  onNavigateToDashboard,
  onNavigateToProveedores,
  onNavigateToReview,
  onNavigateToSearch,
  onNavigateToProfile,
  initialFilter = 'pending'
}) => {
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<'all' | 'pending' | 'completed'>(initialFilter);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const getFilteredRequests = () => {
    return requests.filter(request => {
      // Search
      const searchLower = searchText.toLowerCase();
      const matchesSearch =
        (request.title?.toLowerCase() || '').includes(searchLower) ||
        (request.userName?.toLowerCase() || '').includes(searchLower) ||
        (request.code?.toLowerCase() || '').includes(searchLower) ||
        (request.department?.toLowerCase() || '').includes(searchLower);

      if (!matchesSearch) return false;

      // Filter
      switch (currentFilter) {
        case 'pending': // Shows Pending and In Progress
          return request.status === RequestStatus.PENDING || request.status === RequestStatus.IN_PROGRESS;
        case 'completed': // Shows Completed and Rejected
          return request.status === RequestStatus.COMPLETED || request.status === RequestStatus.REJECTED;
        default:
          return true;
      }
    });
  };

  const filteredRequests = getFilteredRequests();

  const getPriorityBadge = (priority: RequestPriority) => {
    switch (priority) {
      case RequestPriority.URGENT:
      case RequestPriority.HIGH:
        return { text: 'Alta', color: '#FF4444', backgroundColor: '#FFE6E6' };
      case RequestPriority.MEDIUM:
        return { text: 'Media', color: '#007BFF', backgroundColor: '#E3F2FD' };
      case RequestPriority.LOW:
      default:
        return { text: 'Baja', color: '#00C851', backgroundColor: '#E8F5E8' };
    }
  };

  const renderRequestItem = (request: Request) => {
    const priorityBadge = getPriorityBadge(request.priority);
    const isUrgent = request.priority === RequestPriority.URGENT || request.priority === RequestPriority.HIGH;

    return (
      <View key={request.id} style={styles.requestCard}>
        {/* Header con código y badge */}
        <View style={styles.requestHeader}>
          <Text style={styles.requestCode}>{request.code || 'SIN-CODIGO'}</Text>
          <View style={styles.rightHeader}>
            {isUrgent && (
              <View style={styles.urgencyIcon}>
                <Image
                  source={require('../../assets/icons/clock.png')}
                  style={styles.urgencyIconImage}
                  resizeMode="contain"
                />
                <Text style={styles.urgencyText}>Urgente</Text>
              </View>
            )}
            <View style={[styles.estadoBadge, { backgroundColor: priorityBadge.backgroundColor }]}>
              <Text style={[styles.estadoText, { color: priorityBadge.color }]}>
                {priorityBadge.text}
              </Text>
            </View>
          </View>
        </View>

        {/* Título y descripción */}
        <Text style={styles.requestTitle}>{request.title || request.description}</Text>

        {/* Información del solicitante */}
        <View style={styles.requestInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Solicitante</Text>
            <Text style={styles.infoValue}>{request.userName || 'Usuario'}</Text>
            <Text style={styles.infoLabel}>Fecha</Text>
            <Text style={styles.infoValue}>{getRelativeTime(request.createdAt)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Departamento</Text>
            <Text style={styles.infoValue}>{request.department || 'General'}</Text>
            <Text style={styles.infoLabel}>Estado</Text>
            <Text style={styles.infoValue}>{request.status}</Text>
          </View>
        </View>

        {/* Botón de acción */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            // Change button color/text based on status if desired
            (request.status === RequestStatus.IN_PROGRESS) && { backgroundColor: '#10B981' }
          ]}
          onPress={() => {
            if (request.status === RequestStatus.IN_PROGRESS && onNavigateToSearch) {
              onNavigateToSearch(request.id);
            } else {
              onNavigateToReview && onNavigateToReview(request.id);
            }
          }}
        >
          <Text style={styles.actionButtonText}>
            {request.status === RequestStatus.IN_PROGRESS ? 'Gestionar Proveedores' : 'Revisar y Decidir'}
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
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>SOLICITUDES</Text>
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

      <View style={styles.row}>
        <Text style={styles.subtitle}>
          Gestión de solicitudes
        </Text>
        <View style={styles.pendingCounter}>
          <Image
            source={require('../../assets/icons/clock.png')}
            style={styles.pendingIcon}
            resizeMode="contain"
          />
          <Text style={styles.pendingText}>{filteredRequests.length} resultados</Text>
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
            placeholder="Buscar por código, solicitante..."
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
            onPress={() => { setCurrentFilter('all'); setShowFilters(false); }}
          >
            <Image
              source={require('../../assets/icons/document.png')}
              style={[styles.filterIcon, currentFilter === 'all' && styles.filterIconActive]}
              resizeMode="contain"
            />
            <Text style={[styles.filterText, currentFilter === 'all' && styles.filterTextActive]}>Todas</Text>
          </TouchableOpacity>

          <View style={styles.filterDivider} />

          <TouchableOpacity
            style={[styles.filterOption, currentFilter === 'pending' && styles.filterOptionActive]}
            onPress={() => { setCurrentFilter('pending'); setShowFilters(false); }}
          >
            <Image
              source={require('../../assets/icons/clock.png')}
              style={[styles.filterIcon, currentFilter === 'pending' && styles.filterIconActive]}
              resizeMode="contain"
            />
            <Text style={[styles.filterText, currentFilter === 'pending' && styles.filterTextActive]}>Pendientes / En Proceso</Text>
          </TouchableOpacity>

          <View style={styles.filterDivider} />

          <TouchableOpacity
            style={[styles.filterOption, currentFilter === 'completed' && styles.filterOptionActive]}
            onPress={() => { setCurrentFilter('completed'); setShowFilters(false); }}
          >
            <Image
              source={require('../../assets/icons/check.png')}
              style={[styles.filterIcon, currentFilter === 'completed' && styles.filterIconActive]}
              resizeMode="contain"
            />
            <Text style={[styles.filterText, currentFilter === 'completed' && styles.filterTextActive]}>Completadas / Rechazadas</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista de solicitudes */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#003E85" />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.requestsList}>
            {filteredRequests.map(renderRequestItem)}
            {filteredRequests.length === 0 && (
              <Text style={{ textAlign: 'center', marginTop: 20, color: '#999' }}>No se encontraron solicitudes.</Text>
            )}
          </View>
          <View style={styles.bottomSpacing} />
        </ScrollView>
      )}

      {/* Bottom Navigation */}
      <ManagerBottomNav
        currentScreen="Requests"
        onNavigateToDashboard={onNavigateToDashboard}
        onNavigateToRequests={() => { }}
        onNavigateToSuppliers={onNavigateToProveedores}
        onNavigateToProfile={onNavigateToProfile}
      />
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
    paddingBottom: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 4 },
    }),
  },
  headerContent: { alignItems: 'flex-start' },
  titleSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333333', flex: 1 },
  logoContainer: { alignItems: 'center' },
  logoImage: { width: 52, height: 52 },
  subtitle: { fontSize: 14, color: '#666666', flex: 1 },
  pendingCounter: { flexDirection: 'row', alignItems: 'center' },
  pendingIcon: { width: 16, height: 16, tintColor: '#666666', marginRight: 8 },
  pendingText: { fontSize: 14, color: '#666666', fontWeight: '500' },
  searchSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: isMobile ? 20 : 40, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: 12 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  searchIcon: { width: 20, height: 20, tintColor: '#666666', marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#333333' },
  filtersButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FB', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  filtersIcon: { width: 16, height: 16, tintColor: '#666666', marginRight: 6 },
  filtersText: { fontSize: 14, color: '#666666', fontWeight: '500' },
  filtersDropdown: { backgroundColor: '#FFFFFF', marginHorizontal: isMobile ? 20 : 40, borderRadius: 12, paddingVertical: 8, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 }, android: { elevation: 4 } }), marginBottom: 16 },
  filterOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  filterOptionActive: { backgroundColor: '#F0F8FF' },
  filterText: { fontSize: 14, color: '#333333', fontWeight: '500' },
  filterTextActive: { color: '#003E85', fontWeight: '600' },
  filterIcon: { width: 20, height: 20, tintColor: '#666666', marginRight: 12 },
  filterIconActive: { tintColor: '#003E85' },
  filterDivider: { height: 1, backgroundColor: '#F0F0F0', marginHorizontal: 16 },
  content: { flex: 1, paddingHorizontal: isMobile ? 20 : 40, paddingTop: 16 },
  requestsList: { gap: 16 },
  requestCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 }, android: { elevation: 3 } }) },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  requestCode: { fontSize: 18, fontWeight: 'bold', color: '#333333' },
  rightHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  urgencyIcon: { flexDirection: 'row', alignItems: 'center' },
  urgencyIconImage: { width: 16, height: 16, tintColor: '#FF9800', marginRight: 4 },
  urgencyText: { fontSize: 12, color: '#666666' },
  estadoBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  estadoText: { fontSize: 12, fontWeight: '600' },
  requestTitle: { fontSize: 16, fontWeight: '600', color: '#333333', marginBottom: 16, lineHeight: 22 },
  requestInfo: { gap: 8, marginBottom: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  infoLabel: { fontSize: 12, color: '#666666', minWidth: 80 },
  infoValue: { fontSize: 12, color: '#333333', fontWeight: '500', flex: 1 },
  actionButton: { backgroundColor: '#003E85', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  actionButtonText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  bottomSpacing: { height: 100 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: isMobile ? 20 : 40, marginBottom: 8, marginTop: 12, maxWidth: '100%' },
});