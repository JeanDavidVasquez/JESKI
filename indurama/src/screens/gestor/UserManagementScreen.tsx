/**
 * UserManagementScreen - Gestión de usuarios pendientes de aprobación
 * Para Gestores/Admin - Permite aprobar proveedores y solicitantes
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
    useWindowDimensions,
    Platform,
    Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { User, UserRole, UserStatus } from '../../types';
import { UserService } from '../../services/userService';
import { getUsersPendingApproval, approveUser } from '../../services/userApprovalService';
import { useAuth } from '../../hooks/useAuth';
import { theme } from '../../styles/theme';
import { auth } from '../../services/firebaseConfig';

interface UserManagementScreenProps {
    onNavigateBack: () => void;
}

export const UserManagementScreen: React.FC<UserManagementScreenProps> = ({ onNavigateBack }) => {
    const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [approving, setApproving] = useState<string | null>(null);
    const [changingRole, setChangingRole] = useState<string | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ visible: boolean; user: User | null }>({ visible: false, user: null });
    const [roleChangeModal, setRoleChangeModal] = useState<{ visible: boolean; user: User | null; newRole: UserRole | null }>({
        visible: false,
        user: null,
        newRole: null
    });

    const { user: currentUser } = useAuth();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 768;

    const fetchUsers = async () => {
        try {
            setLoading(true);
            let fetchedUsers: User[] = [];

            if (activeTab === 'pending') {
                fetchedUsers = await getUsersPendingApproval();
            } else {
                fetchedUsers = await UserService.getUsers();
            }

            setUsers(fetchedUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
            if (Platform.OS === 'web') {
                window.alert('Error: No se pudieron cargar los usuarios');
            } else {
                Alert.alert('Error', 'No se pudieron cargar los usuarios');
            }
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

    const showConfirmApprove = (user: User) => {
        if (Platform.OS === 'web') {
            setConfirmModal({ visible: true, user });
        } else {
            const userName = user.companyName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
            Alert.alert(
                'Confirmar Aprobación',
                `¿Deseas aprobar a ${userName}?`,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Aprobar', onPress: () => handleApprove(user) }
                ]
            );
        }
    };

    const handleApprove = async (user: User) => {
        try {
            setApproving(user.id);
            setConfirmModal({ visible: false, user: null });

            // Try multiple sources for manager ID
            let managerId = currentUser?.id;

            // Fallback 1: auth.currentUser
            if (!managerId && auth.currentUser) {
                managerId = auth.currentUser.uid;
            }

            // Fallback 2: Use a generic system ID if no manager is available
            // This allows approval to proceed while still tracking that someone approved
            if (!managerId) {
                managerId = 'system-approval';
                console.warn('Manager ID not available, using system-approval');
            }

            await approveUser(user.id, managerId);

            if (Platform.OS === 'web') {
                window.alert('✓ Usuario aprobado correctamente');
            } else {
                Alert.alert('Éxito', 'Usuario aprobado correctamente');
            }

            fetchUsers();
        } catch (error) {
            console.error('Error approving user:', error);
            if (Platform.OS === 'web') {
                window.alert('Error: Ocurrió un error al aprobar. Verifica tu conexión.');
            } else {
                Alert.alert('Error', 'Ocurrió un error al aprobar');
            }
        } finally {
            setApproving(null);
        }
    };

    // Handle role change between Solicitante and Gestor
    const showRoleChangeModal = (user: User) => {
        if (user.role === UserRole.PROVEEDOR) return; // Providers cannot change roles

        const newRole = user.role === UserRole.SOLICITANTE ? UserRole.GESTOR : UserRole.SOLICITANTE;

        if (Platform.OS === 'web') {
            setRoleChangeModal({ visible: true, user, newRole });
        } else {
            const userName = user.companyName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
            const roleLabel = newRole === UserRole.GESTOR ? 'Gestor' : 'Solicitante';
            Alert.alert(
                'Cambiar Rol',
                `¿Cambiar el rol de ${userName} a ${roleLabel}?`,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Cambiar', onPress: () => handleRoleChange(user, newRole) }
                ]
            );
        }
    };

    const handleRoleChange = async (user: User, newRole: UserRole) => {
        try {
            setChangingRole(user.id);
            setRoleChangeModal({ visible: false, user: null, newRole: null });

            await UserService.updateUser(user.id, { role: newRole });

            const roleLabel = newRole === UserRole.GESTOR ? 'Gestor' : 'Solicitante';
            if (Platform.OS === 'web') {
                window.alert(`✓ Rol cambiado a ${roleLabel} correctamente`);
            } else {
                Alert.alert('Éxito', `Rol cambiado a ${roleLabel} correctamente`);
            }

            fetchUsers();
        } catch (error) {
            console.error('Error changing role:', error);
            if (Platform.OS === 'web') {
                window.alert('Error: No se pudo cambiar el rol');
            } else {
                Alert.alert('Error', 'No se pudo cambiar el rol');
            }
        } finally {
            setChangingRole(null);
        }
    };

    const getRoleBadgeStyle = (role: UserRole) => {
        switch (role) {
            case UserRole.PROVEEDOR:
                return { bg: '#DBEAFE', color: '#1D4ED8', label: 'PROVEEDOR' };
            case UserRole.SOLICITANTE:
                return { bg: '#F3E8FF', color: '#7C3AED', label: 'SOLICITANTE' };
            case UserRole.GESTOR:
                return { bg: '#D1FAE5', color: '#047857', label: 'GESTOR' };
            case UserRole.ADMIN:
                return { bg: '#FEE2E2', color: '#B91C1C', label: 'ADMIN' };
            default:
                return { bg: '#F3F4F6', color: '#6B7280', label: role.toUpperCase() };
        }
    };

    const renderItem = ({ item }: { item: User }) => {
        const roleStyle = getRoleBadgeStyle(item.role);
        const isApprovingThis = approving === item.id;
        const isPending = item.status === UserStatus.PENDING || item.approved === false;

        return (
            <View style={styles.card}>
                <View style={styles.cardContent}>
                    {/* Avatar */}
                    <View style={[styles.avatar, { backgroundColor: roleStyle.bg }]}>
                        <Text style={[styles.avatarText, { color: roleStyle.color }]}>
                            {(item.firstName?.charAt(0) || item.companyName?.charAt(0) || item.email?.charAt(0) || '?').toUpperCase()}
                        </Text>
                    </View>

                    {/* Info */}
                    <View style={styles.infoContainer}>
                        <Text style={styles.userName}>
                            {item.companyName || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Usuario'}
                        </Text>
                        <Text style={styles.userEmail}>{item.email}</Text>

                        {item.department && (
                            <View style={styles.departmentRow}>
                                <Ionicons name="location-outline" size={12} color="#9CA3AF" />
                                <Text style={styles.departmentText}>{item.department}</Text>
                            </View>
                        )}

                        <View style={styles.badgesRow}>
                            <View style={[styles.badge, { backgroundColor: roleStyle.bg }]}>
                                <Text style={[styles.badgeText, { color: roleStyle.color }]}>{roleStyle.label}</Text>
                            </View>
                            {isPending && (
                                <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}>
                                    <Ionicons name="time-outline" size={10} color="#D97706" />
                                    <Text style={[styles.badgeText, { color: '#D97706', marginLeft: 4 }]}>PENDIENTE</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Approve Button */}
                {isPending && (
                    <TouchableOpacity
                        style={[styles.approveButton, isApprovingThis && styles.approveButtonDisabled]}
                        onPress={() => showConfirmApprove(item)}
                        disabled={isApprovingThis}
                        activeOpacity={0.7}
                    >
                        {isApprovingThis ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                                <Text style={styles.approveButtonText}>
                                    Aprobar {item.role === UserRole.PROVEEDOR ? 'Proveedor' : 'Usuario'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {/* Role Change Button - Only for non-providers and approved users */}
                {!isPending && item.role !== UserRole.PROVEEDOR && item.role !== UserRole.ADMIN && (
                    <TouchableOpacity
                        style={[styles.roleChangeButton, changingRole === item.id && styles.roleChangeButtonDisabled]}
                        onPress={() => showRoleChangeModal(item)}
                        disabled={changingRole === item.id}
                        activeOpacity={0.7}
                    >
                        {changingRole === item.id ? (
                            <ActivityIndicator size="small" color="#6366F1" />
                        ) : (
                            <>
                                <Ionicons name="swap-horizontal" size={18} color="#6366F1" />
                                <Text style={styles.roleChangeButtonText}>
                                    Cambiar a {item.role === UserRole.SOLICITANTE ? 'Gestor' : 'Solicitante'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={[styles.header, isDesktop && styles.headerDesktop]}>
                <View style={[styles.headerContent, isDesktop && styles.headerContentDesktop]}>
                    <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
                        {isDesktop && <Text style={styles.backText}>Volver</Text>}
                    </TouchableOpacity>
                    <Text style={styles.title}>Gestión de Usuarios</Text>
                    <View style={{ width: isDesktop ? 100 : 40 }} />
                </View>
            </View>

            {/* Tabs */}
            <View style={[styles.tabsWrapper, isDesktop && styles.tabsWrapperDesktop]}>
                <View style={[styles.tabsContainer, isDesktop && styles.tabsContainerDesktop]}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
                        onPress={() => setActiveTab('pending')}
                    >
                        <Ionicons
                            name="time-outline"
                            size={16}
                            color={activeTab === 'pending' ? theme.colors.primary : '#9CA3AF'}
                        />
                        <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
                            Pendientes
                        </Text>
                        {users.length > 0 && activeTab === 'pending' && (
                            <View style={styles.tabBadge}>
                                <Text style={styles.tabBadgeText}>{users.length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'all' && styles.activeTab]}
                        onPress={() => setActiveTab('all')}
                    >
                        <Ionicons
                            name="people-outline"
                            size={16}
                            color={activeTab === 'all' ? theme.colors.primary : '#9CA3AF'}
                        />
                        <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
                            Todos
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* List */}
            <View style={styles.content}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={styles.loadingText}>Cargando usuarios...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={users}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={[
                            styles.listContent,
                            isDesktop && styles.listContentDesktop
                        ]}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={theme.colors.primary}
                                colors={[theme.colors.primary]}
                            />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons
                                    name={activeTab === 'pending' ? 'checkmark-circle-outline' : 'people-outline'}
                                    size={64}
                                    color="#E5E7EB"
                                />
                                <Text style={styles.emptyTitle}>
                                    {activeTab === 'pending' ? 'Sin pendientes' : 'Sin usuarios'}
                                </Text>
                                <Text style={styles.emptyText}>
                                    {activeTab === 'pending'
                                        ? 'No hay usuarios pendientes de aprobación'
                                        : 'No se encontraron usuarios'}
                                </Text>
                            </View>
                        }
                    />
                )}
            </View>

            {/* Confirmation Modal for Web */}
            <Modal
                visible={confirmModal.visible}
                transparent
                animationType="fade"
                onRequestClose={() => setConfirmModal({ visible: false, user: null })}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIcon}>
                            <Ionicons name="help-circle" size={48} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.modalTitle}>Confirmar Aprobación</Text>
                        <Text style={styles.modalMessage}>
                            ¿Deseas aprobar a{' '}
                            <Text style={{ fontWeight: 'bold' }}>
                                {confirmModal.user?.companyName ||
                                    `${confirmModal.user?.firstName || ''} ${confirmModal.user?.lastName || ''}`.trim() ||
                                    confirmModal.user?.email}
                            </Text>?
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => setConfirmModal({ visible: false, user: null })}
                            >
                                <Text style={styles.modalCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalConfirmButton}
                                onPress={() => confirmModal.user && handleApprove(confirmModal.user)}
                            >
                                <Ionicons name="checkmark" size={18} color="#FFF" />
                                <Text style={styles.modalConfirmText}>Aprobar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Role Change Modal for Web */}
            <Modal
                visible={roleChangeModal.visible}
                transparent
                animationType="fade"
                onRequestClose={() => setRoleChangeModal({ visible: false, user: null, newRole: null })}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIcon}>
                            <Ionicons name="swap-horizontal" size={48} color="#6366F1" />
                        </View>
                        <Text style={styles.modalTitle}>Cambiar Rol</Text>
                        <Text style={styles.modalMessage}>
                            ¿Cambiar el rol de{' '}
                            <Text style={{ fontWeight: 'bold' }}>
                                {roleChangeModal.user?.companyName ||
                                    `${roleChangeModal.user?.firstName || ''} ${roleChangeModal.user?.lastName || ''}`.trim() ||
                                    roleChangeModal.user?.email}
                            </Text>{' '}
                            a{' '}
                            <Text style={{ fontWeight: 'bold', color: '#6366F1' }}>
                                {roleChangeModal.newRole === UserRole.GESTOR ? 'Gestor' : 'Solicitante'}
                            </Text>?
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => setRoleChangeModal({ visible: false, user: null, newRole: null })}
                            >
                                <Text style={styles.modalCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalConfirmButton, { backgroundColor: '#6366F1' }]}
                                onPress={() => roleChangeModal.user && roleChangeModal.newRole && handleRoleChange(roleChangeModal.user, roleChangeModal.newRole)}
                            >
                                <Ionicons name="swap-horizontal" size={18} color="#FFF" />
                                <Text style={styles.modalConfirmText}>Cambiar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        backgroundColor: '#FFF',
        paddingTop: Platform.OS === 'ios' ? 50 : 40,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    headerDesktop: {
        paddingTop: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    headerContentDesktop: {
        maxWidth: 800,
        alignSelf: 'center',
        width: '100%',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        gap: 8,
    },
    backText: {
        ...theme.typography.styles.bodyLargeSemibold,
        color: theme.colors.primary,
    },
    title: {
        ...theme.typography.styles.h4,
        color: '#111827',
    },
    tabsWrapper: {
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    tabsWrapperDesktop: {},
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
    },
    tabsContainerDesktop: {
        maxWidth: 800,
        alignSelf: 'center',
        width: '100%',
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 12,
        marginRight: 8,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
        gap: 6,
    },
    activeTab: {
        borderBottomColor: theme.colors.primary,
    },
    tabText: {
        fontSize: 14,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    roleButtonText: {
        ...theme.typography.styles.buttonSmall,
        color: theme.colors.primary,
    },
    activeTabText: {
        color: theme.colors.primary,
        fontWeight: '600',
    },
    tabBadge: {
        backgroundColor: '#EF4444',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        minWidth: 20,
        alignItems: 'center',
    },
    tabBadgeText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#6B7280',
    },
    listContent: {
        padding: 16,
    },
    listContentDesktop: {
        maxWidth: 700,
        alignSelf: 'center',
        width: '100%',
        paddingHorizontal: 24,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    infoContainer: {
        flex: 1,
    },
    userName: {
        ...theme.typography.styles.bodyLargeSemibold,
        color: '#111827',
        marginBottom: 2,
    },
    userEmail: {
        ...theme.typography.styles.body,
        color: '#6B7280',
        marginBottom: 6,
    },
    departmentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
    },
    departmentText: {
        ...theme.typography.styles.bodySmall,
        color: '#9CA3AF',
    },
    badgesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        ...theme.typography.styles.captionBold,
        fontSize: 10,
    },
    approveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10B981',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginTop: 14,
        gap: 8,
    },
    approveButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    approveButtonText: {
        ...theme.typography.styles.button,
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        ...theme.typography.styles.bodySemibold,
        color: '#6B7280',
        marginTop: 16,
    },
    emptyText: {
        color: '#9CA3AF',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    modalIcon: {
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
    },
    modalMessage: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalCancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
    },
    modalCancelText: {
        color: '#6B7280',
        fontWeight: '600',
        fontSize: 15,
    },
    modalConfirmButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    modalConfirmText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 15,
    },
    // Role change button styles
    roleChangeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EEF2FF',
        borderWidth: 1,
        borderColor: '#C7D2FE',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginTop: 10,
        gap: 8,
    },
    roleChangeButtonDisabled: {
        backgroundColor: '#F3F4F6',
        borderColor: '#E5E7EB',
    },
    roleChangeButtonText: {
        color: '#6366F1',
        fontWeight: '600',
        fontSize: 13,
    },
});

export default UserManagementScreen;
