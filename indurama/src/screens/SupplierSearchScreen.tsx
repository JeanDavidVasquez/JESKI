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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../styles/theme';

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

  // Datos de ejemplo
  const suppliers = [
    {
      id: '1',
      name: 'TecnoPartes S.A.',
      location: 'Quito, Ecuador',
      tags: ['Materia Prima', 'Repuestos'],
      score: 95,
      email: 'contacto@tecnopartes.com',
      phone: '+593 2 123 4567',
      certifications: ['ISO 9001', 'ISO 14001'],
    },
    {
      id: '2',
      name: 'AceroAndino Cía. Ltda',
      location: 'Cuenca, Ecuador',
      tags: ['Metales'],
      score: 78,
      email: 'contacto@tecnopartes.com',
      phone: '+593 2 123 4567',
      certifications: [],
      requiresAction: 'Plan Acción Requerido',
    },
    {
      id: '3',
      name: 'AceroAndino Cía. Ltda',
      location: 'Cuenca, Ecuador',
      tags: ['Metales'],
      email: 'contacto@tecnopartes.com',
      phone: '+593 2 123 4567',
      certifications: [],
      status: 'Invitado',
    },
  ];

  const handleSelectSupplier = (supplierId: string) => {
    if (selectedSuppliers.includes(supplierId)) {
      setSelectedSuppliers(selectedSuppliers.filter(id => id !== supplierId));
    } else {
      setSelectedSuppliers([...selectedSuppliers, supplierId]);
    }
  };

  const availableSuppliers = suppliers.filter(s => !selectedSuppliers.includes(s.id));
  const selectedSuppliersData = suppliers.filter(s => selectedSuppliers.includes(s.id));

  const filteredSuppliers = activeTab === 'disponibles' ? availableSuppliers : selectedSuppliersData;

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
          <Text style={styles.headerTitle}>{requestId || 'SOL-2025-042'}</Text>
        </View>
        <Image
          source={require('../../assets/icono_indurama.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.content}>
        {/* Title and Description */}
        <Text style={styles.title}>BÚSQUEDA PROVEEDORES</Text>
        <Text style={styles.description}>
          Gestione el banco de proveedores y seleccione candidatos para cotización
        </Text>

        {/* Progress Steps */}
        <View style={styles.stepsContainer}>
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepComplete]}>
              <Image source={require('../../assets/icons/check.png')} style={styles.checkIcon} />
            </View>
            <Text style={styles.stepLabel}>Identificar{'\n'}Necesidad</Text>
          </View>

          <View style={styles.stepLine} />

          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepActive]}>
              <Text style={styles.stepNumber}>2</Text>
            </View>
            <Text style={[styles.stepLabel, styles.stepActiveLabel]}>Búsqueda</Text>
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

          <TouchableOpacity style={styles.filterButton}>
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
                {item.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
                {item.requiresAction && (
                  <View style={styles.tagWarning}>
                    <Text style={styles.tagWarningText}>{item.requiresAction}</Text>
                  </View>
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
                  <Text style={styles.contactText}>{item.phone}</Text>
                </View>
              </View>

              {/* Certifications and Actions */}
              <View style={styles.cardFooter}>
                <View style={styles.certificationsContainer}>
                  <Text style={styles.certLabel}>Certificaciones</Text>
                  <View style={styles.certTags}>
                    {item.certifications.length > 0 ? (
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
                  ) : item.score !== undefined && item.score >= 90 ? (
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
                  ) : item.requiresAction ? (
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
      </View>

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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
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
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingVertical: 16,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    marginBottom: 8,
  },
  stepComplete: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  stepActive: {
    borderColor: theme.colors.primary,
  },
  checkIcon: {
    width: 20,
    height: 20,
    tintColor: '#FFF',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  stepLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  stepActiveLabel: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 8,
    marginBottom: 32,
  },
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
});
