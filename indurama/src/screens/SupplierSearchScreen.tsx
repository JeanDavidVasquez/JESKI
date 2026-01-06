import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  FlatList,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../styles/theme';
import { getSuppliersList, SupplierSummary } from '../services/supplierDataService';
import { getRequestById } from '../services/requestService';
import { Request, User } from '../types';
import { SupplierMatchingService, SupplierMatch } from '../services/supplierMatchingService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

interface SupplierSearchScreenProps {
  requestId?: string;
  onNavigateBack?: () => void;
  onContinueToQuotation?: () => void;
  onNavigateToDetail?: (supplierId: string) => void;
  onNavigateToInvite?: () => void;
}

export const SupplierSearchScreen: React.FC<SupplierSearchScreenProps> = ({
  requestId,
  onNavigateBack,
  onContinueToQuotation,
  onNavigateToDetail,
  onNavigateToInvite,
}) => {
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<'disponibles' | 'seleccionados'>('disponibles');
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierSummary[]>([]);
  const [supplierUsers, setSupplierUsers] = useState<User[]>([]); // NEW: Full user data for matching
  const [supplierMatches, setSupplierMatches] = useState<SupplierMatch[]>([]); // NEW: Match results
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<Request | null>(null);
  const [minCompatibility, setMinCompatibility] = useState(20); // NEW: Minimum % to show

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Parallel fetch
        const [suppliersData, requestData] = await Promise.all([
          getSuppliersList(),
          requestId ? getRequestById(requestId) : Promise.resolve(null)
        ]);

        setSuppliers(suppliersData);

        if (requestData) {
          setRequest(requestData);

          // If request has criteria, load full user data and apply matching
          if (requestData.requiredBusinessType || requestData.requiredCategories?.length ||
            requestData.requiredTags?.length || requestData.customRequiredTags?.length) {

            // Load full supplier user data from Firestore
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const allUsers = usersSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as User[];

            // Filter only suppliers
            const supplierUsersList = allUsers.filter(u => u.role === 'proveedor');
            setSupplierUsers(supplierUsersList);

            // Apply matching algorithm
            const matches = SupplierMatchingService.matchSuppliers(requestData, supplierUsersList);
            setSupplierMatches(matches);
          }
        }
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [requestId]);

  const handleSelectSupplier = (supplierId: string) => {
    if (selectedSuppliers.includes(supplierId)) {
      setSelectedSuppliers(selectedSuppliers.filter(id => id !== supplierId));
    } else {
      setSelectedSuppliers([...selectedSuppliers, supplierId]);
    }
  };

  const availableSuppliers = suppliers.filter(s => !selectedSuppliers.includes(s.id));
  const selectedSuppliersData = suppliers.filter(s => selectedSuppliers.includes(s.id));

  // Apply search filter
  const searchFilteredSuppliers = (list: SupplierSummary[]) => {
    if (!searchText.trim()) return list;

    const searchLower = searchText.toLowerCase();
    return list.filter(s =>
      s.name.toLowerCase().includes(searchLower) ||
      s.location.toLowerCase().includes(searchLower) ||
      s.email.toLowerCase().includes(searchLower) ||
      (s.tags && s.tags.some(tag => tag.toLowerCase().includes(searchLower)))
    );
  };

  const filteredSuppliers = activeTab === 'disponibles'
    ? searchFilteredSuppliers(availableSuppliers)
    : searchFilteredSuppliers(selectedSuppliersData);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
            <Image
              source={require('../../assets/icons/arrow-left.png')}
              style={styles.backIcon}
            />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{request?.code || requestId || 'SOLICITUD'}</Text>
          </View>
        </View>
        <Image
          source={require('../../assets/icono_indurama.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.mainTitle}>BÚSQUEDA PROVEEDORES</Text>
        <Text style={styles.subTitle}>
          {request?.description || 'Gestione el banco de proveedores y seleccione candidatos para cotización'}
        </Text>

        {/* Progress Steps */}
        <View style={styles.stepsContainer}>
          <View style={styles.stepItem}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <Text style={styles.stepLabel}>Identificar{'\n'}Necesidad</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepActive]}>
              <Text style={[styles.stepNumber, styles.stepTextActive]}>2</Text>
            </View>
            <Text style={[styles.stepLabel, styles.stepLabelActive]}>Búsqueda</Text>
          </View>
          <View style={styles.stepLine} />
          <View style={styles.stepItem}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>3</Text>
            </View>
            <Text style={styles.stepLabel}>Cotización</Text>
          </View>
        </View>

        {/* Search and Actions */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Image source={require('../../assets/icons/search.png')} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar proveedores..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => alert('Filtros avanzados - Próximamente')}
          >
            <Image source={require('../../assets/icons/filter.png')} style={styles.filterIcon} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.newButton} onPress={onNavigateToInvite}>
          <Image source={require('../../assets/icons/plus.png')} style={styles.plusIcon} />
          <Text style={styles.newButtonText}>Nuevo Proveedor</Text>
        </TouchableOpacity>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'disponibles' && styles.tabActive]}
            onPress={() => setActiveTab('disponibles')}
          >
            <Text style={[styles.tabText, activeTab === 'disponibles' && styles.tabTextActive]}>
              Disponibles
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'seleccionados' && styles.tabActive]}
            onPress={() => setActiveTab('seleccionados')}
          >
            <Text style={[styles.tabText, activeTab === 'seleccionados' && styles.tabTextActive]}>
              Seleccionados
            </Text>
          </TouchableOpacity>
        </View>

        {/* Supplier List */}
        <FlatList
          data={filteredSuppliers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <View style={styles.locationRow}>
                    <Image source={require('../../assets/icons/home.png')} style={styles.locationIcon} />
                    <Text style={styles.cardSubtitle}>{item.location}</Text>
                  </View>
                </View>
                {item.status ? (
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                ) : item.score !== undefined ? (
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreText}>{item.score}</Text>
                    <Text style={styles.scorePTS}>PTS</Text>
                  </View>
                ) : (
                  <View style={styles.noScoreBadge}>
                    <Text style={styles.noScoreText}>N/D</Text>
                  </View>
                )}
              </View>

              {/* Tags */}
              <View style={styles.tagsContainer}>
                {item.tags && item.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
                {item.status && ( // changed from requiresAction to generic status usage if needed, or remove
                  // item.requiresAction logic was custom, SupplierSummary has generic 'status'
                  // For now, let's just show tag if it exists in tags
                  null
                )}
              </View>

              {/* Contact Info */}
              <View style={styles.contactContainer}>
                <View style={styles.contactRow}>
                  <Image source={require('../../assets/icons/inbox.png')} style={styles.contactIcon} />
                  <Text style={styles.contactText}>{item.email}</Text>
                </View>
                <View style={styles.contactRow}>
                  <Image source={require('../../assets/icons/profile.png')} style={styles.contactIcon} />
                  <Text style={styles.contactText}>{item.phone || 'N/A'}</Text>
                </View>
              </View>

              {/* Certifications and Actions */}
              <View style={styles.cardFooter}>
                <View style={styles.certificationsContainer}>
                  <Text style={styles.certLabel}>Certificaciones</Text>
                  <View style={styles.certTags}>
                    {item.certifications && item.certifications.length > 0 ? (
                      item.certifications.map((cert, index) => (
                        <View key={index} style={styles.certTag}>
                          <Text style={styles.certTagText}>{cert}</Text>
                        </View>
                      ))
                    ) : (
                      <View style={styles.certTag}>
                        <Text style={styles.certTagText}>Sin Certificaciones</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.actionsContainer}>
                  {activeTab === 'seleccionados' ? (
                    <>
                      <TouchableOpacity
                        style={styles.infoButton}
                        onPress={() => onNavigateToDetail && onNavigateToDetail(item.id)}
                      >
                        <Text style={styles.infoButtonText}>Ver Info</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleSelectSupplier(item.id)}
                      >
                        <Image
                          source={require('../../assets/icons/close.png')}
                          style={styles.removeIcon}
                        />
                        <Text style={styles.removeButtonText}>Quitar de lista</Text>
                      </TouchableOpacity>
                    </>
                  ) : item.score !== undefined && item.score >= 0 ? (
                    <>
                      <TouchableOpacity
                        style={styles.infoButton}
                        onPress={() => onNavigateToDetail && onNavigateToDetail(item.id)}
                      >
                        <Text style={styles.infoButtonText}>Ver Info</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.selectButton, selectedSuppliers.includes(item.id) && styles.selectButtonActive]}
                        onPress={() => {
                          handleSelectSupplier(item.id);
                          // Automatically switch to 'Seleccionados' tab after selecting
                          if (!selectedSuppliers.includes(item.id)) {
                            setTimeout(() => setActiveTab('seleccionados'), 300);
                          }
                        }}
                      >
                        <Image
                          source={require('../../assets/icons/check.png')}
                          style={styles.selectIcon}
                        />
                        <Text style={styles.selectButtonText}>
                          {selectedSuppliers.includes(item.id) ? 'Seleccionado' : 'Seleccionar'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : item.score !== undefined && item.score >= 0 ? (
                    <>
                      <TouchableOpacity
                        style={styles.infoButton}
                        onPress={() => onNavigateToDetail && onNavigateToDetail(item.id)}
                      >
                        <Text style={styles.infoButtonText}>Ver Info</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => onNavigateToDetail && onNavigateToDetail(item.id)}
                      >
                        <Image source={require('../../assets/icons/plus.png')} style={styles.addIcon} />
                        <Text style={styles.addButtonText}>Añadir</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={styles.infoButtonFull}
                      onPress={() => onNavigateToDetail && onNavigateToDetail(item.id)}
                    >
                      <Text style={styles.infoButtonText}>Ver Info</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.continueButton} onPress={onContinueToQuotation}>
          <Text style={styles.continueButtonText}>Continuar a Cotizacion</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#1F2937',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  logo: {
    width: 100,
    height: 30,
  },
  content: { padding: 20 },
  mainTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  subTitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  bottomSpacing: { height: 100 },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 16,
  },
  stepsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  stepItem: { alignItems: 'center', width: 80 },
  stepCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#00BFFF', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', marginBottom: 5 },
  stepActive: { backgroundColor: '#E0F7FF' },
  stepNumber: { color: '#00BFFF', fontWeight: 'bold', fontSize: 16 },
  stepTextActive: { color: '#003E85' },
  stepLabel: { fontSize: 10, textAlign: 'center', color: '#666' },
  stepLabelActive: { color: '#003E85', fontWeight: 'bold' },
  stepLine: { height: 1, backgroundColor: '#00BFFF', flex: 1, marginTop: -20 },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: '#9CA3AF',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: '#FFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterIcon: {
    width: 20,
    height: 20,
    tintColor: '#333',
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    height: 44,
    marginBottom: 16,
  },
  plusIcon: {
    width: 16,
    height: 16,
    tintColor: '#FFF',
    marginRight: 8,
  },
  newButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  contentContainer: {
    padding: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    width: 14,
    height: 14,
    tintColor: '#6B7280',
    marginRight: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  scoreBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scorePTS: {
    fontSize: 10,
    color: '#FFF',
  },
  noScoreBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  noScoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  statusBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
  },
  tagWarning: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagWarningText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E',
  },
  contactContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactIcon: {
    width: 16,
    height: 16,
    tintColor: '#6B7280',
    marginRight: 8,
  },
  contactText: {
    fontSize: 12,
    color: '#4B5563',
  },
  cardFooter: {
    gap: 12,
  },
  certificationsContainer: {
    gap: 8,
  },
  certLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  certTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  certTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  certTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4B5563',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  infoButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  infoButtonFull: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  infoButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  selectButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  selectButtonActive: {
    backgroundColor: '#10B981',
  },
  selectIcon: {
    width: 14,
    height: 14,
    tintColor: '#FFF',
  },
  selectButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addIcon: {
    width: 14,
    height: 14,
    tintColor: '#374151',
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  removeButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  removeIcon: {
    width: 14,
    height: 14,
    tintColor: '#EF4444',
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  continueButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  subDescription: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 20,
    fontStyle: 'italic'
  },
});
