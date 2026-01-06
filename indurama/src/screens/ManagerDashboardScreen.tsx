import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../hooks/useAuth';
import { getRequestStats, getRecentRequests, getRelativeTime } from '../services/requestService';
import { getSupplierCount } from '../services/supplierDataService';
import { Request, RequestPriority, RequestStatus } from '../types';

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
  type: 'nueva' | 'urgente' | 'cotizacion' | 'busqueda';
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

interface ManagerDashboardScreenProps {
  onNavigateToRequests?: (filter?: string) => void;
  onNavigateToSuppliers?: () => void;
  onNavigateToNotifications?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToValidateRequest?: (requestId: string) => void;
  onNavigateToSearch?: (requestId: string) => void;
  onNavigateToUserManagement?: () => void;
}

const ManagerDashboardScreen: React.FC<ManagerDashboardScreenProps> = ({
  onNavigateToRequests,
  onNavigateToSuppliers,
  onNavigateToNotifications,
  onNavigateToProfile,
  onNavigateToValidateRequest,
  onNavigateToSearch,
  onNavigateToUserManagement
}) => {
  const { user } = useAuth();
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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch Stats
      const dashboardStats = await getRequestStats();
      const supplierCount = await getSupplierCount();

      setStats({
        totalSolicitudes: dashboardStats.total,
        totalSolicitudesChange: '',
        enProgreso: dashboardStats.pending + dashboardStats.inProgress,
        completadas: dashboardStats.completed,
        completadasChange: '',
        proveedoresActivos: supplierCount,
      });

      // Fetch Recent Requests
      const recent = await getRecentRequests(5);
      const mappedRecent = recent.map(r => {
        // Map priority/status to dashboard 'type'
        let type: 'nueva' | 'urgente' | 'cotizacion' = 'nueva';

        if (r.priority === RequestPriority.HIGH || r.priority === RequestPriority.URGENT) {
          type = 'urgente';
        } else if (r.status === RequestStatus.IN_PROGRESS) {
          type = 'busqueda' as any;
        } else if (r.status === RequestStatus.PENDING) {
          type = 'nueva';
        }

        // Action logic
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

  // Helper for Initials
  // const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  // Función para renderizar tarjetas de estadísticas (soporta variantes)
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
      variant === 'highlight' && styles.statCardHighlight,
      variant === 'dark' && styles.statCardDark,
    ];

    const iconTintColor = variant === 'dark' ? '#FFFFFF' : color;
    // For highlight variant (yellow), we might want a specific icon color or keep it as passed
    const finalIconColor = variant === 'highlight' ? '#B45309' : iconTintColor;

    // Background for icon
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
              style={[styles.statIconImage, { tintColor: finalIconColor }]}
              resizeMode="contain"
            />
          </View>
        </View>

        <Text style={[styles.statValue, variant === 'dark' && styles.statValueDark]}>{formattedValue}</Text>

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

  // Función para obtener el color del badge según el tipo
  const getBadgeColor = (type: 'nueva' | 'urgente' | 'cotizacion' | 'busqueda') => {
    switch (type) {
      case 'nueva':
        return '#3B82F6';
      case 'urgente':
        return '#EF4444';
      case 'cotizacion':
        return '#F59E0B';
      case 'busqueda':
        return '#10B981'; // Green for search
      default:
        return '#999999';
    }
  };

  // Función para obtener el texto del badge
  const getBadgeText = (type: 'nueva' | 'urgente' | 'cotizacion' | 'busqueda') => {
    switch (type) {
      case 'nueva':
        return 'NUEVA';
      case 'urgente':
        return 'URGENTE';
      case 'cotizacion':
        return 'COTIZACION';
      case 'busqueda':
        return 'BÚSQUEDA';
      default:
        return '';
    }
  };

  // Función para renderizar las tarjetas de solicitudes
  const renderRequestCard = (request: RequestData) => {
    const badgeColor = getBadgeColor(request.type);
    const badgeText = getBadgeText(request.type);
    const borderLeftColor = badgeColor;

    const cardBackgroundColor = '#FFFFFF';

    return (
      <TouchableOpacity
        key={request.id}
        style={[
          styles.requestCard,
          { borderLeftColor, backgroundColor: cardBackgroundColor }
        ]}
        onPress={() => onNavigateToValidateRequest?.(request.id)}
      >
        {/* Header: Badge and Time */}
        <View style={styles.requestHeader}>
          <View style={[styles.statusBadge, { backgroundColor: badgeColor }]}>
            <Text style={styles.statusBadgeText}>{badgeText}</Text>
          </View>
          <Text style={styles.requestTime}>{request.time}</Text>

          {request.type === 'nueva' && (
            <View style={styles.newIndicatorDot} />
          )}
        </View>

        <Text style={styles.requestTitle}>{request.title}</Text>

        {/* Content based on type */}
        {request.type === 'nueva' && (
          <View style={styles.grayContentBox}>
            <View style={styles.userInfoRow}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{request.userAvatar}</Text>
              </View>
              <View>
                <Text style={styles.requestUser}>{request.user}</Text>
                <Text style={styles.requestDepartment}>• {request.department}</Text>
              </View>
            </View>
            <Text style={styles.requestDescription}>{request.description}</Text>
          </View>
        )}

        {request.type === 'urgente' && (
          <>
            <View style={styles.userInfoRow}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{request.userAvatar}</Text>
              </View>
              <View>
                <Text style={styles.requestUser}>{request.user}</Text>
                <Text style={styles.requestDepartment}>• {request.department}</Text>
              </View>
            </View>

            <View style={styles.urgentActionBox}>
              <Text style={styles.urgentActionText}>{request.description}</Text>
              <TouchableOpacity
                style={styles.inviteButton}
                onPress={() => onNavigateToSuppliers && onNavigateToSuppliers()}
              >
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
                <Text style={styles.requestUser}>{request.user}</Text>
                <Text style={styles.requestDepartment}>• {request.department}</Text>
              </View>
            </View>

            <View style={styles.progressSection}>
              <Text style={styles.progressLabel}>{request.description}</Text>
              <View style={styles.progressRow}>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${request.progress}%` }
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {request.progressCount}
                </Text>
              </View>
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
                <Text style={styles.requestUser}>{request.user}</Text>
                <Text style={styles.requestDepartment}>• {request.department}</Text>
              </View>
            </View>

            <View style={styles.progressSection}>
              <Text style={styles.progressLabel}>{request.description}</Text>
              <View style={styles.progressRow}>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `50%`, backgroundColor: '#10B981' }
                    ]}
                  />
                </View>
                <Text style={[styles.progressText, { color: '#10B981', fontWeight: 'bold' }]}>
                  En Búsqueda
                </Text>
              </View>
              {/* Action Button for Search Phase */}
              <TouchableOpacity
                style={[styles.validateButton, { backgroundColor: '#10B981', marginTop: 10 }]}
                onPress={() => onNavigateToSearch && onNavigateToSearch(request.id)}
              >
                <Text style={styles.validateButtonText}>Gestionar Proveedores</Text>
              </TouchableOpacity>
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

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>DASHBOARD</Text>
            <Text style={styles.subtitle}>Bienvenido, {user?.firstName || 'Gestor'}</Text>
          </View>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/icono_indurama.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Resumen General */}
        <Text style={styles.sectionTitle}>RESUMEN GENERAL</Text>

        {/* Grid de estadísticas 2x2 */}
        <View style={styles.statsGrid}>
          {renderStatCard(
            'Total Solicitudes',
            stats.totalSolicitudes,
            require('../../assets/icons/document.png'),
            '#003E85',
            stats.totalSolicitudesChange,
            undefined,
            undefined,
            'default'
          )}

          {renderStatCard(
            'En Progreso',
            stats.enProgreso,
            require('../../assets/icons/clock.png'),
            '#FF9800',
            undefined,
            'Requieren acción',
            () => onNavigateToRequests && onNavigateToRequests('pending'),
            'highlight'
          )}

          {renderStatCard(
            'Completadas',
            stats.completadas,
            require('../../assets/icons/check.png'),
            '#003E85',
            stats.completadasChange,
            undefined,
            () => onNavigateToRequests && onNavigateToRequests('completed'),
            'default'
          )}

          {renderStatCard(
            'Proveedores Activos',
            stats.proveedoresActivos,
            require('../../assets/icons/users.png'),
            '#FFFFFF',
            undefined,
            undefined,
            () => onNavigateToSuppliers && onNavigateToSuppliers(),
            'dark'
          )}
        </View>

        {/* Métrica circular de eficiencia */}
        <View style={styles.efficiencySection}>
          <View style={styles.efficiencyContent}>

            <View style={styles.efficiencyLeft}>
              <View style={styles.circularMetricContainer}>
                <View style={styles.circularMetricRing} />
                <Text style={styles.percentageText}>55%</Text>
              </View>
              <View style={styles.efficiencyTextContainer}>
                <Text style={styles.efficiencyTitle}>Eficiencia</Text>
                <Text style={styles.efficiencySubtitle}>Tasa Aprobación</Text>
              </View>
            </View>

            <View style={styles.metricsRight}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>TIEMPO PROM.</Text>
                <Text style={styles.metricValue}>12 Días</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>COSTO</Text>
                <Text style={styles.metricValue}>$48</Text>
              </View>
            </View>

          </View>
        </View >

        {/* Solicitudes Recientes */}
        < View style={styles.requestsSection} >
          <View style={styles.requestsHeader}>
            <Text style={styles.requestsSectionTitle}>Solicitudes Recientes</Text>
            <TouchableOpacity
              onPress={() => onNavigateToRequests && onNavigateToRequests()}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>

          {recentRequests.map(renderRequestCard)}
        </View >

        <View style={styles.bottomSpacing} />
      </ScrollView >

      {/* Navegación inferior */}
      < View style={styles.bottomNavigation} >
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {/* Ya estamos en Dashboard */ }}
        >
          <Image
            source={require('../../assets/icons/home.png')}
            style={[styles.navIcon, styles.activeNavIcon]}
          />
          <Text style={[styles.navText, styles.activeNavText]}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onNavigateToRequests && onNavigateToRequests()}
        >
          <Image
            source={require('../../assets/icons/document.png')}
            style={styles.navIcon}
          />
          <Text style={styles.navText}>Solicitudes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onNavigateToSuppliers && onNavigateToSuppliers()}
        >
          <Image
            source={require('../../assets/icons/users.png')}
            style={styles.navIcon}
          />
          <Text style={styles.navText}>Proveedores</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onNavigateToProfile && onNavigateToProfile()}
        >
          <Image
            source={require('../../assets/icons/profile.png')}
            style={styles.navIcon}
          />
          <Text style={styles.navText}>Perfil</Text>
        </TouchableOpacity>
      </View >
    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333333',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    marginTop: 2,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  logoImage: {
    width: 100,
    height: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#888888',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    fontSize: 16,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    width: '48%',
    marginBottom: 12,
    height: 120,
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statCardHighlight: {
    backgroundColor: '#FFF8E1', // Yellowish
    borderWidth: 0,
  },
  statCardDark: {
    backgroundColor: '#0F172A',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    height: 120,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  statDarkCorner: {
    position: 'absolute',
    right: -10,
    top: -10,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#334155',
    opacity: 0.5,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    maxWidth: '70%',
  },
  statLabelDark: {
    color: '#D1D5DB',
  },
  statIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconImage: {
    width: 20,
    height: 20,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
  },
  statValueDark: {
    color: '#FFFFFF',
  },
  statChange: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  additionalTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulletPoint: {
    fontSize: 14,
    color: '#B45309',
    marginRight: 4,
  },
  statAdditionalText: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '600',
  },
  efficiencySection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  efficiencyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  efficiencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circularMetricContainer: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  circularMetricRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 35,
    borderWidth: 6,
    borderColor: '#E5E7EB',
    borderTopColor: '#7C3AED',
    borderRightColor: '#7C3AED',
    transform: [{ rotate: '45deg' }],
  },
  percentageText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  efficiencyTextContainer: {
    justifyContent: 'center',
  },
  efficiencyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  efficiencySubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  metricsRight: {
    flexDirection: 'row',
    gap: 16,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  requestsSection: {
    marginBottom: 32,
  },
  requestsSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  requestsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  viewAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#003E85',
    fontWeight: '600',
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 14,
    borderLeftWidth: 5,
    borderLeftColor: '#4CAF50',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  requestTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  newIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 'auto',
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  grayContentBox: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userAvatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  requestUser: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  requestDepartment: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  requestDescription: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionButtonContainer: {
    alignItems: 'flex-end',
    marginTop: 12,
  },
  validateButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  validateButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  urgentActionBox: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  urgentActionText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  inviteButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  inviteButtonText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  progressSection: {
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    marginRight: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  bottomSpacing: {
    height: 100,
  },
  bottomNavigation: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
    tintColor: '#999999',
    marginBottom: 4,
  },
  activeNavIcon: {
    tintColor: '#003E85',
  },
  navText: {
    fontSize: 12,
    color: '#999999',
  },
  activeNavText: {
    color: '#003E85',
    fontWeight: '600',
  },
});

export default ManagerDashboardScreen;