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
import { theme } from '../../styles/theme';
import { useResponsive, BREAKPOINTS } from '../../styles/responsive';
import { RequestProcessStepper } from '../../components/RequestProcessStepper';
import { ProcessHeader } from '../../components/ProcessHeader';
import { getSuppliersList, SupplierSummary } from '../../services/supplierDataService';
import { getRequestById } from '../../services/requestService';
import { Request, User } from '../../types';
import { SupplierMatchingService, SupplierMatch } from '../../services/supplierMatchingService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';

interface SupplierSearchScreenProps {
  requestId?: string;
  onNavigateBack?: () => void;
  onContinueToQuotation?: (selectedIds: string[]) => void;
  onNavigateToDetail?: (supplierId: string) => void;
  onNavigateToInvite?: () => void;
}

interface ExtendedSupplier extends SupplierSummary {
  productCategories?: string[];
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
  const [suppliers, setSuppliers] = useState<ExtendedSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<Request | null>(null);

  const { width, isDesktopView } = useResponsive();

  const getCardWidth = () => {
    if (width >= BREAKPOINTS.wide) return '31%';
    if (width >= BREAKPOINTS.desktop) return '48%';
    return '100%';
  };

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [suppliersData, requestData] = await Promise.all([
          getSuppliersList(),
          requestId ? getRequestById(requestId) : Promise.resolve(null)
        ]);

        const mappedSuppliers: ExtendedSupplier[] = suppliersData.map(s => ({
          ...s,
          productCategories: (s as any).productCategories || (s as any).categorias || []
        }));

        setSuppliers(mappedSuppliers);

        if (requestData) {
          setRequest(requestData);
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

  const searchFilteredSuppliers = (list: ExtendedSupplier[]) => {
    if (!searchText.trim()) return list;
    const searchLower = searchText.toLowerCase();
    return list.filter(s =>
      s.name.toLowerCase().includes(searchLower) ||
      s.location.toLowerCase().includes(searchLower) ||
      s.email.toLowerCase().includes(searchLower) ||
      (s.tags && s.tags.some(tag => tag.toLowerCase().includes(searchLower))) ||
      (s.productCategories && s.productCategories.some(cat => cat.toLowerCase().includes(searchLower)))
    );
  };

  const filteredSuppliers = activeTab === 'disponibles'
    ? searchFilteredSuppliers(availableSuppliers)
    : searchFilteredSuppliers(selectedSuppliersData);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <StatusBar style="dark" />
      <ProcessHeader
        title={request?.code || 'SOLICITUD'}
        onBack={onNavigateBack}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.mainTitle}>BÚSQUEDA PROVEEDORES</Text>
        <Text style={styles.subTitle}>
          {request?.description || 'Gestione el banco de proveedores y seleccione candidatos.'}
        </Text>

        <RequestProcessStepper currentStep={2} />

