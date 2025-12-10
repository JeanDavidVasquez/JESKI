import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

const profileSummary = [
  { id: 'total', label: 'Totales', value: 45 },
  { id: 'month', label: 'Este mes', value: 12 },
  { id: 'approved', label: 'Aprobadas', value: '98%' },
];

// Props para la pantalla
interface ProfileScreenProps {
  onNavigateBack?: () => void;
  onNavigateToNewRequest?: () => void;
  onNavigateToHistory?: () => void;
  onNavigateToRequests?: () => void;
  onLogout?: () => void;
}

/**
 * Pantalla de Perfil del Usuario
 */
export const ProfileScreen: React.FC<ProfileScreenProps> = ({ 
  onNavigateBack,
  onNavigateToNewRequest,
  onNavigateToHistory,
  onNavigateToRequests,
  onLogout
}) => {
  const handleGoBack = () => {
    if (onNavigateBack) {
      onNavigateBack();
    } else {
      console.log('Función de navegación de regreso no disponible');
    }
  };

  const handleNewRequest = () => {
    if (onNavigateToNewRequest) {
      onNavigateToNewRequest();
    } else {
      console.log('Función de navegación a nueva solicitud no disponible');
    }
  };

  const handleHistory = () => {
    if (onNavigateToHistory) {
      onNavigateToHistory();
    } else {
      console.log('Función de navegación a historial no disponible');
    }
  };

  const handleRequests = () => {
    if (onNavigateToRequests) {
      onNavigateToRequests();
    } else {
      console.log('Función de navegación a solicitudes no disponible');
    }
  };

  const handleEditProfile = () => {
    console.log('Editar perfil');
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      console.log('Cerrar sesión');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.headerCard}>
        <View>
          <Text style={styles.headerTitle}>Mi Perfil</Text>
          <Text style={styles.headerSubtitle}>Información personal y laboral</Text>
        </View>
        <Image 
          source={require('../../assets/icono_indurama.png')} 
          style={styles.headerLogo}
          resizeMode="contain"
        />
      </View>

      {/* Contenido */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Image 
                source={require('../../assets/icons/profile.png')} 
                style={styles.avatarIcon}
                resizeMode="contain"
              />
            </View>
          </View>
          <Text style={styles.profileName}>Ana Soto</Text>
          <Text style={styles.profileRole}>Analista de Producción • Planta A</Text>
          <View style={styles.summaryRow}>
            {profileSummary.map(item => (
              <View key={item.id} style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{item.value}</Text>
                <Text style={styles.summaryLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <Section title="Datos laborales">
          <InfoPill label="Reporta a (Jefe)" value="Juan Pérez" initials="JP" />
          <InfoPill label="Departamento" value="Producción General" initials="P" />
        </Section>

        <Section title="Contactos">
          <InfoRow
            icon={require('../../assets/icons/mail.png')}
            label="Correo"
            value="ana.soto@indurama.com"
            editable
          />
          <InfoRow
            icon={require('../../assets/icons/phone.png')}
            label="Teléfono"
            value="099 425 9550"
            editable
          />
          <InfoRow
            icon={require('../../assets/icons/globe.png')}
            label="Idioma"
            value="ESP"
          />
        </Section>

        <Section title="">
          <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
            <View style={styles.logoutIconContainer}>
              <Image 
                source={require('../../assets/icons/exit.png')}
                style={styles.logoutIcon}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </Section>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={handleRequests}>
          <Image 
            source={require('../../assets/icons/home.png')} 
            style={styles.navIconImage}
          />
          <Text style={styles.navText}>Mis Solicitudes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={handleNewRequest}>
          <Image 
            source={require('../../assets/icons/plus.png')} 
            style={styles.navIconImage}
          />
          <Text style={styles.navText}>Nueva Solicitud</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={handleHistory}>
          <Image 
            source={require('../../assets/icons/chart.png')} 
            style={styles.navIconImage}
          />
          <Text style={styles.navText}>Historial</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Image 
            source={require('../../assets/icons/profile.png')} 
            style={[styles.navIconImage, styles.navIconActive]}
          />
          <Text style={[styles.navText, styles.navTextActive]}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.sectionCard}>
    {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
    {children}
  </View>
);

const InfoPill: React.FC<{ label: string; value: string; initials: string }> = ({
  label,
  value,
  initials,
}) => (
  <View style={styles.pill}>
    <View style={styles.pillAvatar}>
      <Text style={styles.pillAvatarText}>{initials}</Text>
    </View>
    <View>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillValue}>{value}</Text>
    </View>
  </View>
);

const InfoRow: React.FC<{ icon: any; label: string; value: string; editable?: boolean }> = ({
  icon,
  label,
  value,
  editable,
}) => (
  <View style={styles.contactRow}>
    <View style={styles.contactIconContainer}>
      <Image source={icon} style={styles.contactIcon} resizeMode="contain" />
    </View>
    <View style={styles.contactContent}>
      <Text style={styles.contactLabel}>{label}</Text>
      <Text style={styles.contactValue}>{value}</Text>
    </View>
    {editable && (
      <TouchableOpacity onPress={() => console.log('Editar', label)}>
        <Image
          source={require('../../assets/icons/edit.png')}
          style={styles.editIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  headerCard: {
    backgroundColor: '#003E85',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: isMobile ? 20 : 32,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E2E8F0',
    marginTop: 4,
  },
  headerLogo: {
    width: 56,
    height: 56,
    tintColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: isMobile ? 20 : 40,
    paddingTop: 20,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginTop: -40,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  avatarWrapper: {
    marginBottom: 12,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E0ECFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarIcon: {
    width: 48,
    height: 48,
    tintColor: '#003E85',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
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
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F8FAFF',
    marginBottom: 12,
  },
  pillAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0ECFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pillAvatarText: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  pillLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  pillValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactIcon: {
    width: 20,
    height: 20,
    tintColor: '#6B7280',
  },
  editIcon: {
    width: 18,
    height: 18,
    tintColor: '#1D4ED8',
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  logoutIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoutIcon: {
    width: 16,
    height: 16,
    tintColor: '#DC2626',
  },
  logoutText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 15,
  },
  bottomNav: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingBottom: Platform.OS === 'ios' ? 25 : 12,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navItemActive: {
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
  },
  navIconImage: {
    width: 20,
    height: 20,
    marginBottom: 4,
    tintColor: '#666666',
  },
  navIconActive: {
    tintColor: '#003E85',
  },
  navText: {
    fontSize: 12,
    color: '#666666',
  },
  navTextActive: {
    color: '#003E85',
    fontWeight: '600',
  },
});