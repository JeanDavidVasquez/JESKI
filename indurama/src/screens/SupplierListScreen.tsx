import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Text,
  Image,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../styles/theme';
import { ManagerBottomNav } from '../components/ManagerBottomNav';
import { db } from '../services/firebaseConfig';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { EpiService } from '../services/epiService';
import { User } from '../types';

interface SupplierListScreenProps {
  onNavigateToDashboard?: () => void;
  onNavigateToRequests?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToInvite?: () => void;
  onNavigateToDetail?: (supplierId: string) => void;
}

interface SupplierUI extends User {
  evalStatus?: 'Invitado' | 'Progreso' | 'Pendiente' | 'Completado';
  evalProgress?: number;
  evalScore?: number;
  evalColor?: string;
  evalTextColor?: string;
}

export const SupplierListScreen: React.FC<SupplierListScreenProps> = ({
  onNavigateToDashboard,
  onNavigateToRequests,
  onNavigateToProfile,
  onNavigateToInvite,
  onNavigateToDetail,
}) => {
  const [searchText, setSearchText] = useState('');
  const [suppliers, setSuppliers] = useState<SupplierUI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escuchar proveedores en tiempo real
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'proveedor')
      // orderBy('createdAt', 'desc') // Requires index, remove if error
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const loadedSuppliers: SupplierUI[] = [];
      // Import dynamic to avoid cycle, or just use if imported at top
      const { SupplierResponseService } = require('../services/supplierResponseService');

      for (const doc of snapshot.docs) {
        const userData = doc.data() as User;
        const supplier: SupplierUI = {
          id: doc.id,
          ...userData,
          // Default status
          evalStatus: 'Invitado',
          evalColor: '#E5E7EB',
          evalTextColor: '#374151',
          evalProgress: 0
        };

        // Fetch evaluations for this supplier to update status
        try {
          // Use SupplierResponseService to get the correct evaluation data (from supplier_evaluations or epi_submissions)
          const latestEval = await SupplierResponseService.getSupplierEvaluation(doc.id);

          if (latestEval) {
            // Calculate progress if missing
            const totalSections = latestEval.totalSections || (latestEval.progress ? (latestEval.progress.calidadQuestions + latestEval.progress.abastecimientoQuestions) : 10);
            const completedSections = latestEval.completedSections || (latestEval.progress ? (latestEval.progress.calidadAnswered + latestEval.progress.abastecimientoAnswered) : 0);

            // Prefer existing percentageComplete, fallback to calc
            let p = latestEval.progress?.percentageComplete;
            if (p === undefined || p === 0) {
              if (totalSections > 0) p = (completedSections / totalSections) * 100;
              else p = 0;
            }
            supplier.evalProgress = Math.round(p || 0);

            // Map status based on evaluation state
            if (latestEval.status === 'approved' || latestEval.status === 'epi_approved') {
              supplier.evalStatus = 'Completado';
              supplier.evalColor = '#D1FAE5';
              supplier.evalTextColor = '#065F46';
              supplier.evalScore = Math.round(latestEval.globalScore || latestEval.calculatedScore || 0);
              supplier.evalProgress = 100;
            }
            else if (latestEval.status === 'submitted' || latestEval.status === 'epi_submitted') {
              supplier.evalStatus = 'Pendiente';
              supplier.evalColor = '#FEF3C7'; // yellow
              supplier.evalTextColor = '#92400E';
              supplier.evalScore = Math.round(latestEval.globalScore || latestEval.calculatedScore || 0);
              // If fully submitted, assume near 100% or use actual
              if (supplier.evalProgress < 100) supplier.evalProgress = 100;
            }
            else if (['in_progress', 'draft', 'rejected', 'revision_requested'].includes(latestEval.status)) {
              supplier.evalStatus = 'Progreso';
              supplier.evalColor = '#BFDBFE';
              supplier.evalTextColor = '#1E40AF';
            }
          }
        } catch (e) {
          console.error('Error fetching evaluation for supplier:', doc.id, e);
        }

        loadedSuppliers.push(supplier);
      }

      setSuppliers(loadedSuppliers);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredSuppliers = suppliers.filter(s => {
    const term = searchText.toLowerCase();
    const name = (s.companyName || s.firstName + ' ' + s.lastName).toLowerCase();
    const email = s.email.toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PROVEEDORES</Text>
        <Image
          source={require('../../assets/icono_indurama.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
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

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.newButton} onPress={onNavigateToInvite}>
            <Image source={require('../../assets/icons/plus.png')} style={styles.buttonIcon} />
            <Text style={styles.newButtonText}>Nuevo Proveedor</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterButton}>
            <Image source={require('../../assets/icons/filter.png')} style={[styles.buttonIcon, { tintColor: '#000' }]} />
            <Text style={styles.filterButtonText}>Filtros</Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        {loading ? (
          <ActivityIndicator size="large" color="#003E85" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={filteredSuppliers}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', color: '#999', marginTop: 20 }}>No hay proveedores registrados aún.</Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => onNavigateToDetail && onNavigateToDetail(item.id)}
              >
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <Image source={require('../../assets/icons/home.png')} style={styles.buildingIcon} />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{item.companyName || `${item.firstName} ${item.lastName}`}</Text>
                    <Text style={styles.cardSubtitle}>{item.email}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: item.evalColor }]}>
                    <Text style={[styles.statusText, { color: item.evalTextColor }]}>{item.evalStatus}</Text>
                  </View>
                </View>

                {/* Tags (Placeholder for now) */}
                <View style={styles.tagsContainer}>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{item.category || 'General'}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Bottom Section */}
                {item.evalStatus === 'Progreso' || item.evalStatus === 'Invitado' ? (
                  <View style={styles.progressSection}>
                    <Text style={styles.progressLabel}>Progreso de Evaluación</Text>
                    <View style={styles.progressRow}>
                      <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${item.evalProgress}%` }]} />
                      </View>
                      <Text style={styles.progressText}>{item.evalProgress}%</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.scoreSection}>
                    <View style={styles.tagsContainer} />
                    <View style={styles.scoreContainer}>
                      <Text style={styles.scoreLabel}>Puntuación</Text>
                      <Text style={[styles.scoreValue, { color: '#059669' }]}>{item.evalScore || 0}/100</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Bottom Navigation */}
      <ManagerBottomNav
        currentScreen="Suppliers"
        onNavigateToDashboard={() => onNavigateToDashboard && onNavigateToDashboard()}
        onNavigateToRequests={() => onNavigateToRequests && onNavigateToRequests()}
        onNavigateToSuppliers={() => { }}
        onNavigateToProfile={() => onNavigateToProfile && onNavigateToProfile()}
      />
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
    paddingBottom: 20,
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  logo: {
    width: 100,
    height: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
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
    fontSize: 16,
    color: '#333',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  newButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    height: 48,
  },
  newButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    tintColor: '#FFF',
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
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buildingIcon: {
    width: 24,
    height: 24,
    tintColor: '#333',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
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
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  progressSection: {
    width: '100%',
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginRight: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  scoreSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
  },
});