import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Dimensions,
  Platform,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

// Tipos para las estadísticas
interface DashboardStats {
  totalSolicitudes: number;
  totalSolicitudesChange: string;
  enProgreso: number;
  completadas: number;
  completadasChange: string;
  proveedoresActivos: number;
}

// Tipos para las solicitudes recientes
interface RecentRequest {
  id: string;
  type: 'solicitud' | 'cotizacion_enviada' | 'cotizacion_recibida';
  title: string;
  description: string;
  user: string;
  department: string;
  time: string;
}

// Tipos para las métricas
interface MonthlyMetrics {
  tasaAprobacion: number;
  tiempoPromedio: number;
  costoPromedio: number;
}

// Props para la pantalla
interface ManagerDashboardScreenProps {
  onNavigateToSolicitudes?: () => void;
  onNavigateToProveedores?: () => void;
  onNavigateToRequests?: (filter?: 'all' | 'pending' | 'completed') => void;
}

/**
 * Pantalla de Dashboard para el rol de Gestor
 */
export const ManagerDashboardScreen: React.FC<ManagerDashboardScreenProps> = ({ 
  onNavigateToSolicitudes,
  onNavigateToProveedores,
  onNavigateToRequests
}) => {
  const [stats] = useState<DashboardStats>({
    totalSolicitudes: 247,
    totalSolicitudesChange: '+124 vs mes anterior',
    enProgreso: 38,
    completadas: 195,
    completadasChange: '+8% vs mes anterior',
    proveedoresActivos: 124
  });

  const [recentRequests] = useState<RecentRequest[]>([
    {
      id: '1',
      type: 'solicitud',
      title: 'Solicitudes Recientes',
      description: 'Solicitud de materia prima para la línea de producción A',
      user: 'Juan Pérez',
      department: 'Producción',
      time: 'Hace 2 horas'
    },
    {
      id: '2',
      type: 'cotizacion_enviada',
      title: 'Cotización enviada',
      description: 'Solicitud #SOL-2025-042 enviada a 3 proveedores',
      user: 'María Gonzales',
      department: 'Compras',
      time: 'Hace 5 horas'
    },
    {
      id: '3',
      type: 'cotizacion_recibida',
      title: 'Cotización recibida',
      description: 'TecnoPartes S.A. envió su propuesta económica',
      user: '',
      department: '',
      time: 'Ayer'
    }
  ]);

  const [metrics] = useState<MonthlyMetrics>({
    tasaAprobacion: 94,
    tiempoPromedio: 12,
    costoPromedio: 48500
  });

  const handleNavigateToSolicitudes = () => {
    if (onNavigateToSolicitudes) {
      onNavigateToSolicitudes();
    }
  };

  const handleNavigateToProveedores = () => {
    if (onNavigateToProveedores) {
      onNavigateToProveedores();
    }
  };

  const getRequestIcon = (type: string) => {
    switch (type) {
      case 'solicitud':
        return require('../../assets/icons/document.png');
      case 'cotizacion_enviada':
        return require('../../assets/icons/send.png');
      case 'cotizacion_recibida':
        return require('../../assets/icons/inbox.png');
      default:
        return require('../../assets/icons/document.png');
    }
  };

  const getRequestIconColor = (type: string) => {
    switch (type) {
      case 'solicitud':
        return '#2196F3';
      case 'cotizacion_enviada':
        return '#9C27B0';
      case 'cotizacion_recibida':
        return '#00BCD4';
      default:
        return '#2196F3';
    }
  };

  const renderStatCard = (
    title: string, 
    value: string | number, 
    icon: ImageSourcePropType, 
    iconColor: string,
    change?: string,
    onPress?: () => void
  ) => {
    const CardComponent = onPress ? TouchableOpacity : View;
    
    return (
      <CardComponent style={styles.statCard} onPress={onPress}>
        <View style={styles.statContent}>
          <View style={styles.statInfo}>
            <Text style={styles.statTitle}>{title}</Text>
            <Text style={styles.statValue}>{value}</Text>
            {change && (
              <Text style={styles.statChange}>{change}</Text>
            )}
          </View>
          <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
            <Image 
              source={icon}
              style={[styles.statIconImage, { tintColor: iconColor }]}
              resizeMode="contain"
            />
          </View>
        </View>
      </CardComponent>
    );
  };

  const renderRequestItem = (request: RecentRequest) => {
    return (
      <View key={request.id} style={styles.requestItem}>
        <View style={[
          styles.requestIcon, 
          { backgroundColor: `${getRequestIconColor(request.type)}15` }
        ]}>
          <Image 
            source={getRequestIcon(request.type)}
            style={[styles.requestIconImage, { tintColor: getRequestIconColor(request.type) }]}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.requestContent}>
          <Text style={styles.requestTitle}>{request.title}</Text>
          <Text style={styles.requestDescription}>{request.description}</Text>
          {request.user && (
            <View style={styles.requestUserInfo}>
              <Text style={styles.requestUser}>{request.user}</Text>
              <Text style={styles.requestDepartment}>• {request.department}</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.requestTime}>{request.time}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>DASHBOARD</Text>
            
            {/* Logo de Indurama */}
            <View style={styles.logoContainer}>
              <Image 
                source={require('../../assets/icono_indurama.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>
          
          
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        <Text style={styles.subtitle}>
            Resumen general del sistema de evaluacion de proveedores
        </Text>
        
        {/* Estadísticas Principales */}
        <View style={styles.statsContainer}>
          {renderStatCard(
            'Total Solicitudes',
            stats.totalSolicitudes,
            require('../../assets/icons/document.png'),
            '#003E85',
            stats.totalSolicitudesChange
          )}
          
          {renderStatCard(
            'En Progreso',
            stats.enProgreso,
            require('../../assets/icons/clock.png'),
            '#003E85',
            undefined,
            () => onNavigateToRequests && onNavigateToRequests('pending')
          )}
          
          {renderStatCard(
            'Completadas',
            stats.completadas,
            require('../../assets/icons/check.png'),
            '#003E85',
            stats.completadasChange,
            () => onNavigateToRequests && onNavigateToRequests('completed')
          )}
          
          {renderStatCard(
            'Proveedores Activos',
            stats.proveedoresActivos,
            require('../../assets/icons/users.png'),
            '#003E85'
          )}
        </View>

        {/* Solicitudes Recientes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Solicitudes Recientes</Text>
          
          <View style={styles.requestsList}>
            {recentRequests.map(request => renderRequestItem(request))}
          </View>
        </View>

        {/* Métricas del Mes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Métricas del Mes</Text>
          
          <View style={styles.metricsContainer}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Tasa de Aprobación</Text>
              <Text style={styles.metricValue}>{metrics.tasaAprobacion}%</Text>
            </View>
            
            <View style={styles.metricDivider} />
            
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Tiempo Promedio</Text>
              <Text style={styles.metricValue}>{metrics.tiempoPromedio} días</Text>
              <Text style={styles.metricSubtext}>Por Proceso completo</Text>
            </View>
            
            <View style={styles.metricDivider} />
            
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Costo Promedio Aprobado</Text>
              <Text style={styles.metricValueGreen}>${metrics.costoPromedio.toLocaleString()}</Text>
              <Text style={styles.metricSubtextGreen}>Este mes</Text>
            </View>
          </View>
        </View>
        
        {/* Espacio inferior */}
        <View style={styles.bottomSpacing} />
        
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={handleNavigateToSolicitudes}
        >
          <Image 
            source={require('../../assets/icons/home.png')}
            style={[styles.navIcon, styles.activeNavIcon]}
            resizeMode="contain"
          />
          <Text style={[styles.navText, styles.activeNavText]}>Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => onNavigateToRequests && onNavigateToRequests('all')}
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
          onPress={handleNavigateToProveedores}
        >
          <Image 
            source={require('../../assets/icons/users.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
          <Text style={styles.navText}>Proveedores</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: isMobile ? 20 : 40,
    paddingBottom: 2,
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
  },
  headerContent: {
    alignItems: 'flex-start',
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: 52,
    height: 52,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: isMobile ? 20 : 40,
    paddingTop: 20,
  },
  statsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statInfo: {
    flex: 1,
  },
  statTitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  statChange: {
    fontSize: 12,
    color: '#4CAF50',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  statIconImage: {
    width: 24,
    height: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  requestsList: {
    gap: 16,
  },
  requestItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  requestIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  requestIconImage: {
    width: 20,
    height: 20,
  },
  requestContent: {
    flex: 1,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  requestDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    lineHeight: 20,
  },
  requestUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestUser: {
    fontSize: 12,
    color: '#333333',
    fontWeight: '500',
  },
  requestDepartment: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  requestTime: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 8,
  },
  metricsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  metricItem: {
    paddingVertical: 16,
    alignItems: 'flex-start',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  metricValueGreen: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  metricSubtext: {
    fontSize: 12,
    color: '#999999',
  },
  metricSubtextGreen: {
    fontSize: 12,
    color: '#4CAF50',
  },
  metricDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
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