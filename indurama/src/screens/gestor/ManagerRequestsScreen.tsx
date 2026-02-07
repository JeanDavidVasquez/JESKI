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
  ActivityIndicator,
  Modal
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ResponsiveNavShell } from '../../components/ResponsiveNavShell';
import { getAllRequests, getRelativeTime } from '../../services/requestService';
import { Request, RequestStatus, RequestPriority } from '../../types';
import { useResponsive, BREAKPOINTS } from '../../styles/responsive';
import { Ionicons } from '@expo/vector-icons';

interface ManagerRequestsScreenProps {
  onNavigateBack?: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateToProveedores?: () => void;
  onNavigateToSearch?: (requestId: string) => void;
  onNavigateToReview?: (requestId: string) => void;
  onNavigateToProfile?: () => void;
  onNavigateToQuotationCompare?: (requestId: string) => void;
  onNavigateToPayment?: (requestId: string) => void;
  onNavigateToNotifications?: () => void;
  initialFilter?: 'all' | 'pending' | 'completed';
}

export const ManagerRequestsScreen: React.FC<ManagerRequestsScreenProps> = ({
  onNavigateToDashboard,
  onNavigateToProveedores,
  onNavigateToReview,
  onNavigateToSearch,
  onNavigateToProfile,
  onNavigateToQuotationCompare,
  onNavigateToPayment,
  onNavigateToNotifications,
  initialFilter = 'pending'
}) => {
  const { width, isDesktopView, isMobileView } = useResponsive();
  const [searchText, setSearchText] = useState('');

  // Advanced Filter Logic
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>(initialFilter);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<RequestPriority | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');

  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  // Responsive Grid Logic
  const getCardWidth = () => {
    if (width >= BREAKPOINTS.wide) return '31%';
    if (width >= BREAKPOINTS.desktop) return '48%';
    return '100%';
  };

  const containerMaxWidth = isDesktopView ? 1400 : undefined;

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

  /* 
   * Dynamic Priority Calculation Logic 
   * Calculates 'Effective Priority' based on static priority and deadline proximity.
   */
  const calculateEffectivePriority = (req: Request): { label: string; color: string; bg: string; level: number } => {
    const now = new Date();
    let priorityLevel = 0; // 0=Low, 1=Medium, 2=High, 3=Urgent

    // 1. Initial Mapping from Static Priority
    switch (req.priority) {
      case RequestPriority.URGENT: priorityLevel = 3; break;
      case RequestPriority.HIGH: priorityLevel = 2; break;
      case RequestPriority.MEDIUM: priorityLevel = 1; break;
      case RequestPriority.LOW: priorityLevel = 0; break;
    }

    // 2. Deadline Escalation (Only for active requests)
    if (req.status !== RequestStatus.COMPLETED && req.status !== RequestStatus.REJECTED && req.status !== RequestStatus.AWARDED && req.dueDate) {
      const dueDate = req.dueDate instanceof Date ? req.dueDate : (req.dueDate as any).toDate?.() || new Date(req.dueDate);
      const hoursRemaining = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursRemaining < 24) {
        priorityLevel = 3; // Escalation to Urgent if < 24h
      } else if (hoursRemaining < 72 && priorityLevel < 2) {
        priorityLevel = 2; // Escalation to High if < 3 days
      }
    }

    // 3. Return Style Info (Polished Colors)
    switch (priorityLevel) {
      case 3: return { label: 'URGENTE', color: '#B91C1C', bg: '#FECACA', level: 3 }; // Darker Red
      case 2: return { label: 'ALTA', color: '#C2410C', bg: '#FFEDD5', level: 2 }; // Orange
      case 1: return { label: 'MEDIA', color: '#1D4ED8', bg: '#DBEAFE', level: 1 }; // Blue
      default: return { label: 'BAJA', color: '#15803D', bg: '#DCFCE7', level: 0 }; // Green
    }
  };

  const statusToSpanish = (s: RequestStatus | string): string => {
    switch (s) {
      case RequestStatus.PENDING: return 'Pendiente';
      case RequestStatus.IN_PROGRESS: return 'En Progreso';
      case RequestStatus.QUOTING: return 'Cotizando';
      case 'cotizacion': return 'Cotizando';
      case RequestStatus.AWARDED: return 'Adjudicada';
      case 'adjudicado': return 'Adjudicada';
      case RequestStatus.COMPLETED: return 'Completada';
      case RequestStatus.REJECTED: return 'Rechazada';
      case RequestStatus.DRAFT: return 'Borrador';
      case RequestStatus.IN_REVIEW: return 'En Revisión';
      case RequestStatus.APPROVED: return 'Aprobada';
      case RequestStatus.CANCELLED: return 'Cancelada';
      case RequestStatus.RECTIFICATION_REQUIRED: return 'Rectificación';
      default: return s;
    }
  };

  const getFilteredRequests = () => {
    return requests.filter(request => {
      // 1. Search Logic
      const searchLower = searchText.toLowerCase();
      const matchesSearch =
        (request.title?.toLowerCase() || '').includes(searchLower) ||
        (request.userName?.toLowerCase() || '').includes(searchLower) ||
        (request.code?.toLowerCase() || '').includes(searchLower) ||
        (request.department?.toLowerCase() || '').includes(searchLower);

      if (!matchesSearch) return false;

      // 2. Tab Filter Logic (High Level)
      let matchesTab = true;
      if (activeTab === 'pending') {
        matchesTab = [RequestStatus.PENDING, RequestStatus.IN_PROGRESS, RequestStatus.QUOTING, 'cotizacion'].includes(request.status as any);
      } else if (activeTab === 'completed') {
        matchesTab = [RequestStatus.COMPLETED, RequestStatus.REJECTED, RequestStatus.AWARDED, 'adjudicado'].includes(request.status as any);
      }

      if (!matchesTab) return false;

      // 3. Advanced Filters (Priority & Specific Status)
      if (priorityFilter !== 'all' && request.priority !== priorityFilter) return false;
      if (statusFilter !== 'all' && request.status !== statusFilter) return false;

      return true;
    });
  };

  const filteredRequests = getFilteredRequests();

  const renderRequestItem = (request: Request) => {
    const priorityInfo = calculateEffectivePriority(request);
    const cardWidth = getCardWidth();
    const statusEs = statusToSpanish(request.status);

    // Determine card styling based on status/priority
    let borderLeftColor = priorityInfo.color;
    // Status overrides for border color for visual clarity
    if (request.status === RequestStatus.QUOTING || (request.status as string) === 'cotizacion') borderLeftColor = '#F59E0B'; // Amber
    if (request.status === RequestStatus.AWARDED || (request.status as string) === 'adjudicado') borderLeftColor = '#8B5CF6'; // Purple
    if (request.status === RequestStatus.COMPLETED) borderLeftColor = '#10B981'; // Green

    const getPhaseLabel = (status: RequestStatus | string) => {
      switch (status) {
        case RequestStatus.PENDING: return 'Fase 1: Identificación';
        case RequestStatus.IN_PROGRESS: return 'Fase 2: Búsqueda';
        case RequestStatus.QUOTING: return 'Fase 3: Cotización';
        case 'cotizacion': return 'Fase 3: Cotización';
        case RequestStatus.AWARDED: return 'Fase 4: Adjudicada';
        case 'adjudicado': return 'Fase 4: Adjudicada';
        case RequestStatus.COMPLETED: return 'Fase 4: Finalizada';
        default: return `Estado: ${statusEs}`;
      }
    };

    const getPhaseColor = (status: RequestStatus | string) => {
      switch (status) {
        case RequestStatus.PENDING: return { bg: '#DBEAFE', text: '#1E40AF' }; // Blue (Fase 1)
        case RequestStatus.IN_PROGRESS: return { bg: '#D1FAE5', text: '#065F46' }; // Teal (Fase 2)
        case RequestStatus.QUOTING: return { bg: '#FEF3C7', text: '#92400E' }; // Amber (Fase 3)
        case 'cotizacion': return { bg: '#FEF3C7', text: '#92400E' };
        case RequestStatus.AWARDED: return { bg: '#E9D5FF', text: '#6B21A8' }; // Purple (Fase 4)
        case 'adjudicado': return { bg: '#E9D5FF', text: '#6B21A8' };
        case RequestStatus.COMPLETED: return { bg: '#F3F4F6', text: '#1F2937' }; // Gray (Finalizada)
        default: return { bg: '#F3F4F6', text: '#4B5563' };
      }
    };

    const phaseStyle = getPhaseColor(request.status);

    return (
      <TouchableOpacity
        key={request.id}
        style={[
          styles.requestCard,
          { width: cardWidth as any, borderLeftColor },
          isDesktopView && styles.requestCardDesktop
        ]}
        activeOpacity={0.7}
        onPress={() => {
          if (
            (request.status === RequestStatus.QUOTING ||
              (request.status as string) === 'cotizacion') &&
            onNavigateToQuotationCompare &&
            request.status !== RequestStatus.COMPLETED
          ) {
            onNavigateToQuotationCompare(request.id);
          } else if (
            (request.status === RequestStatus.COMPLETED ||
              (request.status as string) === 'finalizada' ||
              request.status === RequestStatus.AWARDED ||
              (request.status as string) === 'adjudicado') &&
            onNavigateToPayment
          ) {
            onNavigateToPayment(request.id);
          } else if (request.status === RequestStatus.IN_PROGRESS && onNavigateToSearch) {
            onNavigateToSearch(request.id);
          } else {
            onNavigateToReview && onNavigateToReview(request.id);
          }
        }}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.priorityBadge, { backgroundColor: priorityInfo.bg }]}>
            <Text style={[styles.priorityText, { color: priorityInfo.color }]}>{priorityInfo.label}</Text>
          </View>
          <Text style={styles.dateText}>{getRelativeTime(request.createdAt)}</Text>
        </View>

        <Text style={styles.requestTitle} numberOfLines={2}>{request.title || request.description}</Text>

        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(request.userName || 'U').substring(0, 2).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.userName} numberOfLines={1}>{request.userName || 'Usuario'}</Text>
            <Text style={styles.department} numberOfLines={1}>
              {request.companyIdentifier ? `${request.companyIdentifier} · ` : ''}
              {request.department || 'General'}
            </Text>
          </View>
        </View>

        <View style={styles.actionSection}>
          <View style={{
            backgroundColor: phaseStyle.bg,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            alignSelf: 'flex-start'
          }}>
            <Text style={{ fontWeight: '700', color: phaseStyle.text, fontSize: 11 }}>
              {getPhaseLabel(request.status)}
            </Text>
          </View>

          <View style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Gestionar</Text>
            <Ionicons name="arrow-forward" size={16} color="#003E85" />
          </View>
        </View>
      </TouchableOpacity >
    );
  };

  const navItems = [
    { key: 'Dashboard', label: 'Dashboard', iconName: 'home' as const, onPress: () => onNavigateToDashboard?.() },
    { key: 'Requests', label: 'Solicitudes', iconName: 'document-text' as const, onPress: () => { } },
    { key: 'Suppliers', label: 'Proveedores', iconName: 'people' as const, onPress: () => onNavigateToProveedores?.() },
    { key: 'Profile', label: 'Perfil', iconName: 'person' as const, onPress: () => onNavigateToProfile?.() },
  ];

  return (
    <ResponsiveNavShell
      currentScreen="Requests"
      navItems={navItems}
      logo={require('../../../assets/icono_indurama.png')}
      onNavigateToNotifications={onNavigateToNotifications}
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerContent, { maxWidth: containerMaxWidth }]}>
          <Text style={styles.title}>SOLICITUDES</Text>
          <Text style={styles.subtitle}>Gestión completa y seguimiento</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { maxWidth: containerMaxWidth, alignSelf: isDesktopView ? 'center' : undefined, width: '100%' }
        ]}
      >
        {/* Search & Filter Bar */}
        <View style={[styles.controlsBar, isDesktopView && styles.controlsBarDesktop]}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar solicitud..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.filterGroup}>
            {/* Main Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.filterTab, activeTab === 'all' && styles.filterTabActive]}
                onPress={() => setActiveTab('all')}
              >
                <Text style={[styles.filterTabText, activeTab === 'all' && styles.filterTabTextActive]}>Todas</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, activeTab === 'pending' && styles.filterTabActive]}
                onPress={() => setActiveTab('pending')}
              >
                <Text style={[styles.filterTabText, activeTab === 'pending' && styles.filterTabTextActive]}>Pendientes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterTab, activeTab === 'completed' && styles.filterTabActive]}
                onPress={() => setActiveTab('completed')}
              >
                <Text style={[styles.filterTabText, activeTab === 'completed' && styles.filterTabTextActive]}>Completadas</Text>
              </TouchableOpacity>
            </View>

            {/* Advanced Filter Button */}
            <TouchableOpacity style={styles.advFilterBtn} onPress={() => setShowFilterModal(true)}>
              <Ionicons name="options-outline" size={20} color="#374151" />
              {isDesktopView && <Text style={styles.advFilterText}>Más Filtros</Text>}
              {(priorityFilter !== 'all' || statusFilter !== 'all') && <View style={styles.filterBadgeDot} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Filters Summary */}
        {(priorityFilter !== 'all' || statusFilter !== 'all') && (
          <View style={styles.activeFiltersRow}>
            <Text style={styles.activeFilterLabel}>Filtros activos:</Text>
            {priorityFilter !== 'all' && (
              <TouchableOpacity style={styles.activeFilterChip} onPress={() => setPriorityFilter('all')}>
                <Text style={styles.activeFilterText}>Prioridad: {priorityFilter /* TODO: Translate if needed via helper */}</Text>
                <Ionicons name="close-circle" size={16} color="#003E85" />
              </TouchableOpacity>
            )}
            {statusFilter !== 'all' && (
              <TouchableOpacity style={styles.activeFilterChip} onPress={() => setStatusFilter('all')}>
                <Text style={styles.activeFilterText}>Estado: {statusToSpanish(statusFilter)}</Text>
                <Ionicons name="close-circle" size={16} color="#003E85" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => { setPriorityFilter('all'); setStatusFilter('all'); }}>
              <Text style={styles.clearFiltersText}>Limpiar todo</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#003E85" />
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {filteredRequests.map(renderRequestItem)}
            {filteredRequests.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>No se encontraron solicitudes</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowFilterModal(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros Avanzados</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterSectionTitle}>Prioridad</Text>
            <View style={styles.filterOptionsGrid}>
              {[
                { label: 'Todas', val: 'all' },
                { label: 'Urgente', val: RequestPriority.URGENT },
                { label: 'Alta', val: RequestPriority.HIGH },
                { label: 'Media', val: RequestPriority.MEDIUM },
                { label: 'Baja', val: RequestPriority.LOW },
              ].map(p => (
                <TouchableOpacity
                  key={p.label}
                  style={[styles.filterOptionChip, priorityFilter === p.val && styles.filterOptionChipSelected]}
                  onPress={() => setPriorityFilter(p.val as any)}
                >
                  <Text style={[styles.filterOptionText, priorityFilter === p.val && styles.filterOptionTextSelected]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterSectionTitle}>Estado Específico</Text>
            <View style={styles.filterOptionsGrid}>
              {['all', RequestStatus.PENDING, RequestStatus.IN_PROGRESS, RequestStatus.QUOTING, RequestStatus.AWARDED, RequestStatus.COMPLETED, RequestStatus.REJECTED].map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.filterOptionChip, statusFilter === s && styles.filterOptionChipSelected]}
                  onPress={() => setStatusFilter(s as any)}
                >
                  <Text style={[styles.filterOptionText, statusFilter === s && styles.filterOptionTextSelected]}>
                    {s === 'all' ? 'Todos' : statusToSpanish(s)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.applyButton} onPress={() => setShowFilterModal(false)}>
              <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </ResponsiveNavShell>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  headerContent: {
    width: '100%',
    // alignSelf: 'center' 
  },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },

  content: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 20 },

  controlsBar: { marginBottom: 16, gap: 16 },
  controlsBarDesktop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    flex: 1,
    maxWidth: 400
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#111827' },

  filterGroup: { flexDirection: 'row', gap: 10, alignItems: 'center' },

  tabContainer: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 8, padding: 4 },
  filterTab: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  filterTabActive: { backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  filterTabText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  filterTabTextActive: { color: '#003E85', fontWeight: '600' },

  advFilterBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 8, height: 44, paddingHorizontal: 12, gap: 6, position: 'relative'
  },
  advFilterText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  filterBadgeDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },

  activeFiltersRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 20 },
  activeFilterLabel: { fontSize: 13, color: '#6B7280' },
  activeFilterChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DBEAFE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6 },
  activeFilterText: { fontSize: 12, color: '#1E40AF', fontWeight: '600' },
  clearFiltersText: { fontSize: 12, color: '#EF4444', textDecorationLine: 'underline', marginLeft: 8 },

  // Grid
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },

  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16, // Smoother
    padding: 20,
    borderLeftWidth: 4,
    marginBottom: 0,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 3 }
    })
  },
  requestCardDesktop: {
    // 
  },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  priorityText: { fontSize: 11, fontWeight: '700' },
  dateText: { fontSize: 12, color: '#9CA3AF' },

  requestTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16, lineHeight: 24, height: 48 },

  userInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarText: { color: '#003E85', fontWeight: '700', fontSize: 14 },
  userName: { fontSize: 13, fontWeight: '600', color: '#374151' },
  department: { fontSize: 12, color: '#6B7280' },

  actionSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusLabel: { fontSize: 12, color: '#6B7280' },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionButtonText: { fontSize: 13, fontWeight: '600', color: '#003E85' },

  centerContainer: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyState: { width: '100%', alignItems: 'center', padding: 40 },
  emptyText: { color: '#9CA3AF', marginTop: 12 },

  bottomSpacing: { height: 100 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '90%', maxWidth: 400, borderRadius: 16, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  filterSectionTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10, marginTop: 10 },
  filterOptionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterOptionChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  filterOptionChipSelected: { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' },
  filterOptionText: { fontSize: 13, color: '#4B5563' },
  filterOptionTextSelected: { color: '#1E40AF', fontWeight: '600' },
  applyButton: { backgroundColor: '#003E85', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  applyButtonText: { color: '#FFF', fontWeight: '600', fontSize: 15 }
});