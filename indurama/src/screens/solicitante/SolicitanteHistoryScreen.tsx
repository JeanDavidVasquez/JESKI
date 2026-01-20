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
    Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ResponsiveNavShell } from '../../components/ResponsiveNavShell';
import { useAuth } from '../../hooks/useAuth';
import { getUserRequests, getRelativeTime } from '../../services/requestService';
import { Request } from '../../types';

interface SolicitanteHistoryScreenProps {
    onNavigateToDashboard: () => void;
    onNavigateToNewRequest: () => void;
    onNavigateToProfile: () => void;
    onNavigateToRequestDetail?: (requestId: string) => void;
}

export const SolicitanteHistoryScreen: React.FC<SolicitanteHistoryScreenProps> = ({
    onNavigateToDashboard,
    onNavigateToNewRequest,
    onNavigateToProfile,
    onNavigateToRequestDetail,
}) => {
    // ... (rest of hook logic unchanged)
    const { user } = useAuth();
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

    const getStatusBadge = (status: string) => {
        const configs = {
            pending: { label: 'Pendiente', color: '#FFA726' },
            rectification_required: { label: 'Corregir', color: '#FF9800' },
            in_progress: { label: 'En Progreso', color: '#2196F3' },
            quoting: { label: 'Cotizando', color: '#F59E0B' },
            cotizacion: { label: 'Cotizando', color: '#F59E0B' },
            awarded: { label: 'Adjudicada', color: '#9C27B0' },
            adjudicado: { label: 'Adjudicada', color: '#9C27B0' },
            completed: { label: 'Completada', color: '#4CAF50' },
            rejected: { label: 'Rechazada', color: '#F44336' },
        };
        const config = configs[status as keyof typeof configs] || configs.pending;
        return (
            <View style={[styles.statusBadge, { backgroundColor: config.color + '20' }]}>
                <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
            </View>
        );
    };

    const renderRequest = ({ item }: { item: Request }) => (
        <TouchableOpacity
            style={styles.requestCard}
            onPress={() => onNavigateToRequestDetail?.(item.id)}
        >
            <View style={styles.requestHeader}>
                <Text style={styles.requestCode}>{item.code}</Text>
                {getStatusBadge(item.status)}
            </View>
            <Text style={styles.requestDescription} numberOfLines={2}>
                {item.description}
            </Text>
            <View style={styles.requestDetails}>
                <Text style={styles.detailText}>📍 {item.department}</Text>
                <Text style={styles.detailText}>📦 {item.claseBusqueda}</Text>
            </View>
            <Text style={styles.requestDate}>{getRelativeTime(item.createdAt)}</Text>
        </TouchableOpacity>
    );

    // Navigation items for ResponsiveNavShell (using Ionicons names)
    const navItems = [
        { key: 'Dashboard', label: 'Dashboard', iconName: 'home' as const, onPress: onNavigateToDashboard },
        { key: 'NewRequest', label: 'Nueva Solicitud', iconName: 'add-circle' as const, onPress: onNavigateToNewRequest },
        { key: 'History', label: 'Historial', iconName: 'document-text' as const, onPress: () => { } },
        { key: 'Profile', label: 'Perfil', iconName: 'person' as const, onPress: onNavigateToProfile },
    ];

    return (
        <ResponsiveNavShell
            currentScreen="History"
            navItems={navItems}
            logo={require('../../../assets/icono_indurama.png')}
        >
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Historial de Solicitudes</Text>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por código o descripción..."
                    value={searchText}
                    onChangeText={setSearchText}
                />
            </View>

            {/* Filters */}
            <View style={styles.filtersContainer}>
                {['all', 'pending', 'in_progress', 'completed', 'rejected'].map((filter) => (
                    <TouchableOpacity
                        key={filter}
                        style={[styles.filterButton, activeFilter === filter && styles.filterButtonActive]}
                        onPress={() => setActiveFilter(filter as any)}
                    >
                        <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                            {filter === 'all' ? 'Todas' :
                                filter === 'pending' ? 'Pendientes' :
                                    filter === 'in_progress' ? 'En Progreso' :
                                        filter === 'completed' ? 'Completadas' : 'Rechazadas'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#003E85" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={filteredRequests}
                    renderItem={renderRequest}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadRequests(); }} />}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No se encontraron solicitudes</Text>
                        </View>
                    }
                />
            )}
        </ResponsiveNavShell>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        paddingTop: 50,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#003E85',
    },
    searchContainer: {
        backgroundColor: '#FFFFFF',
        padding: 16,
    },
    searchInput: {
        backgroundColor: '#F5F5F5',
        padding: 12,
        borderRadius: 8,
        fontSize: 14,
    },
    filtersContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        gap: 8,
    },
    filterButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#F5F5F5',
    },
    filterButtonActive: {
        backgroundColor: '#003E85',
    },
    filterText: {
        fontSize: 12,
        color: '#666',
    },
    filterTextActive: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
    },
    requestCard: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    requestHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    requestCode: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#003E85',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    requestDescription: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
        lineHeight: 20,
    },
    requestDetails: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 8,
    },
    detailText: {
        fontSize: 12,
        color: '#666',
    },
    requestDate: {
        fontSize: 12,
        color: '#999',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
});
