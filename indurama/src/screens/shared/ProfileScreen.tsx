import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { User, UserRole } from '../../types';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

// Props para la pantalla
interface ProfileScreenProps {
  onNavigateBack?: () => void;
  onNavigateToNewRequest?: () => void;
  onNavigateToHistory?: () => void;
  onNavigateToRequests?: () => void;
  onLogout?: () => void;
  user?: User; // Add user prop
}

/**
 * Pantalla de Perfil del Usuario (Compartida)
 */
export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onNavigateBack,
  onNavigateToNewRequest,
  onNavigateToHistory,
  onNavigateToRequests,
  onLogout,
  user
}) => {

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', onPress: () => onLogout?.(), style: 'destructive' }
      ]
    );
  };

  const getUserInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Usuario Indurama';
  const displayRole = user?.position || user?.role || 'Colaborador';
  const displayDepartment = user?.department || 'General';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Mi Perfil</Text>
            <Text style={styles.headerSubtitle}>Información personal</Text>
          </View>
          {/* Logo could go here if needed, or simple icon */}
          <View style={styles.headerIconContainer}>
            <Ionicons name="person-circle-outline" size={40} color="rgba(255,255,255,0.8)" />
          </View>
        </View>
      </View>

      {/* Contenido */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{getUserInitials(displayName)}</Text>
            </View>
          </View>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileRole}>{displayRole}</Text>

          {user?.role === UserRole.SOLICITANTE && (
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>--</Text>
                <Text style={styles.summaryLabel}>Solicitudes</Text>
              </View>
            </View>
          )}
        </View>

        <Section title="Información Laboral">
          <InfoPill
            label="Departamento"
            value={displayDepartment}
            icon="business-outline"
          />
          {user?.category && (
            <InfoPill
              label="Categoría"
              value={user.category}
              icon="pricetag-outline"
            />
          )}
        </Section>

        <Section title="Contacto">
          <InfoRow
            iconName="mail-outline"
            label="Correo"
            value={user?.email || 'No registrado'}
          />
          <InfoRow
            iconName="call-outline"
            label="Teléfono"
            value={user?.phoneNumber || 'No registrado'}
            editable={!!user?.phoneNumber} // Example logic
          />
        </Section>

        <Section title="Cuenta">
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={[styles.menuIconContainer, { backgroundColor: '#FFEBEE' }]}>
              <Ionicons name="log-out-outline" size={20} color="#D32F2F" />
            </View>
            <Text style={[styles.menuText, { color: '#D32F2F' }]}>Cerrar Sesión</Text>
            <Ionicons name="chevron-forward" size={20} color="#D32F2F" />
          </TouchableOpacity>
        </Section>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation (Only visible for Solicitante usually, logic should handle visibility externally but preserving for layout) */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={onNavigateToRequests}>
          <Ionicons name="home-outline" size={24} color="#666" />
          <Text style={styles.navText}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={onNavigateToNewRequest}>
          <View style={styles.fabContainer}>
            <Ionicons name="add" size={30} color="#FFF" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={onNavigateToHistory}>
          <Ionicons name="time-outline" size={24} color="#666" />
          <Text style={styles.navText}>Historial</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.sectionContainer}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionCard}>
      {children}
    </View>
  </View>
);

const InfoPill: React.FC<{ label: string; value: string; icon: any }> = ({
  label,
  value,
  icon,
}) => (
  <View style={styles.pill}>
    <View style={styles.pillIcon}>
      <Ionicons name={icon} size={20} color="#003E85" />
    </View>
    <View>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillValue}>{value}</Text>
    </View>
  </View>
);

const InfoRow: React.FC<{ iconName: any; label: string; value: string; editable?: boolean }> = ({
  iconName,
  label,
  value,
  editable,
}) => (
  <View style={styles.contactRow}>
    <View style={styles.contactIconContainer}>
      <Ionicons name={iconName} size={20} color="#666" />
    </View>
    <View style={styles.contactContent}>
      <Text style={styles.contactLabel}>{label}</Text>
      <Text style={styles.contactValue}>{value}</Text>
    </View>
    {editable && (
      <TouchableOpacity onPress={() => console.log('Editar', label)}>
        <Ionicons name="create-outline" size={18} color="#003E85" />
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerCard: {
    backgroundColor: '#003E85',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 24,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerIconContainer: {
    opacity: 0.8
  },
  headerTitle: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginTop: -30,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  avatarWrapper: {
    marginBottom: 16,
    marginTop: -50,
    padding: 4,
    backgroundColor: '#FFF',
    borderRadius: 50,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#003E85',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#003E85',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
    textAlign: 'center',
  },
  profileRole: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    justifyContent: 'center',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
  },
  pillIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E0E7FF', // Light indigo
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pillLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  pillValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  contactIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactContent: {
    flex: 1
  },
  contactLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  contactValue: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  bottomNav: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4
  },
  fabContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#003E85',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    shadowColor: '#003E85',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  }
});