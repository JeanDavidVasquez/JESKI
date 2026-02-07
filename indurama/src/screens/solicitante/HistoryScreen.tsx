import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppLayout } from '../../components/AppLayout';
import { RequestCard } from '../../components/RequestCard';
import { useLanguage } from '../../hooks/useLanguage';
import { getSolicitanteNavItems } from '../../navigation/solicitanteItems';
import { theme } from '../../styles/theme';

/**
 * Pantalla de Historial de Solicitudes para el rol de Solicitante
 * Refactorizada para usar AppLayout universal del Design System
 */

interface HistoryRequest {
  id: string;
  code: string;
  title: string;
  date: string;
  status: 'En Progreso' | 'Completado';
}

interface HistoryScreenProps {
  onNavigateToDashboard?: () => void;
  onNavigateToRequests?: () => void; // Alias for backward compatibility
  onNavigateToNewRequest?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToHistory?: () => void;
  onNavigateToDetail?: (requestId: string) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  onNavigateToDashboard,
  onNavigateToRequests, // Backward compatibility
  onNavigateToNewRequest,
  onNavigateToProfile,
  onNavigateToHistory,
  onNavigateToDetail,
}) => {
  // Use onNavigateToDashboard or fall back to onNavigateToRequests
  const handleNavigateToDashboard = onNavigateToDashboard || onNavigateToRequests;
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - will be replaced with real data
  const [historyRequests] = useState<HistoryRequest[]>([
    { id: '1', code: 'SOL-2025-042', title: 'Materia prima línea A', date: '15 Ene 2025', status: 'En Progreso' },
    { id: '2', code: 'SOL-2025-038', title: 'Repuestos de Maquinaria', date: '25 Feb 2025', status: 'Completado' },
    { id: '3', code: 'SOL-2025-035', title: 'Registros de Calibración', date: '05 May 2025', status: 'En Progreso' },
    { id: '4', code: 'SOL-2025-042', title: 'Materiales de Empaque', date: '15 Ene 2025', status: 'Completado' },
    { id: '5', code: 'SOL-2025-025', title: 'Componentes Electrónicos', date: '28 Ene 2025', status: 'En Progreso' },
    { id: '6', code: 'SOL-2025-042', title: 'Televisores Empacados', date: '16 Dic 2025', status: 'En Progreso' },
  ]);

  const navItems = getSolicitanteNavItems(t, {
    onNavigateToDashboard: handleNavigateToDashboard || (() => { }),
    onNavigateToNewRequest: onNavigateToNewRequest || (() => { }),
    onNavigateToHistory: onNavigateToHistory || (() => { }),
    onNavigateToProfile: onNavigateToProfile || (() => { }),
  });

  const filteredRequests = historyRequests.filter(request =>
    request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusLabel = (status: string) => {
    return status === 'En Progreso'
      ? t('solicitante.status.inProgress')
      : t('solicitante.status.completed');
  };

  const getStatusColor = (status: string) => {
    return status === 'En Progreso' ? theme.colors.primary : theme.colors.success;
  };

  return (
    <AppLayout
      title={t('history.title')}
      subtitle={t('history.subtitle')}
      currentScreen="Historial"
      navItems={navItems}
      logo={require('../../../assets/icono_indurama.png')}
    >
      {/* Barra de Búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color={theme.colors.text.muted}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={t('history.searchPlaceholder')}
            placeholderTextColor={theme.colors.text.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Título de Sección */}
      <Text style={styles.sectionTitle}>{t('history.recentRequests')}</Text>

      {/* Lista de Solicitudes */}
      <View style={styles.requestsList}>
        {filteredRequests.map((request) => (
          <RequestCard
            key={request.id}
            code={request.code}
            title={request.title}
            status={getStatusLabel(request.status)}
            statusColor={getStatusColor(request.status)}
            date={request.date}
            onPress={() => onNavigateToDetail?.(request.id)}
          />
        ))}
      </View>

      {/* Empty State */}
      {filteredRequests.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons
            name="document-text-outline"
            size={48}
            color={theme.colors.text.muted}
          />
          <Text style={styles.emptyText}>
            {t('history.noResults')}
          </Text>
        </View>
      )}
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    marginBottom: theme.spacing[6],
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    ...theme.shadows.sm,
  },
  searchIcon: {
    marginRight: theme.spacing[3],
  },
  searchInput: {
    flex: 1,
    ...theme.typography.styles.body,
    color: theme.colors.text.primary,
  },
  sectionTitle: {
    ...theme.typography.styles.h3,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[4],
  },
  requestsList: {
    gap: theme.spacing[3],
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing[10],
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
  },
  emptyText: {
    ...theme.typography.styles.body,
    color: theme.colors.text.muted,
    marginTop: theme.spacing[3],
  },
});

export default HistoryScreen;