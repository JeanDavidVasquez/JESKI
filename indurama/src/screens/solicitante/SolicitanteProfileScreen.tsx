import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Image,
    Linking,
    Platform,
    TextInput,
    ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ResponsiveNavShell } from '../../components/ResponsiveNavShell';
import { useAuth } from '../../hooks/useAuth';
import { getUserRequestStats, getUserRequests } from '../../services/requestService';

interface SolicitanteProfileScreenProps {
    onNavigateToDashboard: () => void;
    onNavigateToNewRequest: () => void;
    onNavigateToHistory: () => void;
    onLogout: () => void;
    onNavigateToNotifications?: () => void;
}

export const SolicitanteProfileScreen: React.FC<SolicitanteProfileScreenProps> = ({
    onNavigateToDashboard,
    onNavigateToNewRequest,
    onNavigateToHistory,
    onLogout,
    onNavigateToNotifications,
}) => {
    const { user, updateProfile } = useAuth();
    const [stats, setStats] = useState({ total: 0, thisMonth: 0, approvedPercentage: 0 });
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        position: '',
        department: '',
        phone: ''
    });

    useEffect(() => {
        if (user) {
            setForm({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                position: user.position || '',
                department: user.department || '',
                phone: user.phone || ''
            });
        }
    }, [user]);

    useEffect(() => {
        const loadStats = async () => {
            if (user?.id) {
                try {
                    const requests = await getUserRequests(user.id);
                    const total = requests.length;
                    const now = new Date();
                    const thisMonth = requests.filter(r => {
                        const rawDate = r.createdAt as any;
                        const d = rawDate?.toDate ? rawDate.toDate() : new Date(rawDate);
                        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                    }).length;
                    const completed = requests.filter(r => r.status === 'completed').length;
                    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                    setStats({ total, thisMonth, approvedPercentage: percentage });
                } catch (e) {
                    console.error(e);
                }
            }
        };
        loadStats();
    }, [user?.id]);

    const handleLogout = () => {
        if (Platform.OS === 'web') {
            if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
                onLogout();
            }
            return;
        }
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro que deseas cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sí, cerrar sesión', onPress: onLogout, style: 'destructive' }
            ]
        );
    };

    const handleSave = async () => {
        if (!user?.id) return;
        setSaving(true);
        try {
            const result = await updateProfile(form);
            if (result.success) {
                Alert.alert('Éxito', 'Perfil actualizado');
                setIsEditing(false);
            } else {
                Alert.alert('Error', result.error || 'Falló la actualización');
            }
        } catch (e) {
            Alert.alert('Error', 'Ocurrió un error inesperado');
        } finally {
            setSaving(false);
        }
    };

    // Navigation items for ResponsiveNavShell (using Ionicons names)
    const navItems = [
        { key: 'Dashboard', label: 'Dashboard', iconName: 'home' as const, onPress: onNavigateToDashboard },
        { key: 'NewRequest', label: 'Nueva Solicitud', iconName: 'add-circle' as const, onPress: onNavigateToNewRequest },
        { key: 'History', label: 'Historial', iconName: 'document-text' as const, onPress: onNavigateToHistory },
        { key: 'Profile', label: 'Perfil', iconName: 'person' as const, onPress: () => { } },
    ];

    return (
        <ResponsiveNavShell
            currentScreen="Profile"
            navItems={navItems}
            logo={require('../../../assets/icono_indurama.png')}
            onNavigateToNotifications={onNavigateToNotifications}
        >
            <StatusBar style="light" />

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                {/* Blue Header */}
                <View style={styles.headerContainer}>
                    <View style={styles.headerTop}>
                        <Text style={styles.headerTitle}>{isEditing ? 'Editando Perfil' : 'Mi Perfil'}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                            {isEditing ? (
                                <>
                                    <TouchableOpacity onPress={handleSave} disabled={saving}>
                                        {saving ? <ActivityIndicator color="#FFF" /> : <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />}
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setIsEditing(false)} disabled={saving}>
                                        <Ionicons name="close-circle" size={28} color="#F44336" />
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <TouchableOpacity onPress={() => setIsEditing(true)}>
                                    <Ionicons name="create-outline" size={24} color="#FFF" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>

                {/* Avatar & Name */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Ionicons name="person" size={50} color="#FFF" />
                        </View>
                    </View>

                    {isEditing ? (
                        <>
                            <TextInput
                                style={styles.input}
                                value={form.firstName}
                                onChangeText={t => setForm({ ...form, firstName: t })}
                                placeholder="Nombre"
                            />
                            <TextInput
                                style={styles.input}
                                value={form.lastName}
                                onChangeText={t => setForm({ ...form, lastName: t })}
                                placeholder="Apellido"
                            />
                            <TextInput
                                style={[styles.input, { fontSize: 12 }]}
                                value={form.position}
                                onChangeText={t => setForm({ ...form, position: t })}
                                placeholder="Cargo / Puesto"
                            />
                        </>
                    ) : (
                        <>
                            <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
                            <Text style={styles.userRole}>{user?.position || 'Puesto no definido'}</Text>
                        </>
                    )}

                    {/* Stats Card */}
                    <View style={styles.statsCard}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.total}</Text>
                            <Text style={styles.statLabel}>TOTALES</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: '#1565C0' }]}>{stats.thisMonth}</Text>
                            <Text style={styles.statLabel}>ESTE MES</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: '#4CAF50' }]}>{stats.approvedPercentage}%</Text>
                            <Text style={styles.statLabel}>APROBADAS</Text>
                        </View>
                    </View>
                </View>

                {/* Datos Laborales */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeader}>DATOS LABORALES</Text>
                    <View style={styles.laboralCard}>
                        <View style={styles.laboralItem}>
                            <View style={styles.laboralIcon}>
                                <Text style={{ fontWeight: 'bold', color: '#333' }}>DP</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.laboralLabel}>Departamento</Text>
                                {isEditing ? (
                                    <TextInput
                                        style={styles.inputLeft}
                                        value={form.department}
                                        onChangeText={t => setForm({ ...form, department: t })}
                                        placeholder="Ingrese departamento"
                                    />
                                ) : (
                                    <Text style={styles.laboralValue}>{user?.department || 'No asignado'}</Text>
                                )}
                            </View>
                        </View>
                    </View>
                </View>

                {/* Contactos */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeader}>CONTACTOS</Text>
                    <View style={styles.contactCard}>
                        <View style={styles.contactItem}>
                            <View style={styles.contactIconCircle}>
                                <Ionicons name="mail-outline" size={20} color="#666" />
                            </View>
                            <Text style={styles.contactValue}>{user?.email}</Text>
                        </View>
                        <View style={styles.contactDivider} />
                        <View style={styles.contactItem}>
                            <View style={styles.contactIconCircle}>
                                <Ionicons name="call-outline" size={20} color="#666" />
                            </View>
                            {isEditing ? (
                                <TextInput
                                    style={[styles.inputLeft, { marginTop: 0, marginBottom: 0 }]}
                                    value={form.phone}
                                    onChangeText={t => setForm({ ...form, phone: t })}
                                    placeholder="Teléfono"
                                    keyboardType="phone-pad"
                                />
                            ) : (
                                <Text style={styles.contactValue}>{user?.phone || '099 425 9550'}</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Configuration / Logout */}
                <View style={[styles.sectionContainer, { marginTop: 10 }]}>
                    <View style={styles.contactCard}>
                        <View style={styles.contactItem}>
                            <View style={[styles.contactIconCircle, { backgroundColor: '#E3F2FD' }]}>
                                <Ionicons name="globe-outline" size={20} color="#1565C0" />
                            </View>
                            <Text style={[styles.contactValue, { fontWeight: '600' }]}>Idioma / Language</Text>
                            <Text style={{ marginLeft: 'auto', color: '#1565C0', fontWeight: 'bold' }}>ESP</Text>
                        </View>
                        <View style={styles.contactDivider} />
                        <TouchableOpacity style={styles.contactItem} onPress={handleLogout}>
                            <View style={[styles.contactIconCircle, { backgroundColor: '#FFEBEE' }]}>
                                <Ionicons name="log-out-outline" size={20} color="#F44336" />
                            </View>
                            <Text style={[styles.contactValue, { color: '#F44336', textDecorationLine: 'underline' }]}>Cerrar Sesión</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>
        </ResponsiveNavShell>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    headerContainer: {
        backgroundColor: '#003E85',
        height: 180,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    profileSection: {
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: -60,
    },
    avatarContainer: {
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#BDBDBD',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFFFFF',
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#212121',
        marginBottom: 4,
    },
    userRole: {
        fontSize: 14,
        color: '#757575',
        marginBottom: 20,
    },
    statsCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 24,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#212121',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 10,
        color: '#9E9E9E',
        fontWeight: '600',
    },
    sectionContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    sectionHeader: {
        fontSize: 12,
        color: '#757575',
        marginBottom: 10,
        fontWeight: '600',
    },
    laboralCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    laboralItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    laboralIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    laboralLabel: {
        fontSize: 10,
        color: '#9E9E9E',
    },
    laboralValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#212121',
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: '#EEEEEE',
        marginHorizontal: 10,
    },
    contactCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 12,
    },
    contactIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FAFAFA',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    contactValue: {
        fontSize: 14,
        color: '#212121',
        fontWeight: '500',
    },
    contactDivider: {
        height: 1,
        backgroundColor: '#F5F5F5',
    },
    input: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        color: '#333',
        marginBottom: 8,
        width: '80%',
        textAlign: 'center'
    },
    inputLeft: {
        backgroundColor: '#F9F9F9',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 8,
        fontSize: 14,
        color: '#333',
        marginTop: 4,
        width: '100%'
    }
});
