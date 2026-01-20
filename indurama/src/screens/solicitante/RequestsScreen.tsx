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
import { theme } from '../../styles/theme';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

type RequestStage = 'Solicitado' | 'Aprobación' | 'Gestión' | 'Orden';

interface RequestCardData {
  id: string;
  code: string;
  title: string;
  description: string;
  date: string;
  status: 'COTIZANDO' | 'ESPERANDO APROBACIÓN' | 'LISTO / COMPRA';
  statusVariant: 'info' | 'warning' | 'success';
  currentStage: RequestStage;
}

interface Summary {
  id: string;
  label: string;
  value: number;
  subLabel: string;
  variant: 'primary' | 'warning' | 'success';
}

interface RequestsScreenProps {
  onNavigateToNewRequest?: () => void;
  onNavigateToHistory?: () => void;
  onNavigateToDetail?: (requestId: string) => void;
  onNavigateToProfile?: () => void;
}

const summaryData: Summary[] = [
  { id: 'in-progress', label: 'En Curso', value: 10, subLabel: 'Solicitudes activas', variant: 'primary' },
  { id: 'attention', label: 'Atención', value: 11, subLabel: 'Requieren acción', variant: 'warning' },
  { id: 'completed', label: 'Listas', value: 2, subLabel: 'Últimos 30 días', variant: 'success' },
];

const recentRequests: RequestCardData[] = [
  {
    id: 'sol-2025-042',
    code: '#SOL-2025-042',
    title: 'Materia prima línea A',
    description: 'Solicitud de 55,000 unidades para producción',
    date: '15 Ene 2025',
    status: 'COTIZANDO',
    statusVariant: 'info',
    currentStage: 'Aprobación',
  },
  {
    id: 'sol-2025-044',
    code: '#SOL-2025-044',
    title: 'Materia prima línea A',
    description: 'Solicitud de 55,000 unidades para producción',
    date: '15 Ene 2025',
    status: 'ESPERANDO APROBACIÓN',
    statusVariant: 'warning',
    currentStage: 'Solicitado',
  },
  {
    id: 'sol-2025-038',
    code: '#SOL-2025-038',
    title: 'EPP Personal Nuevo',
    description: 'Orden de compra generada',
    date: '13 Ene 2025',
    status: 'LISTO / COMPRA',
    statusVariant: 'success',
    currentStage: 'Orden',
  },
];

/**
 * Pantalla de Mis Solicitudes para el rol de Solicitante (dashboard principal)
 */
