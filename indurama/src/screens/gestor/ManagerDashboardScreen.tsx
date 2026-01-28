import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  useWindowDimensions,
  DimensionValue,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../hooks/useAuth';
import { getRequestStats, getRecentRequests, getRelativeTime, getEfficiencyMetrics } from '../../services/requestService';
import { getSupplierCount } from '../../services/supplierDataService';
import { Request, RequestPriority, RequestStatus } from '../../types';
import { useResponsive, isWeb, BREAKPOINTS } from '../../styles/responsive';
import { ResponsiveNavShell } from '../../components/ResponsiveNavShell';

interface StatCardData {
  label: string;
  value: string;
  icon: any;
  color: string;
  change?: string;
  additionalText?: string;
  onPress?: () => void;
}

interface RequestData {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'nueva' | 'urgente' | 'cotizacion' | 'busqueda' | 'adjudicada' | 'finalizada';
  user?: string;
  department?: string;
  userAvatar?: string;
  progress?: number;
  progressCount?: string;
  action?: string;
}

interface DashboardStats {
  totalSolicitudes: number;
  totalSolicitudesChange: string;
  enProgreso: number;
  completadas: number;
  completadasChange: string;
  proveedoresActivos: number;
}

interface EfficiencyMetrics {
  approvalRate: number;
  averageTimeDays: number;
  averageCost: number;
}

interface ManagerDashboardScreenProps {
  onNavigateToRequests?: (filter?: string) => void;
  onNavigateToSuppliers?: () => void;
  onNavigateToNotifications?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToValidateRequest?: (requestId: string) => void;
  onNavigateToSearch?: (requestId: string) => void;
  onNavigateToUserManagement?: () => void;
  onNavigateToEPIPendingList?: () => void;
  onNavigateToQuotationCompare?: (requestId: string) => void;
  onNavigateToPayment?: (requestId: string) => void;
  currentUserOverride?: any; // New prop for robust auth
}

