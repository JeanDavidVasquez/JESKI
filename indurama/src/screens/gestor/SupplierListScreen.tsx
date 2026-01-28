import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Text,
  Platform,
  Image,
  ActivityIndicator,
  Modal
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ResponsiveNavShell } from '../../components/ResponsiveNavShell';
import { db } from '../../services/firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { User, SupplierStatus } from '../../types';
import { useResponsive, BREAKPOINTS } from '../../styles/responsive';
import { SupplierResponseService } from '../../services/supplierResponseService';

interface SupplierListScreenProps {
  onNavigateToDashboard?: () => void;
  onNavigateToRequests?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToInvite?: () => void;
  onNavigateToDetail?: (supplierId: string) => void;
  onNavigateToNotifications?: () => void;
}

interface SupplierUI extends User {
  displayStatus: string;
  displayColor: string;
  displayTextColor: string;
  evalProgress: number;
  productTags?: string[]; // Added to display tags in the list
}

export const SupplierListScreen: React.FC<SupplierListScreenProps> = ({
  onNavigateToDashboard,
  onNavigateToRequests,
  onNavigateToProfile,
  onNavigateToInvite,
  onNavigateToDetail,
  onNavigateToNotifications,
}) => {
  const { width, isDesktopView } = useResponsive();
  const [searchText, setSearchText] = useState('');
  const [suppliers, setSuppliers] = useState<SupplierUI[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | SupplierStatus | 'invited'>('all');

  // Responsive Grid
  const getCardWidth = () => {
    if (width >= BREAKPOINTS.wide) return '31%';
    if (width >= BREAKPOINTS.desktop) return '48%';
    return '100%';
  };

  const containerMaxWidth = isDesktopView ? 1200 : undefined;

  // Helper to map status to Spanish and Colors
  const getStatusInfo = (s: User, progress: number) => {
    // Priority 1: Official SupplierStatus
    if (s.supplierStatus === 'active') return { label: 'Activo', color: '#DCFCE7', text: '#166534' };
    if (s.supplierStatus === 'suspended') return { label: 'Suspendido', color: '#FEE2E2', text: '#991B1B' };
    if (s.supplierStatus === 'rejected') return { label: 'Rechazado', color: '#FEF2F2', text: '#EF4444' };
    if (s.supplierStatus === 'epi_approved') return { label: 'EPI Aprobado', color: '#D1FAE5', text: '#065F46' };
    if (s.supplierStatus === 'epi_submitted') return { label: 'EPI Enviado', color: '#DBEAFE', text: '#1E40AF' };

    // Priority 2: Inferred from progress/Legacy
    if (progress > 0 && progress < 100) return { label: 'En Progreso', color: '#EFF6FF', text: '#2563EB' };
    if (progress === 100) return { label: 'Por Revisar', color: '#FFF7ED', text: '#C2410C' };

    return { label: 'Invitado', color: '#F3F4F6', text: '#4B5563' };
  };

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'proveedor')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const processedSuppliers: SupplierUI[] = [];
      const promises = snapshot.docs.map(async (doc) => {
        const userData = doc.data() as User;

        // Retrieve Evaluation progress
        let progress = 0;
        try {
          const latestEval = await SupplierResponseService.getSupplierEvaluation(doc.id);
          if (latestEval) {
            // Priority: Actual Score (if approved/rejected) > Completion %
            const evalData = latestEval as any;
            const hasScore = evalData.calculatedScore !== undefined || evalData.globalScore !== undefined;
            const isGraded = ['approved', 'rejected', 'epi_approved', 'epi_rejected'].includes(evalData.status || '');

            if (isGraded && hasScore) {
              progress = evalData.calculatedScore ?? evalData.globalScore ?? 0;
            } else {
              // Fallback to completion percentage
              const total = latestEval.progress?.totalQuestions || 10;
              const completed = latestEval.progress?.answeredQuestions || 0;
              progress = latestEval.progress?.percentageComplete ??
                (total > 0 ? (completed / total) * 100 : 0);
            }
          }
        } catch (e) {
          console.warn("Error loading eval for", doc.id);
        }

        const info = getStatusInfo(userData, progress);

        return {
          id: doc.id,
          ...userData,
          displayStatus: info.label,
          displayColor: info.color,
          displayTextColor: info.text,
          evalProgress: Math.round(progress),
          productTags: userData.productTags || [] // Map productTags
        } as SupplierUI;
      });

      const results = await Promise.all(promises);
      setSuppliers(results);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredSuppliers = suppliers.filter(s => {
    // Text Search
    const searchLower = searchText.toLowerCase();
    const matchesSearch =
      (s.firstName?.toLowerCase() || '').includes(searchLower) ||
      (s.lastName?.toLowerCase() || '').includes(searchLower) ||
      (s.companyName?.toLowerCase() || '').includes(searchLower) ||
      (s.email?.toLowerCase() || '').includes(searchLower) ||
      (s.productTags || []).some(t => t.toLowerCase().includes(searchLower)); // Allow searching by tags

    if (!matchesSearch) return false;

    // Status Filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'invited' && s.displayStatus === 'Invitado') return true;
      // Map Spanish UI label back to filter or check raw status
      if (statusFilter === 'active' && s.supplierStatus === 'active') return true;
      if (statusFilter === 'pending_epi' as any && s.displayStatus.includes('Progreso')) return true; // Loose mapping
      if (statusFilter === 'epi_submitted' as any && s.supplierStatus === 'epi_submitted') return true;

      // If strict match fails, try simple status match
      if (s.supplierStatus === (statusFilter as any)) return true;

      return false;
    }

    return true;
  });

  const navItems = [
    { key: 'Dashboard', label: 'Dashboard', iconName: 'home' as const, onPress: () => onNavigateToDashboard && onNavigateToDashboard() },
    { key: 'Requests', label: 'Solicitudes', iconName: 'document-text' as const, onPress: () => onNavigateToRequests && onNavigateToRequests() },
    { key: 'Suppliers', label: 'Proveedores', iconName: 'people' as const, onPress: () => { } },
    { key: 'Profile', label: 'Perfil', iconName: 'person' as const, onPress: () => onNavigateToProfile && onNavigateToProfile() },
  ];

  return (
    <ResponsiveNavShell
      currentScreen="Suppliers"
      navItems={navItems}
      logo={require('../../../assets/icono_indurama.png')}
      onNavigateToNotifications={onNavigateToNotifications}
    >
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={[styles.headerContent, { maxWidth: containerMaxWidth }]}>
          <Text style={styles.title}>PROVEEDORES</Text>
          <Text style={styles.subtitle}>Base de datos y estado de homologación</Text>
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
        {/* Search & Actions Bar */}
        <View style={[styles.actionBar, isDesktopView && styles.actionBarDesktop]}>
          <View style={[styles.searchContainer, isDesktopView && styles.searchContainerDesktop]}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar proveedor..."
              placeholderTextColor="#9CA3AF"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          <View style={[styles.actionButtons, isDesktopView && { width: 'auto', marginTop: 0 }]}>
            <TouchableOpacity
              style={[
                styles.addButtonMobile,
                isDesktopView && { flex: 0, flexGrow: 0, paddingHorizontal: 24, width: 'auto', minWidth: 180 }
              ]}
              onPress={onNavigateToInvite}
            >
              <Ionicons name="add" size={24} color="#FFF" />
              <Text style={styles.addButtonText}>{isDesktopView ? 'Nuevo Proveedor' : 'Nuevo'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, statusFilter !== 'all' && styles.filterButtonActive]}
              onPress={() => setShowFilterModal(true)}
            >
              <Ionicons name="options-outline" size={20} color={statusFilter !== 'all' ? "#003E85" : "#374151"} />
              <Text style={[styles.filterText, statusFilter !== 'all' && styles.filterTextActive]}>
                Filtros {statusFilter !== 'all' ? '•' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#003E85" />
            <Text style={{ marginTop: 10, color: '#666' }}>Cargando proveedores...</Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {filteredSuppliers.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.card,
                  { width: getCardWidth() as any },
                  isDesktopView && styles.cardDesktop
                ]}
                onPress={() => onNavigateToDetail?.(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.avatarContainer}>
                    {item.profileImageUrl ? (
                      <Image source={{ uri: item.profileImageUrl }} style={styles.avatar} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarInitials}>{(item.firstName || 'P').substring(0, 2).toUpperCase()}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.headerInfo}>
                    <Text style={styles.companyName} numberOfLines={1}>{item.companyName || 'Empresa Sin Nombre'}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: item.displayColor }]}>
                      <Text style={[styles.statusText, { color: item.displayTextColor }]}>{item.displayStatus}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.cardBody}>
                  {/* Tags Display */}
                  {item.productTags && item.productTags.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                      {item.productTags.slice(0, 3).map((tag, idx) => (
                        <View key={idx} style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                          <Text style={{ fontSize: 10, color: '#475569' }}>{tag}</Text>
                        </View>
                      ))}
                      {item.productTags.length > 3 && (
                        <Text style={{ fontSize: 10, color: '#64748B', alignSelf: 'center' }}>+{item.productTags.length - 3}</Text>
                      )}
                    </View>
                  )}

                  <Text style={styles.contactName} numberOfLines={1}>{item.firstName} {item.lastName}</Text>

                  <View style={styles.infoRow}>
                    <Ionicons name="mail-outline" size={14} color="#6B7280" />
                    <Text style={styles.infoText} numberOfLines={1}>{item.email}</Text>
                  </View>

                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Evaluación EPI</Text>
                      <Text style={styles.progressValue}>{item.evalProgress}%</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${item.evalProgress}%`, backgroundColor: item.evalProgress === 100 ? '#10B981' : '#3B82F6' }
                        ]}
                      />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            {filteredSuppliers.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No se encontraron proveedores</Text>
                <Text style={styles.emptySubtitle}>Intenta ajustar los filtros de búsqueda.</Text>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
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
              <Text style={styles.modalTitle}>Filtrar Proveedores</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterSectionTitle}>Estado</Text>
            <View style={styles.filterOptionsGrid}>
              {[
                { label: 'Todos', val: 'all' },
                { label: 'Invitado', val: 'invited' },
                { label: 'En Progreso', val: 'pending_epi' }, // Mapped
                { label: 'EPI Enviado', val: 'epi_submitted' },
                { label: 'Activo', val: 'active' },
                { label: 'Rechazado', val: 'rejected' },
              ].map((opt: any) => (
                <TouchableOpacity
                  key={opt.val}
                  style={[styles.filterOptionChip, statusFilter === opt.val && styles.filterOptionChipSelected]}
                  onPress={() => setStatusFilter(opt.val)}
                >
                  <Text style={[styles.filterOptionText, statusFilter === opt.val && styles.filterOptionTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.applyButton} onPress={() => setShowFilterModal(false)}>
              <Text style={styles.applyButtonText}>Ver Resultados</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  headerContent: {
    width: '100%',
    alignSelf: 'center'
  },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  addButtonDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#003E85',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    ...Platform.select({
      web: { cursor: 'pointer' },
      default: { elevation: 2 }
    })
  },
  content: { flex: 1, backgroundColor: '#F9FAFB' },
  scrollContent: { padding: 20 },
  actionBar: { marginBottom: 24, gap: 12 },
  actionBarDesktop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    flex: 1
  },
  searchContainerDesktop: { maxWidth: 400 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#111827' },
  actionButtons: { flexDirection: 'row', gap: 12 },
  addButtonMobile: {
    // flex: 1, // Remove flex: 1 to prevent forced equal width in row if not needed, let override handle it
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#003E85',
    borderRadius: 10,
    height: 44,
    gap: 6,
    paddingHorizontal: 12
  },
  addButtonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 16,
    gap: 8
  },
  filterButtonActive: { borderColor: '#003E85', backgroundColor: '#F0F9FF' },
  filterText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  filterTextActive: { color: '#003E85', fontWeight: '700' },

  // Grid
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16, // More rounded
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 0,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 2 }
    })
  },
  cardDesktop: {},
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  avatarContainer: { marginRight: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#F3F4F6' },
  avatarPlaceholder: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { fontSize: 20, fontWeight: '700', color: '#1E40AF' },
  headerInfo: { flex: 1, justifyContent: 'center' },
  companyName: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 4 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },

  cardBody: { marginTop: 4 },
  contactName: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 6 },
  infoText: { fontSize: 13, color: '#6B7280' },
  progressSection: { marginTop: 8, backgroundColor: '#F9FAFB', padding: 10, borderRadius: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' },
  progressValue: { fontSize: 11, fontWeight: '700', color: '#111827' },
  progressBarBg: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  centerContainer: { alignItems: 'center', justifyContent: 'center', padding: 40, width: '100%' },
  emptyState: { width: '100%', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '90%', maxWidth: 400, borderRadius: 16, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  filterSectionTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10 },
  filterOptionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterOptionChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  filterOptionChipSelected: { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' },
  filterOptionText: { fontSize: 13, color: '#4B5563' },
  filterOptionTextSelected: { color: '#1E40AF', fontWeight: '600' },
  applyButton: { backgroundColor: '#003E85', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  applyButtonText: { color: '#FFF', fontWeight: '600', fontSize: 15 }
});