import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';

interface ManagerBottomNavProps {
    currentScreen: 'Dashboard' | 'Requests' | 'Suppliers' | 'Profile';
    onNavigateToDashboard: () => void;
    onNavigateToRequests: () => void;
    onNavigateToSuppliers: () => void;
    onNavigateToProfile: () => void;
}

export const ManagerBottomNav: React.FC<ManagerBottomNavProps> = ({
    currentScreen,
    onNavigateToDashboard,
    onNavigateToRequests,
    onNavigateToSuppliers,
    onNavigateToProfile,
}) => {
    return (
        <View style={styles.bottomNavigation}>
            <TouchableOpacity
                style={styles.navItem}
                onPress={onNavigateToDashboard}
            >
                <Image
                    source={require('../../assets/icons/home.png')}
                    style={[
                        styles.navIcon,
                        currentScreen === 'Dashboard' && styles.activeNavIcon
                    ]}
                />
                <Text style={[
                    styles.navText,
                    currentScreen === 'Dashboard' && styles.activeNavText
                ]}>Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.navItem}
                onPress={onNavigateToRequests}
            >
                <Image
                    source={require('../../assets/icons/document.png')}
                    style={[
                        styles.navIcon,
                        currentScreen === 'Requests' && styles.activeNavIcon
                    ]}
                />
                <Text style={[
                    styles.navText,
                    currentScreen === 'Requests' && styles.activeNavText
                ]}>Solicitudes</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.navItem}
                onPress={onNavigateToSuppliers}
            >
                <Image
                    source={require('../../assets/icons/users.png')}
                    style={[
                        styles.navIcon,
                        currentScreen === 'Suppliers' && styles.activeNavIcon
                    ]}
                />
                <Text style={[
                    styles.navText,
                    currentScreen === 'Suppliers' && styles.activeNavText
                ]}>Proveedores</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.navItem}
                onPress={onNavigateToProfile}
            >
                <Image
                    source={require('../../assets/icons/profile.png')}
                    style={[
                        styles.navIcon,
                        currentScreen === 'Profile' && styles.activeNavIcon
                    ]}
                />
                <Text style={[
                    styles.navText,
                    currentScreen === 'Profile' && styles.activeNavText
                ]}>Perfil</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    bottomNavigation: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
        paddingVertical: 10,
        // Eliminamos paddingHorizontal para usar todo el ancho
        // justifyContent: 'space-between', // Eliminamos esto ya que usaremos flex: 1
        paddingBottom: Platform.OS === 'ios' ? 25 : 10,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    navItem: {
        flex: 1, // Esto es clave para que ocupen espacios iguales
        alignItems: 'center',
        justifyContent: 'center',
    },
    navIcon: {
        width: 24,
        height: 24,
        marginBottom: 4,
        tintColor: '#999999',
    },
    activeNavIcon: {
        tintColor: '#003E85',
    },
    navText: {
        fontSize: 10,
        color: '#999999',
        fontWeight: '500',
    },
    activeNavText: {
        color: '#003E85',
        fontWeight: '700',
    },
});
