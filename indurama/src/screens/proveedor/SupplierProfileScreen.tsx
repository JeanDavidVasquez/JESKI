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
import { useAuth } from '../../hooks/useAuth';
import { theme } from '../../styles/theme';
import { SupplierResponseService } from '../../services/supplierResponseService';
import { LanguageSelector } from '../../components/LanguageSelector';
import { useLanguage } from '../../hooks/useLanguage';
import { db } from '../../services/firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import { ResponsiveNavShell } from '../../components/ResponsiveNavShell';
import { useWindowDimensions } from 'react-native';

interface SupplierProfileScreenProps {
    onNavigateBack: () => void;
    onNavigateToEPIStatus: () => void;
    onNavigateToDashboard?: () => void;
    onNavigateToQuotations?: () => void;
    onLogout: () => void;
    onNavigateToNotifications?: () => void;
}

export const SupplierProfileScreen: React.FC<SupplierProfileScreenProps> = ({
    onNavigateBack,
    onNavigateToEPIStatus,
    onNavigateToDashboard,
    onNavigateToQuotations,
    onLogout,
    onNavigateToNotifications,
}) => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const [realEpiScore, setRealEpiScore] = useState(0);
    const [realStatus, setRealStatus] = useState(user?.supplierStatus);

    useEffect(() => {
        if (!user?.id) return;

        // 1. Listen to User Profile changes (Status & Score from User Doc)
        const userRef = doc(db, 'users', user.id);
        const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                // If user doc has a score, use it.
                if (data.epiScore && data.epiScore > 0) {
                    setRealEpiScore(data.epiScore);
                }
                setRealStatus(data.supplierStatus);
            }
        });

        // 2. Fetch from EPI Submissions (Source of Truth for Dashboard)
        const fetchSubmissionScore = async () => {
            try {
                // Using the same service as Dashboard
                const submission = await SupplierResponseService.getEPISubmission(user.id);
                if (submission) {
                    const score = submission.calculatedScore || submission.globalScore || 0;
                    // Only override if we have a valid score and current state is 0
                    setRealEpiScore(prev => prev > 0 ? prev : score);
                }
            } catch (e) {
                console.error('Error loading EPI submission score', e);
            }
        };
        fetchSubmissionScore();

        return () => unsubscribeUser();
    }, [user?.id]);

    const handleLogout = () => {
        Alert.alert(
            t('auth.logout'),
            t('common.confirm') + '?',
            [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('auth.logout'), onPress: onLogout, style: 'destructive' },
            ]
        );
    };

    const displayName = user?.companyName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || t('proveedor.dashboard.supplier');

    // Use fetched score instead of user prop
    const displayScore = realEpiScore || user?.epiScore || 0;

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
                return t('proveedor.epi.approved');
            case 'active':
                return t('proveedor.status.active');
            case 'pending':
                return t('proveedor.status.pending');
            default:
                return t('proveedor.epi.pendingApproval');
        }
    };

    // Navigation Items for Shell
    const navItems = [
        {
            key: 'Dashboard',
            label: t('navigation.home'),
            iconName: 'home' as any,
            onPress: onNavigateToDashboard || onNavigateBack,
        },
        {
            key: 'Quotations',
            label: t('navigation.quotations'),
            iconName: 'pricetags-outline' as any,
            onPress: onNavigateToQuotations || (() => { }),
        },
        {
            key: 'Profile',
            label: t('navigation.profile'),
            iconName: 'person-outline' as any,
            onPress: () => { }, // Current screen
        },
        {
            key: 'Logout',
            label: t('auth.logout'),
            iconName: 'log-out-outline' as any,
            onPress: handleLogout,
        },
    ];

    return (
        <ResponsiveNavShell
            currentScreen="Profile"
            navItems={navItems}
            title="INDURAMA"
            logo={require('../../../assets/icono_indurama.png')}
            onNavigateToNotifications={onNavigateToNotifications}
        >
            <View style={styles.container}>
                <StatusBar style="light" />

                {/* Header - Simplified */}
                <View style={[styles.header, !isMobile && styles.headerWeb]}>
                    <Text style={styles.headerTitle}>{t('proveedor.profile.title')}</Text>
                    {isMobile && (
                        <View style={{ width: 40 }} />
                    )}
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
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(realStatus) }]}>
                            <Text style={styles.statusText}>{getStatusLabel(realStatus)}</Text>
                        </View>
                    </View>

                    {/* EPI Score Card */}
                    <TouchableOpacity style={styles.epiCard} onPress={onNavigateToEPIStatus}>
                        <View style={styles.epiCardContent}>
                            <View>
                                <Text style={styles.epiLabel}>{t('proveedor.dashboard.myEpiScore')}</Text>
                                <Text style={styles.epiDescription}>{t('common.viewMore')}</Text>
                            </View>
                            <View style={styles.scoreCircle}>
                                <Text style={styles.scoreValue}>{Math.round(displayScore)}</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#666" />
                    </TouchableOpacity>

                    {/* Menu Options */}
                    <View style={styles.menuSection}>
                        <Text style={styles.menuTitle}>{t('proveedor.profile.companyInfo')}</Text>

                        <TouchableOpacity style={styles.menuItem}>
                            <View style={styles.menuIcon}>
                                <Ionicons name="business-outline" size={22} color={theme.colors.primary} />
                            </View>
                            <Text style={styles.menuItemText}>{t('proveedor.profile.companyInfo')}</Text>
                            <Ionicons name="chevron-forward" size={20} color="#CCC" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem}>
                            <View style={styles.menuIcon}>
                                <Ionicons name="document-text-outline" size={22} color={theme.colors.primary} />
                            </View>
                            <Text style={styles.menuItemText}>{t('requests.attachments')}</Text>
                            <Ionicons name="chevron-forward" size={20} color="#CCC" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem}>
                            <View style={styles.menuIcon}>
                                <Ionicons name="notifications-outline" size={22} color={theme.colors.primary} />
                            </View>
                            <Text style={styles.menuItemText}>{t('navigation.notifications')}</Text>
                            <Ionicons name="chevron-forward" size={20} color="#CCC" />
                        </TouchableOpacity>
                    </View>

                    {/* Language Selector */}
                    <View style={[styles.menuSection, { marginTop: 16, paddingVertical: 16 }]}>
                        <Text style={[styles.menuTitle, { marginBottom: 12 }]}>{t('profile.language')}</Text>
                        <LanguageSelector />
                    </View>

                    {/* Logout Button */}
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={22} color="#F44336" />
                        <Text style={styles.logoutText}>{t('auth.logout')}</Text>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>
        </ResponsiveNavShell>
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
        justifyContent: 'center', // Center title since back button is gone
    },
    headerWeb: {
        paddingTop: 20,
    },
    backButton: {
        padding: 8,
        position: 'absolute', // if needed
        left: 16,
        bottom: 16,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
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
