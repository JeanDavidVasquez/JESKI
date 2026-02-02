import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Text,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppContainer } from '../../components';
import { theme } from '../../styles/theme';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isMobile = width < 768;

/**
 * Pantalla principal del Dashboard mejorada
 * Muestra estadísticas y resumen de proveedores con diseño responsive
 */
export const DashboardScreen: React.FC = () => {
  // Datos de ejemplo
  const stats = {
    totalSuppliers: 156,
    activeSuppliers: 142,
    pendingApprovals: 8,
    contractsExpiring: 6,
  };

  const recentActivity = [
    { id: 1, action: 'Nuevo proveedor registrado', supplier: 'Tech Solutions S.A.', time: 'hace 2 horas' },
    { id: 2, action: 'Contrato renovado', supplier: 'Materiales del Norte', time: 'hace 1 día' },
    { id: 3, action: 'Evaluación completada', supplier: 'Servicios Integrales', time: 'hace 2 días' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header mejorado */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: theme.colors.text.primary }}>
              Dashboard
            </Text>
            <Text style={{ fontSize: 16, color: theme.colors.text.secondary, marginTop: 4, opacity: 0.8 }}>
              Gestión de Proveedores Indurama
            </Text>
          </View>

          {/* Icono de usuario */}
          <TouchableOpacity style={styles.userAvatar}>
            <Text style={styles.avatarText}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Estadísticas mejoradas */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Proveedores"
              value={stats.totalSuppliers}
              color={theme.colors.primary}
              icon="📊"
            />
            <StatCard
              title="Activos"
              value={stats.activeSuppliers}
              color={theme.colors.success}
              icon="✅"
            />
            <StatCard
              title="Pendientes"
              value={stats.pendingApprovals}
              color={theme.colors.warning}
              icon="⏳"
            />
            <StatCard
              title="Por Vencer"
              value={stats.contractsExpiring}
              color={theme.colors.error}
              icon="📅"
            />
          </View>
        </View>

        {/* Actividad Reciente */}
        <View style={styles.section}>
          <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 20, color: theme.colors.text.primary }}>
            Actividad Reciente
          </Text>

          <View style={styles.activityContainer}>
            {recentActivity.map((item) => (
              <TouchableOpacity key={item.id} style={styles.activityItem}>
                <View style={styles.activityContent}>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: theme.colors.text.primary }}>
                    {item.action}
                  </Text>
                  <Text style={{ fontSize: 14, color: theme.colors.text.secondary }}>
                    {item.supplier}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: theme.colors.text.tertiary }}>
                  {item.time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Accesos Rápidos */}
        <View style={styles.section}>
          <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 20, color: theme.colors.text.primary }}>
            Accesos Rápidos
          </Text>

          <View style={styles.quickActions}>
            <QuickActionCard
              title="Nuevo Proveedor"
              description="Registrar proveedor"
              icon="➕"
              onPress={() => { }}
            />
            <QuickActionCard
              title="Evaluaciones"
              description="Evaluar proveedores"
              icon="⭐"
              onPress={() => { }}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// Componente de tarjeta de estadística
const StatCard: React.FC<{
  title: string;
  value: number;
  color: string;
  icon: string;
}> = ({ title, value, color, icon }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={styles.statHeader}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: color }}>
        {value}
      </Text>
    </View>
    <Text style={{ fontSize: 14, color: theme.colors.text.secondary }} numberOfLines={2}>
      {title}
    </Text>
  </View>
);

// Componente de acción rápida
const QuickActionCard: React.FC<{
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}> = ({ title, description, icon, onPress }) => (
  <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
    <Text style={styles.quickActionIcon}>{icon}</Text>
    <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text.primary }}>
      {title}
    </Text>
    <Text style={{ fontSize: 14, color: theme.colors.text.secondary }}>
      {description}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  header: {
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: isMobile ? theme.spacing[4] : theme.spacing[6],
    paddingTop: theme.spacing[12],
    paddingBottom: theme.spacing[6],
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.text.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  subtitle: {
    marginTop: theme.spacing[1],
    opacity: 0.8,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: isMobile ? theme.spacing[4] : theme.spacing[6],
    paddingBottom: theme.spacing[8],
  },
  statsContainer: {
    marginTop: theme.spacing[6],
    marginBottom: theme.spacing[8],
  },
  statsGrid: {
    flexDirection: isMobile ? 'column' : 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing[4],
  },
  statCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[5],
    width: isMobile ? '100%' : '48%',
    borderLeftWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.text.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 16px rgba(0, 0, 0, 0.06)',
      },
    }),
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  statIcon: {
    fontSize: 24,
  },
  section: {
    marginBottom: theme.spacing[8],
  },
  sectionTitle: {
    marginBottom: theme.spacing[5],
  },
  activityContainer: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.text.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 16px rgba(0, 0, 0, 0.06)',
      },
    }),
  },
  activityItem: {
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'flex-start' : 'center',
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  activityContent: {
    flex: 1,
  },
  quickActions: {
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    gap: theme.spacing[4],
  },
  quickActionCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[6],
    width: isMobile ? '100%' : '48%',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.text.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 16px rgba(0, 0, 0, 0.06)',
      },
    }),
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: theme.spacing[3],
  },
});