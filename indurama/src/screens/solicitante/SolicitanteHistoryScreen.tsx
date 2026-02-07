import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ResponsiveNavShell } from '../../components/ResponsiveNavShell';
import { getSolicitanteNavItems } from '../../navigation/solicitanteItems';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { getUserRequests, getRelativeTime } from '../../services/requestService';
import { Request } from '../../types';
import { theme } from '../../styles/theme';
import {
    solicitanteHeaderStyles,
    solicitanteCardStyles,
    solicitanteInputStyles,
    solicitanteFilterStyles,
    solicitanteContentStyles,
    getStatusColor,
} from './solicitanteStyles';

/**
 * Pantalla de Historial de Solicitudes para Solicitante
 * Refactorizada para usar estilos compartidos del Design System
 */

interface SolicitanteHistoryScreenProps {
    onNavigateToDashboard: () => void;
    onNavigateToNewRequest: () => void;
    onNavigateToProfile: () => void;
    onNavigateToRequestDetail?: (requestId: string) => void;
    onNavigateToNotifications?: () => void;
}

export const SolicitanteHistoryScreen: React.FC<SolicitanteHistoryScreenProps> = ({
    onNavigateToDashboard,
    onNavigateToNewRequest,
    onNavigateToProfile,
    onNavigateToRequestDetail,
    onNavigateToNotifications,
}) => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [requests, setRequests] = useState<Request[]>([]);
    const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
    const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'rejected'>('all');
    const [searchText, setSearchText] = useState('');

    const loadRequests = async () => {
        if (!user?.id) return;

        try {
            const data = await getUserRequests(user.id);
            setRequests(data);
            filterRequests(data, activeFilter, searchText);
        } catch (error) {
            console.error('Error loading requests:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, [user?.id]);

    const filterRequests = (data: Request[], filter: string, search: string) => {
        let filtered = data;

        if (filter !== 'all') {
            if (filter === 'pending') {
                filtered = filtered.filter(r => r.status === 'pending' || r.status === 'rectification_required');
            } else if (filter === 'in_progress') {
                filtered = filtered.filter(r => r.status === 'in_progress' || r.status === 'quoting' || (r.status as string) === 'cotizacion');
            } else if (filter === 'completed') {
                filtered = filtered.filter(r => r.status === 'completed' || r.status === 'awarded' || (r.status as string) === 'adjudicado');
            } else {
                filtered = filtered.filter(r => r.status === filter);
            }
        }

        if (search) {
            filtered = filtered.filter(r =>
                r.code.toLowerCase().includes(search.toLowerCase()) ||
                r.description.toLowerCase().includes(search.toLowerCase())
            );
        }

        setFilteredRequests(filtered);
    };

    useEffect(() => {
        filterRequests(requests, activeFilter, searchText);
    }, [activeFilter, searchText]);

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            pending: t('solicitante.status.pending'),
            rectification_required: t('solicitante.status.rectificationRequired'),
            in_progress: t('solicitante.status.inProgress'),
            quoting: t('solicitante.status.quoting'),
            cotizacion: t('solicitante.status.quoting'),
            awarded: t('solicitante.status.awarded'),
            adjudicado: t('solicitante.status.awarded'),
            completed: t('solicitante.status.completed'),
            rejected: t('solicitante.status.rejected'),
        };
        return labels[status] || status;
    };

    const renderStatusBadge = (status: string) => {
        const color = getStatusColor(status);
        return (
            <View style={[styles.statusBadge, { borderColor: color, backgroundColor: color + '15' }]}>
                <Text style={[styles.statusText, { color }]}>{getStatusLabel(status)}</Text>
            </View>
        );
    };

    const renderRequest = ({ item }: { item: Request }) => (
        <TouchableOpacity
            style={solicitanteCardStyles.container}
            onPress={() => onNavigateToRequestDetail?.(item.id)}
        >
            <View style={solicitanteCardStyles.header}>
                <Text style={solicitanteCardStyles.code}>{item.code}</Text>
                {renderStatusBadge(item.status)}
            </View>
            <Text style={solicitanteCardStyles.title} numberOfLines={2}>
                {item.description}
            </Text>
            <View style={styles.detailsRow}>
                <Text style={styles.detailText}>📍 {item.department}</Text>
                <Text style={styles.detailText}>📦 {item.claseBusqueda}</Text>
            </View>
            <Text style={styles.dateText}>{getRelativeTime(item.createdAt)}</Text>
        </TouchableOpacity>
    );

    const navItems = getSolicitanteNavItems(t, {
        onNavigateToDashboard: onNavigateToDashboard,
        onNavigateToNewRequest: onNavigateToNewRequest,
        onNavigateToHistory: () => { },
        onNavigateToProfile: onNavigateToProfile,
    });

    const filters = ['all', 'pending', 'in_progress', 'completed', 'rejected'] as const;
    const filterLabels: Record<string, string> = {
        all: t('solicitante.history.filters.all'),
        pending: t('solicitante.history.filters.pending'),
        in_progress: t('solicitante.history.filters.inProgress'),
        completed: t('solicitante.history.filters.completed'),
        rejected: t('solicitante.history.filters.rejected'),
    };

    return (
        <ResponsiveNavShell
            currentScreen="History"
            navItems={navItems}
            logo={require('../../../assets/icono_indurama.png')}
            onNavigateToNotifications={onNavigateToNotifications}
        >
            <StatusBar style="dark" />

            {/* Header Estandarizado */}
            <View style={solicitanteHeaderStyles.container}>
                <Text style={solicitanteHeaderStyles.title}>{t('solicitante.history.title')}</Text>
            </View>

            {/* Búsqueda */}
            <View style={styles.searchWrapper}>
                <View style={solicitanteInputStyles.searchContainer}>
                    <Ionicons
                        name="search-outline"
                        size={20}
                        color={theme.colors.text.muted}
                        style={solicitanteInputStyles.searchIcon}
                    />
                    <TextInput
                        style={solicitanteInputStyles.searchInput}
                        placeholder={t('solicitante.history.searchDetailedPlaceholder')}
                        placeholderTextColor={theme.colors.text.muted}
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                </View>
            </View>

            {/* Filtros */}
            <View style={solicitanteFilterStyles.container}>
                {filters.map((filter) => (
                    <TouchableOpacity
                        key={filter}
                        style={[
                            solicitanteFilterStyles.chip,
                            activeFilter === filter && solicitanteFilterStyles.chipActive
                        ]}
                        onPress={() => setActiveFilter(filter)}
                    >
                        <Text style={[
                            solicitanteFilterStyles.chipText,
                            activeFilter === filter && solicitanteFilterStyles.chipTextActive
                        ]}>
                            {filterLabels[filter]}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Lista */}
            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={filteredRequests}
                    renderItem={renderRequest}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={solicitanteContentStyles.container}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); loadRequests(); }}
                            colors={[theme.colors.primary]}
                            tintColor={theme.colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={solicitanteContentStyles.emptyState}>
                            <Ionicons name="document-text-outline" size={48} color={theme.colors.text.muted} />
                            <Text style={solicitanteContentStyles.emptyText}>{t('solicitante.history.empty')}</Text>
                        </View>
                    }
                />
            )}
        </ResponsiveNavShell>
    );
};

// Estilos locales (solo los que no están en solicitanteStyles)
const styles = StyleSheet.create({
    searchWrapper: {
        backgroundColor: theme.colors.white,
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[3],
    },
    statusBadge: {
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: theme.spacing[3],
        paddingVertical: theme.spacing[1],
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    detailsRow: {
        flexDirection: 'row',
        gap: theme.spacing[4],
        marginTop: theme.spacing[2],
        marginBottom: theme.spacing[2],
    },
    detailText: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    dateText: {
        fontSize: 12,
        color: theme.colors.text.muted,
    },
});
