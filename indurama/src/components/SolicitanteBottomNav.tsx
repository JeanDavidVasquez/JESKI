import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';

interface SolicitanteBottomNavProps {
    currentScreen: 'Dashboard' | 'NewRequest' | 'History' | 'Profile';
    onNavigateToDashboard: () => void;
    onNavigateToNewRequest: () => void;
    onNavigateToHistory: () => void;
    onNavigateToProfile: () => void;
}

export const SolicitanteBottomNav: React.FC<SolicitanteBottomNavProps> = ({
    currentScreen,
    onNavigateToDashboard,
    onNavigateToNewRequest,
    onNavigateToHistory,
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
                onPress={onNavigateToNewRequest}
            >
                <Image
                    source={require('../../assets/icons/document.png')}
                    style={[
                        styles.navIcon,
                        currentScreen === 'NewRequest' && styles.activeNavIcon
                    ]}
                />
                <Text style={[
                    styles.navText,
                    currentScreen === 'NewRequest' && styles.activeNavText
                ]}>Nueva</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.navItem}
                onPress={onNavigateToHistory}
            >
                <Image
                    source={require('../../assets/icons/document.png')}
                    style={[
                        styles.navIcon,
                        currentScreen === 'History' && styles.activeNavIcon
                    ]}
                />
                <Text style={[
                    styles.navText,
                    currentScreen === 'History' && styles.activeNavText
                ]}>Historial</Text>
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
        borderTopColor: '#E0E0E0',
        paddingBottom: Platform.OS === 'ios' ? 20 : 10,
        paddingTop: 10,
        justifyContent: 'space-around',
        ...Platform.select({
            web: {
                boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.05)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 8,
            },
        }),
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    navIcon: {
        width: 24,
        height: 24,
        tintColor: '#757575',
        marginBottom: 4,
    },
    activeNavIcon: {
        tintColor: '#003E85',
    },
    navText: {
        fontSize: 12,
        color: '#757575',
    },
    activeNavText: {
        color: '#003E85',
        fontWeight: '600',
    },
});
