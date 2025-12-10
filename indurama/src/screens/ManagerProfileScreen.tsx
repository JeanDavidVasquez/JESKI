import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Platform,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../styles/theme';

interface ManagerProfileScreenProps {
  onNavigateBack?: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateToRequests?: () => void;
  onNavigateToSuppliers?: () => void;
  onNavigateToEPIConfig?: () => void;
  onLogout?: () => void;
}

export const ManagerProfileScreen: React.FC<ManagerProfileScreenProps> = ({
  onNavigateBack,
  onNavigateToDashboard,
  onNavigateToRequests,
  onNavigateToSuppliers,
  onNavigateToEPIConfig,
  onLogout,
}) => {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header with Background */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Mi Perfil</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Image
              source={require('../../assets/icons/profile.png')}
              style={styles.settingsIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Avatar */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={require('../../assets/icons/profile.png')}
              style={styles.avatar}
              resizeMode="contain"
            />
          </View>
          
          <Text style={styles.userName}>Carlos Mendez</Text>
          <Text style={styles.userRole}>Gestor</Text>
          <Text style={styles.userLocation}>• Matriz</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, styles.statNumberBlack]}>8</Text>
            <Text style={styles.statLabel}>PENDIENTES</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, styles.statNumberGray]}>15</Text>
            <Text style={styles.statLabel}>AUDITORÍAS</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, styles.statNumberGreen]}>124</Text>
            <Text style={styles.statLabel}>PROVEEDORES</Text>
          </View>
        </View>

        {/* Admin Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ADMINISTRACIÓN DEL SISTEMA</Text>
          
        <TouchableOpacity style={styles.menuItem} onPress={onNavigateToEPIConfig}>
          <View style={styles.menuItemLeft}>
            <Image
              source={require('../../assets/icons/document.png')}
              style={styles.menuIcon}
              resizeMode="contain"
            />
            <Text style={styles.menuItemText}>Configurar Cuestionario EPI</Text>
          </View>
          <Image
            source={require('../../assets/icons/edit.png')}
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
                  source={require('../../assets/icons/globe.png')}
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
                  source={require('../../assets/icons/exit.png')}
                  style={styles.logoutIcon}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={onNavigateToDashboard}
        >
          <Image
            source={require('../../assets/icons/home.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
          <Text style={styles.navText}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={onNavigateToRequests}
        >
          <Image
            source={require('../../assets/icons/document.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
          <Text style={styles.navText}>Solicitudes</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={onNavigateToSuppliers}
        >
          <Image
            source={require('../../assets/icons/search.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
          <Text style={styles.navText}>Proveedores</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Image
            source={require('../../assets/icons/profile.png')}
            style={[styles.navIcon, styles.activeNavIcon]}
            resizeMode="contain"
          />
          <Text style={[styles.navText, styles.activeNavText]}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  settingsButton: {
    padding: 8,
  },
  settingsIcon: {
    width: 26,
    height: 26,
    tintColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    marginTop: -90,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatar: {
    width: 60,
    height: 60,
    tintColor: '#FFFFFF',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 2,
  },
  userLocation: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 28,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statNumberBlack: {
    color: '#1F2937',
  },
  statNumberGray: {
    color: '#6B7280',
  },
  statNumberGreen: {
    color: '#10B981',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
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
    fontSize: 15,
    fontWeight: '500',
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
    fontSize: 15,
    fontWeight: '600',
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
    fontSize: 15,
    fontWeight: '500',
    color: '#EF4444',
  },
  bottomNavigation: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
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
    width: 24,
    height: 24,
    tintColor: '#9CA3AF',
    marginBottom: 4,
  },
  activeNavIcon: {
    tintColor: theme.colors.primary,
  },
  navText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  activeNavText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
