import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { useResponsive } from '../styles/responsive';

interface ProcessHeaderProps {
    title: string;
    onBack: () => void;
    showLogo?: boolean;
    rightElement?: React.ReactNode;
}

export const ProcessHeader: React.FC<ProcessHeaderProps> = ({
    title,
    onBack,
    showLogo = true,
    rightElement
}) => {
    const { isDesktopView } = useResponsive();

    return (
        <View style={styles.headerContainer}>
            <View style={[styles.headerContent, isDesktopView && styles.headerDesktop]}>
                <TouchableOpacity onPress={onBack} style={styles.headerBackButton}>
                    <Image
                        source={require('../../assets/icons/arrow-left.png')}
                        style={styles.backIcon}
                        resizeMode="contain"
                    />
                </TouchableOpacity>

                <Text style={styles.headerTitle} numberOfLines={1}>
                    {title}
                </Text>

                {rightElement ? (
                    rightElement
                ) : showLogo ? (
                    <Image
                        source={require('../../assets/icono_indurama.png')}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                ) : (
                    <View style={styles.logoImage} /> // Spacer
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        backgroundColor: '#FFFFFF',
        paddingTop: Platform.OS === 'ios' ? 20 : 20,
        height: 80,
        width: '100%',
        zIndex: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        justifyContent: 'center', // Center content vertically
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        width: '100%',
        alignSelf: 'center',
    },
    headerDesktop: {
        maxWidth: 1200,
    },
    headerBackButton: {
        padding: 8,
        borderRadius: 8,
    },
    backIcon: {
        width: 22,
        height: 22,
        tintColor: '#4B5563'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        flex: 1,
        textAlign: 'center'
    },
    logoImage: {
        width: 90,
        height: 30
    },
});