export const RequestsScreen: React.FC<RequestsScreenProps> = ({
  onNavigateToNewRequest,
  onNavigateToHistory,
  onNavigateToDetail,
  onNavigateToProfile,
}) => {
  const handleNewRequest = () => {
    onNavigateToNewRequest?.();
  };

  const handleHistory = () => {
    onNavigateToHistory?.();
  };

  const handleProfile = () => {
    onNavigateToProfile?.();
  };

  const handleViewDetails = (requestId: string) => {
    onNavigateToDetail?.(requestId);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View>
            <Text style={styles.welcomeLabel}>Bienvenido,</Text>
            <Text style={styles.userName}>Juan Pérez</Text>
            <Text style={styles.userMeta}>Producción · Planta A</Text>
          </View>

          <View style={styles.logoWrapper}>
            <Image
              source={require('../../../assets/icono_indurama.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* CTA card */}
        <View style={styles.ctaCard}>
          <View style={styles.ctaContent}>
            <Text style={styles.ctaTitle}>¿Qué necesitas hoy?</Text>
            <Text style={styles.ctaSubtitle}>
              Gestione y realice seguimiento a sus solicitudes de necesidades
            </Text>
            <TouchableOpacity style={styles.ctaButton} onPress={handleNewRequest}>
              <Image source={require('../../../assets/icons/plus.png')} style={styles.ctaButtonIcon} />
              <Text style={styles.ctaButtonText}>Crear Nueva Solicitud</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.ctaAccent} />
        </View>

        {/* Summary */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tu Resumen</Text>
        </View>
        <View style={styles.summaryGrid}>
          {summaryData.map((item) => (
            <View key={item.id} style={styles.summaryCard}>
              <Text style={[styles.summaryValue, summaryVariantStyle(item.variant)]}>{item.value}</Text>
              <Text style={styles.summaryLabel}>{item.label}</Text>
              <Text style={styles.summarySub}>{item.subLabel}</Text>
            </View>
          ))}
        </View>

        {/* Recent requests */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Solicitudes Recientes</Text>
          <TouchableOpacity onPress={handleHistory}>
            <Text style={styles.sectionLink}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cardList}>
          {recentRequests.map((request) => (
            <TouchableOpacity
              key={request.id}
              style={styles.requestCard}
              activeOpacity={0.8}
              onPress={() => handleViewDetails(request.id)}
            >
              <View style={styles.requestHeader}>
                <Text style={styles.requestCode}>{request.code}</Text>
                <View style={[styles.badge, badgeVariantStyle(request.statusVariant)]}>
                  <Text style={styles.badgeText}>{request.status}</Text>
                </View>
              </View>

              <Text style={styles.requestTitle}>{request.title}</Text>
              <Text style={styles.requestDescription}>{request.description}</Text>

              <RequestTimeline activeStage={request.currentStage} />

              <View style={styles.requestFooter}>
                <View style={styles.footerMeta}>
                  <Image
                    source={require('../../../assets/icons/calendar.png')}
                    style={styles.metaIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.footerText}>{request.date}</Text>
                </View>
                <TouchableOpacity style={styles.detailsLink} onPress={() => handleViewDetails(request.id)}>
                  <Text style={styles.detailsLinkText}>Ver Detalles</Text>
                  <Image
                    source={require('../../../assets/icons/arrow-right.png')}
                    style={styles.arrowIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Image
            source={require('../../../assets/icons/home.png')}
            style={[styles.navIcon, styles.navIconActive]}
          />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Mis Solicitudes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleNewRequest}>
          <Image source={require('../../../assets/icons/plus.png')} style={styles.navIcon} />
          <Text style={styles.navLabel}>Nueva Solicitud</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleHistory}>
          <Image source={require('../../../assets/icons/home.png')} style={styles.navIcon} />
          <Text style={styles.navLabel}>Historial</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleProfile}>
          <Image source={require('../../../assets/icons/profile.png')} style={styles.navIcon} />
          <Text style={styles.navLabel}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const RequestTimeline: React.FC<{ activeStage: RequestStage }> = ({ activeStage }) => {
  const stages: RequestStage[] = ['Solicitado', 'Aprobación', 'Gestión', 'Orden'];
  return (
    <View style={styles.timeline}>
      {stages.map((stage, index) => {
        const isActive = stages.indexOf(activeStage) >= index;
        return (
          <React.Fragment key={stage}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, isActive && styles.timelineDotActive]} />
              <Text style={[styles.timelineLabel, isActive && styles.timelineLabelActive]}>{stage}</Text>
            </View>
            {index < stages.length - 1 && <View style={[styles.timelineBar, isActive && styles.timelineBarActive]} />}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const summaryVariantStyle = (variant: Summary['variant']) => {
  switch (variant) {
    case 'warning':
      return { color: '#F59E0B' };
    case 'success':
      return { color: '#10B981' };
    default:
      return { color: '#003E85' };
  }
};

const badgeVariantStyle = (variant: RequestCardData['statusVariant']) => {
  switch (variant) {
    case 'warning':
      return { backgroundColor: '#FCE7C3', borderColor: '#F59E0B' };
    case 'success':
      return { backgroundColor: '#DEF7EC', borderColor: '#10B981' };
    default:
      return { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  scroll: {
    paddingBottom: 140,
    paddingHorizontal: isMobile ? 16 : 32,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    gap: 20,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  welcomeLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  userMeta: {
    marginTop: 4,
    fontSize: 14,
    color: '#475569',
  },
  logoWrapper: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 48,
    height: 48,
  },
  ctaCard: {
    position: 'relative',
    backgroundColor: '#1D4ED8',
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
  },
  ctaContent: {
    maxWidth: '80%',
  },
  ctaTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 8,
  },
  ctaSubtitle: {
    color: '#E0E7FF',
    fontSize: 14,
    marginBottom: 16,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  ctaButtonIcon: {
    width: 18,
    height: 18,
    tintColor: '#1D4ED8',
    marginRight: 8,
  },
  ctaButtonText: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
  ctaAccent: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#1E40AF',
    top: -30,
    right: -20,
    opacity: 0.3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
  },
  sectionLink: {
    fontSize: 14,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#1E293B',
    marginTop: 4,
  },
  summarySub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  cardList: {
    gap: 16,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  requestCode: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  requestDescription: {
    fontSize: 14,
    color: '#475569',
    marginVertical: 8,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  timelineItem: {
    alignItems: 'center',
    width: '22%',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#CBD5F5',
    marginBottom: 6,
  },
  timelineDotActive: {
    backgroundColor: '#1D4ED8',
  },
  timelineLabel: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
  timelineLabelActive: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
  timelineBar: {
    height: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
  },
  timelineBarActive: {
    backgroundColor: '#1D4ED8',
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  footerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaIcon: {
    width: 16,
    height: 16,
    tintColor: '#94A3B8',
  },
  footerText: {
    fontSize: 13,
    color: '#475569',
  },
  detailsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailsLinkText: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
  arrowIcon: {
    width: 14,
    height: 14,
    tintColor: '#1D4ED8',
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navItemActive: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#E0EAFF',
  },
  navIcon: {
    width: 22,
    height: 22,
    tintColor: '#94A3B8',
  },
  navIconActive: {
    tintColor: '#1D4ED8',
  },
  navLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  navLabelActive: {
    color: '#1D4ED8',
  },
});