        {/* Search Bar */}

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={[styles.searchContainer, isDesktopView && { maxWidth: 400 }]}>
            <Image source={require('../../../assets/icons/search.png')} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre, categoría..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.newButton} onPress={onNavigateToInvite}>
          <Image source={require('../../../assets/icons/plus.png')} style={styles.plusIcon} />
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

        {/* Supplier List - Responsive Grid */}
        <View style={styles.gridContainer}>
          {filteredSuppliers.map((item) => (
            <View
              key={item.id}
              style={[
                styles.card,
                { width: getCardWidth() as any }
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <View style={styles.locationRow}>
                    <Image source={require('../../../assets/icons/home.png')} style={styles.locationIcon} />
                    <Text style={styles.cardSubtitle}>{item.location}</Text>
                  </View>
                </View>
                {item.score !== undefined && (
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreText}>{item.score}</Text>
                    <Text style={styles.scorePTS}>PTS</Text>
                  </View>
                )}
              </View>

              {/* CATEGORÍAS MEJORADAS */}
              <View style={styles.cardFooter}>
                <View style={styles.categoriesSection}>
                  <Text style={styles.catLabel}>CATEGORÍAS</Text>
                  <View style={styles.catTagsRow}>
                    {item.productCategories && item.productCategories.length > 0 ? (
                      item.productCategories.slice(0, 4).map((cat, index) => (
                        <View key={index} style={styles.catTag}>
                          <Text style={styles.catTagText}>{cat.toUpperCase()}</Text>
                        </View>
                      ))
                    ) : (
                      <View style={[styles.catTag, styles.catTagGray]}>
                        <Text style={[styles.catTagText, styles.catTagTextGray]}>GENERAL</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Actions */}
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
                        <Image source={require('../../../assets/icons/close.png')} style={styles.removeIcon} />
                        <Text style={styles.removeButtonText}>Quitar</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
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
                          if (!selectedSuppliers.includes(item.id)) {
                            setTimeout(() => setActiveTab('seleccionados'), 300);
                          }
                        }}
                      >
                        <Image source={require('../../../assets/icons/check.png')} style={styles.selectIcon} />
                        <Text style={styles.selectButtonText}>
                          {selectedSuppliers.includes(item.id) ? 'Listo' : 'Seleccionar'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
        <View style={styles.bottomSpacing} />
      </ScrollView>

      <View style={styles.footerContainer}>
        <View style={styles.footerContent}>
          <TouchableOpacity
            style={[styles.continueButton, selectedSuppliers.length === 0 && styles.continueButtonDisabled]}
            onPress={() => {
              if (selectedSuppliers.length === 0) {
                Alert.alert('Atención', 'Seleccione al menos un proveedor');
                return;
              }
              if (onContinueToQuotation) onContinueToQuotation(selectedSuppliers);
            }}
          >
            <Text style={styles.continueButtonText}>
              Continuar a Cotización ({selectedSuppliers.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  // Header styles removed for standardization
  content: { padding: 20, maxWidth: 1200, alignSelf: 'center', width: '100%' },
  mainTitle: { ...theme.typography.styles.h3, fontSize: 22, color: '#333', marginBottom: 5 },
  subTitle: { ...theme.typography.styles.body, color: '#666', marginBottom: 20 },
  bottomSpacing: { height: 100 },
  searchRow: { marginBottom: 16 },

  // Grid
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: { width: 20, height: 20, tintColor: '#9CA3AF', marginRight: 8 },
  searchInput: { flex: 1, ...theme.typography.styles.body, color: '#333' },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    height: 44,
    marginBottom: 16,
  },
  plusIcon: { width: 16, height: 16, tintColor: '#FFF', marginRight: 8 },
  newButtonText: { ...theme.typography.styles.buttonSmall, color: '#FFF' },
  tabsContainer: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#E5E7EB', marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: theme.colors.primary },
  tabText: { ...theme.typography.styles.bodySemibold, color: '#9CA3AF' },
  tabTextActive: { color: theme.colors.primary },
  listContent: { paddingBottom: 20 },

  // Card Styles
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0F2FE', // Azul muy claro
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 20, ...theme.typography.styles.h3, color: theme.colors.primary },
  cardInfo: { flex: 1 },
  cardTitle: { ...theme.typography.styles.bodyLargeSemibold, color: '#1F2937', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationIcon: { width: 14, height: 14, tintColor: '#6B7280', marginRight: 4 },
  cardSubtitle: { ...theme.typography.styles.bodySmall, color: '#6B7280' },
  scoreBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  scoreText: { ...theme.typography.styles.bodyLargeSemibold, fontSize: 16, color: '#FFF' },
  scorePTS: { ...theme.typography.styles.small, fontSize: 8, color: '#FFF' },

  // CATEGORIAS STYLES (Bonito)
  cardFooter: { gap: 12 },
  categoriesSection: { marginBottom: 4 },
  catLabel: {
    ...theme.typography.styles.smallBold,
    color: '#9CA3AF',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  catTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catTag: {
    backgroundColor: '#E0F7FA', // Fondo Cyan/Azul muy suave
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B2EBF2', // Borde suave a juego
  },
  catTagGray: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  catTagText: {
    ...theme.typography.styles.smallBold,
    color: '#006064', // Texto oscuro para contraste
    letterSpacing: 0.5,
  },
  catTagTextGray: { color: '#6B7280' },

  // Buttons
  actionsContainer: { flexDirection: 'row', gap: 8, marginTop: 4 },
  infoButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  infoButtonText: { ...theme.typography.styles.captionBold, fontSize: 12, color: '#374151' },
  selectButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  selectButtonActive: { backgroundColor: '#10B981' }, // Verde cuando está activo
  selectIcon: { width: 14, height: 14, tintColor: '#FFF' },
  selectButtonText: { ...theme.typography.styles.captionBold, fontSize: 12, color: '#FFF' },
  removeButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  removeIcon: { width: 14, height: 14, tintColor: '#EF4444' },
  removeButtonText: { ...theme.typography.styles.captionBold, fontSize: 12, color: '#EF4444' },

  // Footer
  footerContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF',
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 10,
    zIndex: 100
  },
  footerContent: {
    padding: 20,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  continueButton: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  continueButtonText: { ...theme.typography.styles.buttonSmall, color: '#FFF' },
  continueButtonDisabled: { backgroundColor: '#9CA3AF' }
});