const ManagerDashboardScreen: React.FC<ManagerDashboardScreenProps> = ({
  onNavigateToRequests,
  onNavigateToSuppliers,
  onNavigateToNotifications,
  onNavigateToProfile,
  onNavigateToValidateRequest,
  onNavigateToSearch,
  onNavigateToUserManagement,
  onNavigateToEPIPendingList,
  onNavigateToQuotationCompare,
  onNavigateToPayment,
  currentUserOverride
}) => {
  const { user } = useAuth();
  const activeUser = currentUserOverride || user; // Use override if present
  const { width, isMobileView, isDesktopView } = useResponsive();

  const [stats, setStats] = useState<DashboardStats>({
    totalSolicitudes: 0,
    totalSolicitudesChange: '-',
    enProgreso: 0,
    completadas: 0,
    completadasChange: '-',
    proveedoresActivos: 0,
  });
  const [recentRequests, setRecentRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingEPIsCount, setPendingEPIsCount] = useState(0);
  const [efficiency, setEfficiency] = useState<EfficiencyMetrics>({
    approvalRate: 0,
    averageTimeDays: 0,
    averageCost: 0
  });

  // Responsive calculations
  const getCardWidth = () => {
    if (width >= BREAKPOINTS.wide) return '23%';
    if (width >= BREAKPOINTS.desktop) return '31%';
    return '48%';
  };

  const containerMaxWidth = isDesktopView ? 1400 : undefined;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const dashboardStats = await getRequestStats();
      const supplierCount = await getSupplierCount();
      const effMetrics = await getEfficiencyMetrics();

      setStats({
        totalSolicitudes: dashboardStats.total,
        totalSolicitudesChange: '',
        enProgreso: dashboardStats.pending + dashboardStats.inProgress,
        completadas: dashboardStats.completed,
        completadasChange: '',
        proveedoresActivos: supplierCount,
      });

      setEfficiency(effMetrics);

      const recent = await getRecentRequests(5);
      const mappedRecent = recent.map(r => {
        let type: 'nueva' | 'urgente' | 'cotizacion' | 'busqueda' | 'adjudicada' | 'finalizada' = 'nueva';
        if (r.priority === RequestPriority.HIGH || r.priority === RequestPriority.URGENT) type = 'urgente';
        else if (r.status === RequestStatus.QUOTING) type = 'cotizacion';
        else if (r.status === RequestStatus.AWARDED) type = 'adjudicada';
        else if (r.status === RequestStatus.COMPLETED) type = 'finalizada';
        else if (r.status === RequestStatus.IN_PROGRESS) type = 'busqueda';
        else if (r.status === RequestStatus.PENDING) type = 'nueva';

        let action = '';
        if (type === 'nueva') action = 'Validar Solicitud';
        if (type === 'urgente') action = 'Revisar Urgencia';

        return {
          id: r.id,
          title: r.items?.[0]?.name || r.description || 'Solicitud',
          description: r.description,
          time: getRelativeTime(r.createdAt),
          type,
          user: r.userName || 'Usuario',
          userAvatar: (r.userName || 'U').substring(0, 2).toUpperCase(),
          department: r.department || 'General',
          action,
          progress: r.status === 'in_progress' ? 50 : 0,
          progressCount: r.status === 'in_progress' ? 'En proceso' : ''
        };
      });
      setRecentRequests(mappedRecent);

    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const loadPendingEPIs = async () => {
      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { db } = await import('../../services/firebaseConfig');
        const q = query(collection(db, 'epi_submissions'), where('status', '==', 'submitted'));
        const snapshot = await getDocs(q);
        setPendingEPIsCount(snapshot.size);
      } catch (error) {
        console.error('Error loading pending EPIs:', error);
      }
    };
    loadPendingEPIs();
  }, []);

  const renderStatCard = (
    label: string,
    value: number,
    icon: any,
    color: string,
    change?: string,
    additionalText?: string,
    onPress?: () => void,
    variant: 'default' | 'highlight' | 'dark' = 'default'
  ) => {
    const formattedValue = value.toString();
    const cardStyle = [
      styles.statCard,
      { width: getCardWidth() as DimensionValue }, // Dynamic width applied here
      isDesktopView && styles.statCardDesktop, // Compact desktop
      variant === 'highlight' && styles.statCardHighlight,
      variant === 'dark' && styles.statCardDark,
      variant === 'dark' && isDesktopView && styles.statCardDarkDesktop, // Compact dark
    ];

    const iconTintColor = variant === 'dark' ? '#FFFFFF' : color;
    const finalIconColor = variant === 'highlight' ? '#B45309' : iconTintColor;
    const iconBgColor = variant === 'dark' ? 'rgba(255,255,255,0.1)' : 'transparent';

    return (
      <TouchableOpacity
        key={label}
        style={cardStyle}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
      >
        {variant === 'dark' && <View style={styles.statDarkCorner} />}

        <View style={styles.statCardHeader}>
          <Text style={[styles.statLabel, variant === 'dark' && styles.statLabelDark]}>{label}</Text>
          <View style={[styles.statIcon, { backgroundColor: iconBgColor }]}>
            <Image
              source={icon}
              style={styles.statIconImage}
              tintColor={finalIconColor}
              resizeMode="contain"
            />
          </View>
        </View>

        <Text style={[
          styles.statValue,
          variant === 'dark' && styles.statValueDark,
          isDesktopView && styles.statValueDesktop // Smaller font on desktop
        ]}>{formattedValue}</Text>

        {change && (
          <Text style={styles.statChange}>{change}</Text>
        )}

        {additionalText && (
          <View style={styles.additionalTextContainer}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.statAdditionalText}>{additionalText}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Badge Helpers
  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'nueva': return '#3B82F6';
      case 'urgente': return '#EF4444';
      case 'cotizacion': return '#F59E0B';
      case 'busqueda': return '#10B981';
      case 'adjudicada': return '#8B5CF6';
      case 'finalizada': return '#6B7280';
      default: return '#999999';
    }
  };

  const getBadgeText = (type: string) => {
    switch (type) {
      case 'nueva': return 'FASE 1: IDENTIFICACIÓN';
      case 'urgente': return 'FASE 1: URGENTE';
      case 'cotizacion': return 'FASE 3: COTIZACIÓN';
      case 'busqueda': return 'FASE 2: BÚSQUEDA';
      case 'adjudicada': return 'FASE 4: ADJUDICADA';
      case 'finalizada': return 'FASE 4: FINALIZADA';
      default: return '';
    }
  };

  // Render Request Card
  const renderRequestCard = (request: RequestData) => {
    const badgeColor = getBadgeColor(request.type);
    const badgeText = getBadgeText(request.type);

    return (
      <TouchableOpacity
        key={request.id}
        style={[
          styles.requestCard,
          { borderLeftColor: badgeColor },
          isDesktopView && styles.requestCardDesktop
        ]}
        onPress={() => {
          if ((request.type === 'finalizada' || request.type === 'adjudicada') && onNavigateToPayment) {
            onNavigateToPayment(request.id);
          } else {
            onNavigateToValidateRequest?.(request.id);
          }
        }}
      >
        <View style={styles.requestHeader}>
          <View style={[styles.statusBadge, { backgroundColor: badgeColor, paddingHorizontal: 10, maxWidth: '75%' }]}>
            <Text style={[styles.statusBadgeText, { fontSize: 10 }]} numberOfLines={1}>{badgeText}</Text>
          </View>
          <Text style={styles.requestTime} numberOfLines={1}>{request.time}</Text>
          {request.type === 'nueva' && <View style={styles.newIndicatorDot} />}
        </View>

        <Text style={styles.requestTitle} numberOfLines={1}>{request.title}</Text>

        {request.type === 'nueva' && (
          <View style={styles.grayContentBox}>
            <View style={styles.userInfoRow}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{request.userAvatar}</Text>
              </View>
              <View>
                <Text style={styles.requestUser} numberOfLines={1}>{request.user}</Text>
                <Text style={styles.requestDepartment} numberOfLines={1}>• {request.department}</Text>
              </View>
            </View>
            <Text style={styles.requestDescription} numberOfLines={2}>{request.description}</Text>
          </View>
        )}

        {request.type === 'urgente' && (
          <>
            <View style={styles.userInfoRow}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{request.userAvatar}</Text>
              </View>
              <View>
                <Text style={styles.requestUser} numberOfLines={1}>{request.user}</Text>
                <Text style={styles.requestDepartment} numberOfLines={1}>• {request.department}</Text>
              </View>
            </View>
            <View style={styles.urgentActionBox}>
              <Text style={styles.urgentActionText} numberOfLines={1}>{request.description}</Text>
              <TouchableOpacity style={styles.inviteButton} onPress={() => onNavigateToSuppliers && onNavigateToSuppliers()}>
                <Text style={styles.inviteButtonText}>{request.action}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {request.type === 'cotizacion' && (
          <>
            <View style={styles.userInfoRow}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{request.userAvatar}</Text>
              </View>
              <View>
                <Text style={styles.requestUser} numberOfLines={1}>{request.user}</Text>
                <Text style={styles.requestDepartment} numberOfLines={1}>• {request.department}</Text>
              </View>
            </View>
            <View style={styles.progressSection}>
              <Text style={styles.progressLabel} numberOfLines={1}>{request.description}</Text>
              <View style={styles.progressRow}>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressFill, { width: `75%`, backgroundColor: '#F59E0B' }]} />
                </View>
                <Text style={[styles.progressText, { color: '#F59E0B', fontWeight: 'bold' }]}>Fase 3: Cotización</Text>
              </View>
              <TouchableOpacity
                style={[styles.validateButton, { backgroundColor: '#F59E0B', marginTop: 10 }]}
                onPress={() => onNavigateToQuotationCompare && onNavigateToQuotationCompare(request.id)}
              >
                <Text style={styles.validateButtonText}>Ver Cotizaciones</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {request.type === 'busqueda' && (
          <>
            <View style={styles.userInfoRow}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{request.userAvatar}</Text>
              </View>
              <View>
                <Text style={styles.requestUser} numberOfLines={1}>{request.user}</Text>
                <Text style={styles.requestDepartment} numberOfLines={1}>• {request.department}</Text>
              </View>
            </View>
            <View style={styles.progressSection}>
              <Text style={styles.progressLabel} numberOfLines={1}>{request.description}</Text>
              <View style={styles.progressRow}>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressFill, { width: `50%`, backgroundColor: '#10B981' }]} />
                </View>
                <Text style={[styles.progressText, { color: '#10B981', fontWeight: 'bold' }]}>Fase 2: Búsqueda</Text>
              </View>
              <TouchableOpacity
                style={[styles.validateButton, { backgroundColor: '#10B981', marginTop: 10 }]}
                onPress={() => onNavigateToSearch && onNavigateToSearch(request.id)}
              >
                <Text style={styles.validateButtonText}>Gestionar Proveedores</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {(request.type === 'adjudicada' || request.type === 'finalizada') && (
          <>
            <View style={styles.userInfoRow}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{request.userAvatar}</Text>
              </View>
              <View>
                <Text style={styles.requestUser} numberOfLines={1}>{request.user}</Text>
                <Text style={styles.requestDepartment} numberOfLines={1}>• {request.department}</Text>
              </View>
            </View>
            <View style={styles.progressSection}>
              <Text style={styles.progressLabel} numberOfLines={1}>{request.description}</Text>
              <View style={styles.progressRow}>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressFill, { width: '100%', backgroundColor: request.type === 'adjudicada' ? '#8B5CF6' : '#6B7280' }]} />
                </View>
                <Text style={[styles.progressText, { color: request.type === 'adjudicada' ? '#8B5CF6' : '#6B7280', fontWeight: 'bold' }]}>
                  {request.type === 'adjudicada' ? 'Fase 4: Adjudicada' : 'Fase 4: Finalizada'}
                </Text>
              </View>
            </View>
          </>
        )}

        {request.type === 'nueva' && request.action && (
          <View style={styles.actionButtonContainer}>
            <TouchableOpacity
              style={styles.validateButton}
              onPress={() => onNavigateToValidateRequest && onNavigateToValidateRequest(request.id)}
            >
              <Text style={styles.validateButtonText}>{request.action}</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const navItems = [
    { key: 'Dashboard', label: 'Dashboard', iconName: 'home' as const, onPress: () => { } },
    { key: 'Requests', label: 'Solicitudes', iconName: 'document-text' as const, onPress: () => onNavigateToRequests && onNavigateToRequests() },
    { key: 'Suppliers', label: 'Proveedores', iconName: 'people' as const, onPress: () => onNavigateToSuppliers && onNavigateToSuppliers() },
    { key: 'Profile', label: 'Perfil', iconName: 'person' as const, onPress: () => onNavigateToProfile && onNavigateToProfile() },
  ];

  return (
    <ResponsiveNavShell
      currentScreen="Dashboard"
      navItems={navItems}
      logo={require('../../../assets/icono_indurama.png')}
      onNavigateToNotifications={onNavigateToNotifications}
      userId={activeUser?.id} // Pass robust userId
    >
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>DASHBOARD</Text>
            <Text style={styles.subtitle}>Bienvenido, {activeUser?.firstName || 'Gestor'}</Text>
          </View>
          <View style={styles.logoContainer}>
            <Image source={require('../../../assets/icono_indurama.png')} style={styles.logoImage} resizeMode="contain" />
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { maxWidth: containerMaxWidth, alignSelf: isDesktopView ? 'center' : undefined, width: '100%' }
        ]}
      >
        <Text style={[styles.sectionTitle, isDesktopView && { fontSize: 18 }]}>RESUMEN GENERAL</Text>

        <View style={styles.statsGrid}>
          {renderStatCard('Total Solicitudes', stats.totalSolicitudes, require('../../../assets/icons/document.png'), '#003E85', stats.totalSolicitudesChange, undefined, undefined, 'default')}
          {renderStatCard('En Progreso', stats.enProgreso, require('../../../assets/icons/clock.png'), '#FF9800', undefined, 'Requieren acción', () => onNavigateToRequests && onNavigateToRequests('pending'), 'highlight')}
          {renderStatCard('Completadas', stats.completadas, require('../../../assets/icons/check.png'), '#003E85', stats.completadasChange, undefined, () => onNavigateToRequests && onNavigateToRequests('completed'), 'default')}
          {renderStatCard('Proveedores Activos', stats.proveedoresActivos, require('../../../assets/icons/users.png'), '#FFFFFF', undefined, undefined, () => onNavigateToSuppliers && onNavigateToSuppliers(), 'dark')}
        </View>

        {pendingEPIsCount > 0 && (
          <TouchableOpacity
            style={[
              styles.epiPendingCard,
              isDesktopView && styles.epiPendingCardDesktop
            ]}
            onPress={() => onNavigateToEPIPendingList?.()}
          >
            <View style={[styles.epiCardHeader, isDesktopView && styles.epiCardHeaderDesktop]}>
              <View style={[styles.epiIconContainer, isDesktopView && styles.epiIconContainerDesktop]}>
                <Text style={[styles.epiIcon, isDesktopView && styles.epiIconDesktop]}>📋</Text>
              </View>
              <View style={styles.epiCardContent}>
                <Text style={[styles.epiCardTitle, isDesktopView && styles.epiCardTitleDesktop]}>EPIs Pendientes de Auditar</Text>
                <Text style={[styles.epiCardSubtitle, isDesktopView && styles.epiCardSubtitleDesktop]}>
                  {pendingEPIsCount} nueva{pendingEPIsCount !== 1 ? 's' : ''} evaluación{pendingEPIsCount !== 1 ? 'es' : ''}
                </Text>
              </View>
            </View>
            <View style={[styles.epiCardAction, isDesktopView && styles.epiCardActionDesktop]}>
              <Text style={styles.epiCardActionText}>Ver Pendientes</Text>
              <Text style={styles.epiCardArrow}>→</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.efficiencySection}>
          <View style={[styles.efficiencyContent, isMobileView && styles.efficiencyContentMobile]}>
            <View style={[styles.efficiencyLeft, isMobileView && styles.efficiencyLeftMobile]}>
              <View style={styles.circularMetricContainer}>
                <View style={styles.circularMetricRing} />
                <View
                  style={[
                    styles.circularMetricOverlay,
                    { transform: [{ rotate: `${-45 + (efficiency.approvalRate * 1.8)}deg` }] }
                  ]}
                />
                <Text style={styles.percentageText}>{efficiency.approvalRate}%</Text>
              </View>
              <View style={styles.efficiencyTextContainer}>
                <Text style={styles.efficiencyTitle}>Eficiencia</Text>
                <Text style={styles.efficiencySubtitle}>Tasa Aprobación</Text>
              </View>
            </View>

            <View style={[styles.metricsRight, isMobileView && styles.metricsRightMobile]}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>TIEMPO PROM.</Text>
                <Text style={styles.metricValue}>{efficiency.averageTimeDays} Días</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>COSTO PROM.</Text>
                <Text style={styles.metricValue}>${efficiency.averageCost}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.requestsSection}>
          <View style={styles.requestsHeader}>
            <Text style={styles.requestsSectionTitle}>Solicitudes Recientes</Text>
            <TouchableOpacity onPress={() => onNavigateToRequests && onNavigateToRequests()} style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          <View style={[isDesktopView && styles.gridContainer]}>
            {recentRequests.map(renderRequestCard)}
          </View>
        </View>
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </ResponsiveNavShell>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }, android: { elevation: 4 } }), backgroundColor: '#FFFFFF', paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingHorizontal: 20, paddingBottom: 20 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#333333', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#888888', marginTop: 2 },
  logoContainer: { justifyContent: 'center', alignItems: 'flex-end' },
  logoImage: { width: 100, height: 40 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  scrollContent: { paddingBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#888888', marginBottom: 16, textTransform: 'uppercase' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  // Styles
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    height: 120, // Default for mobile
    justifyContent: 'space-between',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 }
    })
  },
  statCardDesktop: {
    height: 100, // Compact height for desktop
    padding: 14,
    marginBottom: 16
  },
  statCardHighlight: { backgroundColor: '#FFF8E1', borderWidth: 0 },
  statCardDark: {
    backgroundColor: '#0F172A',
    // width: '48%', // REMOVED - Controlled by getCardWidth()
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    height: 120,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden'
  },
  statCardDarkDesktop: {
    height: 100,
    padding: 14,
    marginBottom: 16
  },
  statDarkCorner: { position: 'absolute', right: -10, top: -10, width: 60, height: 60, borderRadius: 30, backgroundColor: '#334155', opacity: 0.5 },
  statCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  statLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600', maxWidth: '70%' },
  statLabelDark: { color: '#D1D5DB' },
  statIcon: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  statIconImage: { width: 20, height: 20 },
  statValue: { fontSize: 32, fontWeight: 'bold', color: '#1F2937', marginTop: 4 },
  statValueDesktop: { fontSize: 28, marginTop: 2 }, // Smaller font for compact desktop card
  statValueDark: { color: '#FFFFFF' },
  statChange: { fontSize: 11, color: '#10B981', fontWeight: '600' },
  additionalTextContainer: { flexDirection: 'row', alignItems: 'center' },
  bulletPoint: { fontSize: 14, color: '#B45309', marginRight: 4 },
  statAdditionalText: { fontSize: 11, color: '#B45309', fontWeight: '600' },

  // Efficiency Section
  efficiencySection: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, marginBottom: 32, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }, android: { elevation: 2 } }) },
  efficiencyContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  efficiencyContentMobile: { flexDirection: 'column', alignItems: 'flex-start', gap: 20 },
  efficiencyLeft: { flexDirection: 'row', alignItems: 'center' },
  efficiencyLeftMobile: { marginBottom: 16 },
  circularMetricContainer: { width: 70, height: 70, justifyContent: 'center', alignItems: 'center', marginRight: 16, position: 'relative' },
  circularMetricRing: { position: 'absolute', width: '100%', height: '100%', borderRadius: 35, borderWidth: 6, borderColor: '#F3F4F6', borderTopColor: '#7C3AED', borderRightColor: '#7C3AED', transform: [{ rotate: '45deg' }] }, // 50% ring
  circularMetricOverlay: { position: 'absolute', width: '100%', height: '100%', borderRadius: 35, borderWidth: 6, borderColor: 'transparent', borderTopColor: '#7C3AED', transform: [{ rotate: '135deg' }], opacity: 0.3 }, // Extra segment simulated (faint)

  percentageText: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  efficiencyTextContainer: { justifyContent: 'center' },
  efficiencyTitle: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
  efficiencySubtitle: { fontSize: 12, color: '#9CA3AF' },
  metricsRight: { flexDirection: 'row', gap: 24, marginRight: 10 },
  metricsRightMobile: { width: '100%', justifyContent: 'space-around', gap: 0, marginRight: 0 },
  metricItem: { alignItems: 'center' },
  metricLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', marginBottom: 4, textTransform: 'uppercase' },
  metricValue: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },

  // Requests Section
  requestsSection: { marginBottom: 32 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  requestsSectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  requestsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  viewAllButton: { paddingVertical: 4, paddingHorizontal: 8 },
  viewAllText: { fontSize: 14, color: '#003E85', fontWeight: '600' },

  // Request Card
  requestCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 14, borderLeftWidth: 5, borderLeftColor: '#4CAF50', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 6 }, android: { elevation: 3 } }) },
  requestCardDesktop: { width: '48%' },

  requestHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, marginRight: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#FFFFFF', textTransform: 'uppercase' },
  requestTime: { fontSize: 12, color: '#9CA3AF', flex: 1 },
  newIndicatorDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6', marginLeft: 8 },
  requestTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  grayContentBox: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#F3F4F6' },
  userInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  userAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  userAvatarText: { fontSize: 12, fontWeight: 'bold', color: '#374151' },
  requestUser: { fontSize: 13, fontWeight: '700', color: '#111827', maxWidth: 150 },
  requestDepartment: { fontSize: 11, color: '#9CA3AF', maxWidth: 150 },
  requestDescription: { fontSize: 13, color: '#6B7280', fontStyle: 'italic', marginTop: 4 },
  actionButtonContainer: { alignItems: 'flex-end', marginTop: 12 },
  validateButton: { backgroundColor: '#2563EB', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6 },
  validateButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  urgentActionBox: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#F3F4F6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  urgentActionText: { fontSize: 13, color: '#6B7280', flex: 1, marginRight: 8 },
  inviteButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  inviteButtonText: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
  progressSection: { marginTop: 8 },
  progressLabel: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  progressRow: { flexDirection: 'row', alignItems: 'center' },
  progressBarContainer: { flex: 1, height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, marginRight: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 3 },
  progressText: { fontSize: 12, fontWeight: '700', color: '#111827' },
  bottomSpacing: { height: 100 },
  bottomNavigation: { backgroundColor: '#FFFFFF', flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB', ...Platform.select({ ios: { paddingBottom: 34 } }) },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  navIcon: { width: 24, height: 24, tintColor: '#999999', marginBottom: 4 },
  activeNavIcon: { tintColor: '#003E85' },
  navText: { fontSize: 12, color: '#999999' },
  activeNavText: { color: '#003E85', fontWeight: '600' },

  // NEW: EPI Pending Card styles
  epiPendingCard: {
    backgroundColor: '#FFF8E1',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA726',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 3 }
    })
  },
  epiPendingCardDesktop: {
    paddingVertical: 12, // Reduced vertical padding
    paddingHorizontal: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  epiCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  epiCardHeaderDesktop: { marginBottom: 0, flex: 1 }, // Remove bottom margin on desktop
  epiIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFE0B2', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  epiIconContainerDesktop: { width: 40, height: 40, borderRadius: 20 }, // Smaller icon on desktop
  epiIcon: { fontSize: 24 },
  epiIconDesktop: { fontSize: 20 },
  epiCardContent: { flex: 1 },
  epiCardTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 4 },
  epiCardTitleDesktop: { fontSize: 15, marginBottom: 0 },
  epiCardSubtitle: { fontSize: 14, color: '#666' },
  epiCardSubtitleDesktop: { fontSize: 13 },
  epiCardAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  epiCardActionDesktop: { marginLeft: 20 }, // Margin left instead of flex-end justify
  epiCardActionText: { fontSize: 14, fontWeight: '600', color: '#F57C00', marginRight: 8 },
  epiCardArrow: { fontSize: 18, color: '#F57C00', fontWeight: 'bold' },
});

export default ManagerDashboardScreen;