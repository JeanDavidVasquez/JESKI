/**
 * SupplierProfileScreen - Pantalla de perfil para proveedores
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Platform,
    Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../styles/theme';

interface SupplierProfileScreenProps {
    onNavigateBack: () => void;
    onNavigateToEPIStatus: () => void;
    onLogout: () => void;
}

export const SupplierProfileScreen: React.FC<SupplierProfileScreenProps> = ({
    onNavigateBack,
    onNavigateToEPIStatus,
    onLogout,
}) => {
    const { user } = useAuth();

    const handleLogout = () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro que deseas cerrar sesión?',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Cerrar Sesión', onPress: onLogout, style: 'destructive' },
            ]
        );
    };

    const displayName = user?.companyName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Proveedor';
    const epiScore = user?.epiScore || 0;

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'epi_approved':
            case 'active':
                return '#4CAF50';
            case 'pending':
                return '#FFA726';
            default:
                return '#999';
        }
    };

    const getStatusLabel = (status?: string) => {
        switch (status) {
            case 'epi_approved':
                return 'EPI Aprobado';
            case 'active':
                return 'Activo';
            case 'pending':
                return 'Pendiente';
            default:
                return 'Sin evaluar';
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mi Perfil</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Ionicons name="business" size={40} color="#FFF" />
                        </View>
                    </View>
                    <Text style={styles.companyName}>{displayName}</Text>
                    <Text style={styles.email}>{user?.email}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(user?.supplierStatus) }]}>
                        <Text style={styles.statusText}>{getStatusLabel(user?.supplierStatus)}</Text>
                    </View>
                </View>

                {/* EPI Score Card */}
                <TouchableOpacity style={styles.epiCard} onPress={onNavigateToEPIStatus}>
                    <View style={styles.epiCardContent}>
                        <View>
                            <Text style={styles.epiLabel}>Score EPI</Text>
                            <Text style={styles.epiDescription}>Ver detalle de evaluación</Text>
                        </View>
                        <View style={styles.scoreCircle}>
                            <Text style={styles.scoreValue}>{Math.round(epiScore)}</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#666" />
                </TouchableOpacity>

                {/* Menu Options */}
                <View style={styles.menuSection}>
                    <Text style={styles.menuTitle}>Cuenta</Text>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuIcon}>
                            <Ionicons name="business-outline" size={22} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.menuItemText}>Datos de la Empresa</Text>
                        <Ionicons name="chevron-forward" size={20} color="#CCC" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuIcon}>
                            <Ionicons name="document-text-outline" size={22} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.menuItemText}>Documentos</Text>
                        <Ionicons name="chevron-forward" size={20} color="#CCC" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuIcon}>
                            <Ionicons name="notifications-outline" size={22} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.menuItemText}>Notificaciones</Text>
                        <Ionicons name="chevron-forward" size={20} color="#CCC" />
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={22} color="#F44336" />
                    <Text style={styles.logoutText}>Cerrar Sesión</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        backgroundColor: theme.colors.primary,
        paddingTop: Platform.OS === 'ios' ? 50 : 40,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    profileCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarContainer: {
        marginBottom: 16,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    companyName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    email: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    statusBadge: {
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '600',
    },
    epiCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    epiCardContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    epiLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    epiDescription: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    scoreCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    scoreValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    menuSection: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginBottom: 20,
    },
    menuTitle: {
        fontSize: 12,
        color: '#999',
        fontWeight: '600',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        textTransform: 'uppercase',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    menuIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuItemText: {
        flex: 1,
        fontSize: 15,
        color: '#333',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
        borderRadius: 12,
        paddingVertical: 16,
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        color: '#F44336',
        fontWeight: '600',
    },
});

export default SupplierProfileScreen;
