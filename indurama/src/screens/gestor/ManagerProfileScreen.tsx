import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { ResponsiveNavShell } from '../../components/ResponsiveNavShell';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { useResponsive } from '../../styles/responsive';

interface ManagerProfileScreenProps {
  onNavigateBack?: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateToRequests?: () => void;
  onNavigateToSuppliers?: () => void;
  onNavigateToEPIConfig?: () => void;
  onNavigateToUserManagement?: () => void;
  onLogout?: () => void;
  onNavigateToNotifications?: () => void;
}

interface Stats {
  pending: number;
  audits: number;
  suppliers: number;
}

export const ManagerProfileScreen: React.FC<ManagerProfileScreenProps> = ({
  onNavigateBack,
  onNavigateToDashboard,
  onNavigateToRequests,
  onNavigateToSuppliers,
  onNavigateToEPIConfig,
  onNavigateToUserManagement,
  onLogout,
  onNavigateToNotifications,
}) => {
  const { user } = useAuth();
  const { isDesktopView } = useResponsive();
  const [stats, setStats] = useState<Stats>({ pending: 0, audits: 0, suppliers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Fetch ALL requests and filter for pending ones
        const requestsSnapshot = await getDocs(collection(db, 'requests'));
        const allRequests = requestsSnapshot.docs.map(doc => doc.data());

        // Count pending
        const pendingCount = allRequests.filter(req =>
          req.status !== 'completed' &&
          req.status !== 'rejected' &&
          req.status !== 'cancelled'
        ).length;

        // Fetch suppliers count
        const suppliersQuery = query(
          collection(db, 'users'),
          where('role', '==', 'proveedor')
        );
        const suppliersSnapshot = await getDocs(suppliersQuery);
        const suppliersCount = suppliersSnapshot.size;

        const auditsCount = 0;

        setStats({
          pending: pendingCount,
          audits: auditsCount,
          suppliers: suppliersCount,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const navItems = [
    { key: 'Dashboard', label: 'Dashboard', iconName: 'home' as const, onPress: () => onNavigateToDashboard?.() },
    { key: 'Requests', label: 'Solicitudes', iconName: 'document-text' as const, onPress: () => onNavigateToRequests?.() },
    { key: 'Suppliers', label: 'Proveedores', iconName: 'people' as const, onPress: () => onNavigateToSuppliers?.() },
    { key: 'Profile', label: 'Perfil', iconName: 'person' as const, onPress: () => onNavigateToDashboard?.() }, // Self or Dashboard
  ];

  return (
    <ResponsiveNavShell
      currentScreen="Profile"
      navItems={navItems}
      logo={require('../../../assets/icono_indurama.png')}
      onNavigateToNotifications={onNavigateToNotifications}
    >
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        style={styles.container}
      >
        {/* Blue Header */}
        <View style={[styles.headerContainer, isDesktopView && { height: 140 }]}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Mi Perfil</Text>
          </View>
        </View>

        <View style={[styles.contentWrapper, isDesktopView && styles.contentWrapperDesktop]}>
          {/* Avatar & Name */}
          <View style={[styles.profileSection, isDesktopView && { marginTop: -40 }]}>
            <View style={styles.avatarContainerNew}>
              <View style={styles.avatarNew}>
                <Ionicons name="person" size={50} color="#FFF" />
              </View>
            </View>

            <Text style={styles.userName}>
              {user ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Usuario'}
            </Text>
            <Text style={styles.userRole}>
              {user?.role === 'gestor' ? 'Gestor' : user?.role || 'Rol no asignado'}
            </Text>

            {/* Stats Card */}
            {loading ? (
              <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
            ) : (
              <View style={styles.statsCard}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#000' }]}>{stats.pending}</Text>
                  <Text style={styles.statLabelNew}>PENDIENTES</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#6B7280' }]}>{stats.audits}</Text>
                  <Text style={styles.statLabelNew}>AUDITORÍAS</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#4CAF50' }]}>{stats.suppliers}</Text>
                  <Text style={styles.statLabelNew}>PROVEEDORES</Text>
                </View>
              </View>
            )}
          </View>

          {/* Datos Laborales */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>DATOS LABORALES</Text>
            <View style={styles.laboralCard}>
              <View style={styles.dataRow}>
                <Ionicons name="mail" size={18} color="#003E85" />
                <Text style={styles.dataLabel}>Email:</Text>
                <Text style={styles.dataValue}>{user?.email || 'N/A'}</Text>
              </View>
              <View style={styles.dataRow}>
                <Ionicons name="briefcase" size={18} color="#003E85" />
                <Text style={styles.dataLabel}>Departamento:</Text>
                <Text style={styles.dataValue}>{user?.department || user?.companyName || 'N/A'}</Text>
              </View>
            </View>
          </View>

          {/* Admin Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ADMINISTRACIÓN DEL SISTEMA</Text>

            <TouchableOpacity style={styles.menuItem} onPress={onNavigateToEPIConfig}>
              <View style={styles.menuItemLeft}>
                <Image
                  source={require('../../../assets/icons/document.png')}
                  style={styles.menuIcon}
                  resizeMode="contain"
                />
                <Text style={styles.menuItemText}>Configurar Cuestionario EPI</Text>
              </View>
              <Image
                source={require('../../../assets/icons/edit.png')}
                style={styles.menuArrow}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={onNavigateToUserManagement}>
              <View style={styles.menuItemLeft}>
                <Image
                  source={require('../../../assets/icons/users.png')}
                  style={styles.menuIcon}
                  resizeMode="contain"
                />
                <Text style={styles.menuItemText}>Gestionar Usuarios</Text>
              </View>
              <Image
                source={require('../../../assets/icons/edit.png')}
                style={styles.menuArrow}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* Settings Section */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={styles.languageIconContainer}>
                  <Image
                    source={require('../../../assets/icons/globe.png')}
                    style={styles.languageIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.menuItemText}>Idioma / Language</Text>
              </View>
              <Text style={styles.languageText}>ESP</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={onLogout}>
              <View style={styles.menuItemLeft}>
                <View style={styles.logoutIconContainer}>
                  <Image
                    source={require('../../../assets/icons/exit.png')}
                    style={styles.logoutIcon}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.logoutText}>Cerrar Sesión</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ResponsiveNavShell>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentWrapper: {
    flex: 1,
  },
  contentWrapperDesktop: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  // New Modern Header
  headerContainer: {
    backgroundColor: '#003E85',
    height: 180,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  headerTitle: {
    ...theme.typography.styles.h2,
    color: '#FFFFFF',
  },
  // Profile Section
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: -60,
  },
  avatarContainerNew: {
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarNew: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#BDBDBD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 22,
    ...theme.typography.styles.h3,
    color: '#212121',
    marginBottom: 4,
  },
  userRole: {
    ...theme.typography.styles.body,
    color: '#757575',
    marginBottom: 20,
  },
  // Stats Card (unified)
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as '700',
  },
  statLabelNew: {
    ...theme.typography.styles.smallBold,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  // Datos Laborales Section
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    ...theme.typography.styles.captionBold,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  laboralCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  dataLabel: {
    ...theme.typography.styles.labelBold,
    marginRight: 8,
  },
  dataValue: {
    ...theme.typography.styles.body,
    color: '#757575',
    flex: 1,
  },
  // Keep old styles for menus
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
    marginTop: 20,
  },
  sectionTitle: {
    ...theme.typography.styles.captionBold,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 24,
    height: 24,
    tintColor: '#1F2937',
    marginRight: 14,
  },
  menuItemText: {
    ...theme.typography.styles.label,
    fontSize: 15,
    color: '#1F2937',
  },
  menuArrow: {
    width: 20,
    height: 20,
    tintColor: theme.colors.primary,
  },
  languageIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  languageIcon: {
    width: 20,
    height: 20,
    tintColor: theme.colors.primary,
  },
  languageText: {
    ...theme.typography.styles.bodySemibold,
    fontSize: 15,
    color: theme.colors.primary,
  },
  logoutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoutIcon: {
    width: 20,
    height: 20,
    tintColor: '#EF4444',
  },
  logoutText: {
    ...theme.typography.styles.label,
    fontSize: 15,
    color: '#EF4444',
  },
});
