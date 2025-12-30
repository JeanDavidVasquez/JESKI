import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Image,
    RefreshControl
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { User, UserRole, UserStatus } from '../types';
import { UserService } from '../services/userService';
import { getUsersPendingApproval, approveUser } from '../services/userApprovalService';
import { useAuth } from '../hooks/useAuth';

// Definir Props manualmente ya que no estamos usando React Navigation types completos por ahora
interface UserManagementScreenProps {
    onNavigateBack: () => void;
}

export const UserManagementScreen: React.FC<UserManagementScreenProps> = ({ onNavigateBack }) => {
    const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const { user: currentUser } = useAuth();

    const fetchUsers = async () => {
        try {
            setLoading(true);
            let fetchedUsers: User[] = [];

            if (activeTab === 'pending') {
                // Use new approval service for pending users
                fetchedUsers = await getUsersPendingApproval();
            } else {
                // Traer todos
                fetchedUsers = await UserService.getUsers();
            }

            setUsers(fetchedUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
            Alert.alert('Error', 'No se pudieron cargar los usuarios');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [activeTab]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchUsers();
    };

    const handleApprove = async (user: User) => {
        const userName = user.companyName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
        Alert.alert(
            'Confirmar Aprobación',
            `¿Deseas aprobar a ${userName}?${user.department ? `\nDepartamento: ${user.department}` : ''}`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Aprobar',
                    onPress: async () => {
                        try {
                            if (!currentUser?.id) {
                                Alert.alert('Error', 'No se pudo obtener información del gestor');
                                return;
                            }

                            await approveUser(user.id, currentUser.id);
                            Alert.alert('Éxito', 'Usuario aprobado correctamente');
                            fetchUsers(); // Recargar lista
                        } catch (error) {
                            console.error('Error approving user:', error);
                            Alert.alert('Error', 'Ocurrió un error al aprobar');
                        }
                    }
                }
            ]
        );
    };

    const renderBadge = (role: UserRole, status: UserStatus) => {
        let backgroundColor = '#E0E0E0';
        let textColor = '#757575';
        let text = role.toUpperCase();

        if (role === UserRole.PROVEEDOR) {
            backgroundColor = '#E3F2FD';
            textColor = '#1976D2';
        } else if (role === UserRole.SOLICITANTE) {
            backgroundColor = '#F3E5F5';
            textColor = '#7B1FA2';
        } else if (role === UserRole.GESTOR || role === UserRole.ADMIN) {
            backgroundColor = '#E8F5E9';
            textColor = '#388E3C';
        }

        // Badge de estado si es pendiente
        if (status === UserStatus.PENDING) {
            return (
                <View style={{ flexDirection: 'row', gap: 5 }}>
                    <View style={[styles.badge, { backgroundColor }]}>
                        <Text style={[styles.badgeText, { color: textColor }]}>{text}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: '#FFF3E0' }]}>
                        <Text style={[styles.badgeText, { color: '#F57C00' }]}>PENDIENTE</Text>
                    </View>
                </View>
            );
        }

        return (
            <View style={[styles.badge, { backgroundColor }]}>
                <Text style={[styles.badgeText, { color: textColor }]}>{text}</Text>
            </View>
        );
    };

    const renderItem = ({ item }: { item: User }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                        {(item.firstName?.charAt(0) || item.companyName?.charAt(0) || item.email?.charAt(0) || '?').toUpperCase()}
                        {(item.lastName?.charAt(0) || item.companyName?.charAt(1) || '').toUpperCase()}
                    </Text>
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                        {item.companyName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.email}
                    </Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                    {item.department && (
                        <Text style={styles.userDepartment}>📍 {item.department}</Text>
                    )}
                    <View style={styles.badgesContainer}>
                        {renderBadge(item.role, item.status)}
                    </View>
                </View>
            </View>

            {(item.status === UserStatus.PENDING || item.approved === false) && (
                <View style={styles.cardActions}>
                    <TouchableOpacity
                        style={styles.approveButton}
                        onPress={() => handleApprove(item)}
                    >
                        <Text style={styles.approveButtonText}>
                            APROBAR {item.role === UserRole.PROVEEDOR ? 'PROVEEDOR' : 'USUARIO'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Volver</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Gestión de Usuarios</Text>
                <View style={{ width: 60 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
                    onPress={() => setActiveTab('pending')}
                >
                    <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
                        Pendientes
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'all' && styles.activeTab]}
                    onPress={() => setActiveTab('all')}
                >
                    <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
                        Todos
                    </Text>
                </TouchableOpacity>
            </View>

            {/* List */}
            <View style={styles.content}>
                {loading ? (
                    <ActivityIndicator size="large" color="#003E85" style={{ marginTop: 20 }} />
                ) : (
                    <FlatList
                        data={users}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>
                                    {activeTab === 'pending'
                                        ? 'No hay proveedores pendientes de aprobación'
                                        : 'No se encontraron usuarios'}
                                </Text>
                            </View>
                        }
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    backButton: {
        padding: 5,
    },
    backButtonText: {
        color: '#003E85',
        fontSize: 16,
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    tab: {
        marginRight: 20,
        paddingVertical: 10,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#003E85',
    },
    tabText: {
        fontSize: 14,
        color: '#757575',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#003E85',
    },
    content: {
        flex: 1,
    },
    listContent: {
        padding: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#757575',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    userEmail: {
        fontSize: 14,
        color: '#757575',
        marginBottom: 5,
    },
    userDepartment: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    badgesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        marginRight: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardActions: {
        marginTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
        paddingTop: 15,
    },
    approveButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    approveButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 50,
    },
    emptyText: {
        color: '#9E9E9E',
        fontSize: 16,
    }
});
