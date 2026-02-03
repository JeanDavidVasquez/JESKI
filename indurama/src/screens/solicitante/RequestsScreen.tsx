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
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
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



/**
 * Pantalla de Mis Solicitudes para el rol de Solicitante (dashboard principal)
 */
export const RequestsScreen: React.FC<RequestsScreenProps> = ({
  onNavigateToNewRequest,
  onNavigateToHistory,
  onNavigateToDetail,
  onNavigateToProfile,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();

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

  const summaryData: Summary[] = [
    { id: 'in-progress', label: t('solicitante.dashboard.summary.inProgress'), value: 10, subLabel: t('solicitante.dashboard.summary.inProgressSub'), variant: 'primary' },
    { id: 'attention', label: t('solicitante.dashboard.summary.attention'), value: 11, subLabel: t('solicitante.dashboard.summary.attentionSub'), variant: 'warning' },
    { id: 'completed', label: t('solicitante.dashboard.summary.ready'), value: 2, subLabel: t('solicitante.dashboard.summary.readySub'), variant: 'success' },
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

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View>
            <Text style={styles.welcomeLabel}>{t('solicitante.dashboard.welcome')}</Text>
            <Text style={styles.userName}>
              {user ? `${user.firstName} ${user.lastName}` : t('common.user')}
            </Text>
            <Text style={styles.userMeta}>{user?.department || 'Departamento'}</Text>
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
            <Text style={styles.ctaTitle}>{t('solicitante.dashboard.ctaTitle')}</Text>
            <Text style={styles.ctaSubtitle}>
              {t('solicitante.dashboard.ctaSubtitle')}
            </Text>
            <TouchableOpacity style={styles.ctaButton} onPress={handleNewRequest}>
              <Image source={require('../../../assets/icons/plus.png')} style={styles.ctaButtonIcon} />
              <Text style={styles.ctaButtonText}>{t('solicitante.dashboard.createRequest')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.ctaAccent} />
        </View>

        {/* Summary */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('solicitante.dashboard.summaryTitle')}</Text>
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
          <Text style={styles.sectionTitle}>{t('solicitante.dashboard.recentRequests')}</Text>
          <TouchableOpacity onPress={handleHistory}>
            <Text style={styles.sectionLink}>{t('solicitante.dashboard.viewAll')}</Text>
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
                  <Text style={styles.detailsLinkText}>{t('solicitante.dashboard.viewDetails')}</Text>
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
          <Text style={[styles.navLabel, styles.navLabelActive]}>{t('navigation.dashboard')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleNewRequest}>
          <Image source={require('../../../assets/icons/plus.png')} style={styles.navIcon} />
          <Text style={styles.navLabel}>{t('solicitante.dashboard.createRequest')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleHistory}>
          <Image source={require('../../../assets/icons/home.png')} style={styles.navIcon} />
          <Text style={styles.navLabel}>{t('navigation.history')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleProfile}>
          <Image source={require('../../../assets/icons/profile.png')} style={styles.navIcon} />
          <Text style={styles.navLabel}>{t('navigation.profile')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const RequestTimeline: React.FC<{ activeStage: RequestStage }> = ({ activeStage }) => {
  const { t } = useLanguage();
  // We need to map the Stage types to translated strings, but also keep track of 'index' for active logic
  // Since activeStage comes as 'Solicitado' (from mock data), we need to handle that mapping or just assume it matches order

  // For this mock component, let's keep it simple and just translate the display Labels
  // assuming activeStage is one of the Mock values. 
  // Ideally, activeStage should be a code ('requested', 'approval', etc.)

  const stagesList = [
    { id: 'Solicitado', label: t('solicitante.dashboard.stages.requested') },
    { id: 'Aprobación', label: t('solicitante.dashboard.stages.approval') },
    { id: 'Gestión', label: t('solicitante.dashboard.stages.management') },
    { id: 'Orden', label: t('solicitante.dashboard.stages.order') }
  ];

  const activeIndex = stagesList.findIndex(s => s.id === activeStage);

  return (
    <View style={styles.timeline}>
      {stagesList.map((stage, index) => {
        const isActive = activeIndex >= index;
        return (
          <React.Fragment key={stage.id}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, isActive && styles.timelineDotActive]} />
              <Text style={[styles.timelineLabel, isActive && styles.timelineLabelActive]}>{stage.label}</Text>
            </View>
            {index < stagesList.length - 1 && <View style={[styles.timelineBar, isActive && styles.timelineBarActive]} />}
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
    backgroundColor: theme.colors.primary,
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
    tintColor: theme.colors.primary,
    marginRight: 8,
  },
  ctaButtonText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  ctaAccent: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: theme.colors.primary,
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
    color: theme.colors.primary,
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
    backgroundColor: theme.colors.primary,
  },
  timelineLabel: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  },
  timelineLabelActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  timelineBar: {
    height: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
  },
  timelineBarActive: {
    backgroundColor: theme.colors.primary,
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
    color: theme.colors.primary,
    fontWeight: '600',
  },
  arrowIcon: {
    width: 14,
    height: 14,
    tintColor: theme.colors.primary,
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
    tintColor: theme.colors.primary,
  },
  navLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  navLabelActive: {
    color: theme.colors.primary,
  },
});




