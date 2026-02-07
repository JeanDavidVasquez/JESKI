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
        const requestsSnapshot = await getDocs(collection(db, 'requests'));
        const allRequests = requestsSnapshot.docs.map(doc => doc.data());

        const pendingCount = allRequests.filter(req =>
          req.status !== 'completed' &&
          req.status !== 'rejected' &&
          req.status !== 'cancelled'
        ).length;

        const suppliersQuery = query(
          collection(db, 'users'),
          where('role', '==', 'proveedor')
        );
        const suppliersSnapshot = await getDocs(suppliersQuery);
        const suppliersCount = suppliersSnapshot.size;

        setStats({
          pending: pendingCount,
          audits: 0,
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
    { key: 'Profile', label: 'Perfil', iconName: 'person' as const, onPress: () => onNavigateToDashboard?.() },
  ];

  return (
    <ResponsiveNavShell
      currentScreen="Profile"
      navItems={navItems}
      logo={require('../../../assets/icono_indurama.png')}
      onNavigateToNotifications={onNavigateToNotifications}
    >
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        style={styles.container}
      >
        {/* FRANJA BLANCA DEL HEADER */}
        {/* Se usa backgroundColor white y padding vertical para simular la franja del dashboard */}
        <View style={styles.headerStrip}>
          <View style={[styles.headerContent, isDesktopView && styles.desktopMaxWidth]}>
            <Text style={styles.headerTitleDark}>MI PERFIL</Text>
            <Text style={styles.headerSubtitle}>
              Bienvenido, {user ? `${user.firstName}`.trim() : 'Usuario'}
            </Text>
          </View>
        </View>

        {/* CONTENIDO (FONDO GRIS) */}
        <View style={[styles.contentWrapper, isDesktopView && styles.desktopMaxWidth]}>
          
          {/* Sección de Avatar */}
          <View style={styles.profileSection}>
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
            <View style={styles.card}>
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
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>ADMINISTRACIÓN DEL SISTEMA</Text>
            
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
          <View style={styles.sectionContainer}>
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
    backgroundColor: '#F3F4F6', // Gris claro para el fondo general
  },
  desktopMaxWidth: {
    maxWidth: 1000, // Un poco más ancho para desktop si es necesario
    width: '100%',
    alignSelf: 'center',
  },
  
  // --- HEADER STRIP (La franja blanca) ---
  headerStrip: {
    backgroundColor: '#FFFFFF', // Blanco puro
    paddingTop: 60, // Espacio superior (Status Bar)
    paddingBottom: 25,
    paddingHorizontal: 30, // Alineación izquierda cómoda
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // Línea sutil separadora (opcional)
    width: '100%',
  },
  headerContent: {
    width: '100%',
    alignItems: 'flex-start', // ALINEACIÓN A LA IZQUIERDA
  },
  headerTitleDark: {
    fontSize: 28, 
    fontWeight: '900', // Muy negrita como en la imagen
    color: '#0F172A', // Color casi negro (Slate 900) para coincidir con Dashboard
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'left',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280', // Gris suave
    fontWeight: '500',
    textAlign: 'left',
  },

  // --- CONTENIDO ---
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 20, // Padding para el contenido interior
    paddingTop: 20,
  },

  // Profile Section
  profileSection: {
    alignItems: 'center', // El avatar sí se ve bien centrado en su propia tarjeta/sección
    marginTop: 10,
    marginBottom: 20,
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
    backgroundColor: '#9CA3AF', // Un gris más oscuro para el placeholder
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: theme.colors.white,
  },
  userName: {
    fontSize: 22,
    ...theme.typography.styles.h3,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  userRole: {
    ...theme.typography.styles.body,
    color: theme.colors.text.secondary,
  },

  // Stats Card
  statsCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: 16, // Bordes más suaves
    padding: 20,
    width: '100%',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginTop: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabelNew: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },

  // Sections
  sectionContainer: {
    marginBottom: 24,
    width: '100%',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF', // Color grisáceo para los títulos de sección (tipo "RESUMEN GENERAL")
    marginBottom: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  
  // Data Rows
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6', // Separador sutil interno
  },
  dataLabel: {
    fontWeight: '600',
    color: '#374151',
    marginLeft: 10,
    marginRight: 8,
    fontSize: 14,
  },
  dataValue: {
    color: '#6B7280',
    flex: 1,
    fontSize: 14,
  },

  // Menu Items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB', // Borde sutil
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 22,
    height: 22,
    tintColor: '#374151',
    marginRight: 14,
  },
  menuItemText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  menuArrow: {
    width: 18,
    height: 18,
    tintColor: theme.colors.primary,
  },
  
  // Icon Containers
  languageIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  languageIcon: {
    width: 18,
    height: 18,
    tintColor: theme.colors.primary,
  },
  languageText: {
    fontWeight: '600',
    fontSize: 14,
    color: theme.colors.primary,
  },
  logoutIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoutIcon: {
    width: 18,
    height: 18,
    tintColor: '#EF4444',
  },
  logoutText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#EF4444',
  },
});