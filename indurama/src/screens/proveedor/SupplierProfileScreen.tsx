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
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../hooks/useAuth';
import { theme } from '../../styles/theme';
import { SupplierResponseService } from '../../services/supplierResponseService';
import { LanguageSelector } from '../../components/LanguageSelector';
import { useLanguage } from '../../hooks/useLanguage';
import { db } from '../../services/firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import { ResponsiveNavShell } from '../../components/ResponsiveNavShell';
import { useWindowDimensions } from 'react-native';
import {
    proveedorTypography,
    proveedorProfileStyles,
    proveedorScoreStyles,
    proveedorContentStyles,
    proveedorGradientHeaderStyles,
    HEADER_GRADIENT_COLORS
} from './proveedorStyles';

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
                return theme.colors.success;
            case 'pending':
                return theme.colors.warning;
            default:
                return theme.colors.text.muted;
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

                {/* Header - Consistent Gradient like Dashboard */}
                <LinearGradient
                    colors={['#001F3F', '#003E85', '#0056B3']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.header, !isMobile && styles.headerWeb]}
                >
                    <Text style={styles.headerTitle}>{t('proveedor.profile.title')}</Text>
                </LinearGradient>

                <ScrollView style={proveedorContentStyles.container} contentContainerStyle={proveedorContentStyles.listContent} showsVerticalScrollIndicator={false}>
                    {/* Profile Card */}
                    <View style={proveedorProfileStyles.profileCard}>
                        <View style={proveedorProfileStyles.avatar}>
                            <Ionicons name="business" size={40} color="#FFF" />
                        </View>
                        <Text style={proveedorProfileStyles.profileName}>{displayName}</Text>
                        <Text style={proveedorProfileStyles.profileEmail}>{user?.email}</Text>
                        <View style={[proveedorProfileStyles.statusBadge, { backgroundColor: getStatusColor(realStatus) }]}>
                            <Text style={proveedorProfileStyles.statusText}>{getStatusLabel(realStatus)}</Text>
                        </View>
                    </View>

                    {/* EPI Score Card */}
                    <TouchableOpacity style={proveedorScoreStyles.container} onPress={onNavigateToEPIStatus}>
                        <View>
                            <Text style={proveedorScoreStyles.label}>{t('proveedor.dashboard.myEpiScore')}</Text>
                            <Text style={proveedorScoreStyles.sublabel}>{t('common.viewMore')}</Text>
                        </View>
                        <View style={proveedorScoreStyles.scoreCircle}>
                            <Text style={proveedorScoreStyles.scoreValue}>{Math.round(displayScore)}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Menu Options */}
                    <View style={proveedorProfileStyles.menuSection}>
                        <Text style={proveedorProfileStyles.menuTitle}>{t('proveedor.profile.companyInfo')}</Text>

                        <TouchableOpacity style={proveedorProfileStyles.menuItem}>
                            <View style={proveedorProfileStyles.menuIcon}>
                                <Ionicons name="business-outline" size={22} color={theme.colors.primary} />
                            </View>
                            <Text style={proveedorProfileStyles.menuLabel}>{t('proveedor.profile.companyInfo')}</Text>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.muted} />
                        </TouchableOpacity>

                        <TouchableOpacity style={proveedorProfileStyles.menuItem}>
                            <View style={proveedorProfileStyles.menuIcon}>
                                <Ionicons name="document-text-outline" size={22} color={theme.colors.primary} />
                            </View>
                            <Text style={proveedorProfileStyles.menuLabel}>{t('requests.attachments')}</Text>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.muted} />
                        </TouchableOpacity>

                        <TouchableOpacity style={proveedorProfileStyles.menuItem}>
                            <View style={proveedorProfileStyles.menuIcon}>
                                <Ionicons name="notifications-outline" size={22} color={theme.colors.primary} />
                            </View>
                            <Text style={proveedorProfileStyles.menuLabel}>{t('navigation.notifications')}</Text>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.text.muted} />
                        </TouchableOpacity>
                    </View>

                    {/* Language Selector */}
                    <View style={[proveedorProfileStyles.menuSection, { marginTop: 16, paddingVertical: 16 }]}>
                        <Text style={[proveedorProfileStyles.menuTitle, { marginBottom: 12 }]}>{t('profile.language')}</Text>
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
        backgroundColor: theme.colors.background.secondary,
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 50 : 40,
        paddingBottom: 20,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
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
        color: theme.colors.white,
        fontSize: 18,
        fontWeight: '700' as const,
    },
    content: {
        flex: 1,
        padding: theme.spacing[5],
    },
    profileCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing[6],
        alignItems: 'center',
        marginBottom: theme.spacing[5],
        ...theme.shadows.base,
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
        fontWeight: '700' as const,
        color: theme.colors.text.primary,
        textAlign: 'center',
    },
    email: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing[1],
    },

    statusBadge: {
        marginTop: theme.spacing[3],
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[1] + 2,
        borderRadius: 20,
    },
    statusText: {
        color: theme.colors.white,
        fontSize: 13,
        fontWeight: '600' as const,
    },
    epiCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing[4],
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing[5],
    },
    epiCardContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    epiLabel: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: theme.colors.text.primary,
    },
    epiDescription: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    scoreCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing[3],
    },
    scoreValue: {
        fontSize: 22,
        fontWeight: '700' as const,
        color: theme.colors.success,
    },
    menuSection: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing[5],
    },
    menuTitle: {
        fontSize: 12,
        color: theme.colors.text.muted,
        fontWeight: '600' as const,
        paddingHorizontal: theme.spacing[4],
        paddingTop: theme.spacing[4],
        paddingBottom: theme.spacing[2],
        textTransform: 'uppercase',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: theme.spacing[4],
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
    },
    menuIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.background.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing[3],
    },
    menuItemText: {
        flex: 1,
        fontSize: 15,
        color: theme.colors.text.primary,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        paddingVertical: theme.spacing[4],
        gap: theme.spacing[2],
    },
    logoutText: {
        fontSize: 16,
        color: theme.colors.error,
        fontWeight: '600' as const,
    },
});

export default SupplierProfileScreen;
