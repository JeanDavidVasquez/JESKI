import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform, Animated, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../styles/responsive';
import { NotificationBell } from './';
import { useLanguage } from '../hooks/useLanguage';

/**
 * Generic navigation item for sidebar/bottom nav
 */
interface NavItem {
    key: string;
    label: string;
    iconName: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
}

interface ResponsiveNavShellProps {
    children: React.ReactNode;
    currentScreen: string;
    navItems: NavItem[];
    title?: string;
    subtitle?: string;
    logo?: any;
    onNavigateToNotifications?: () => void;
    userId?: string; // Optional userId for robust notification count
}

/**
 * Responsive Navigation Shell
 * - Web (>768px): Collapsible Sidebar + Content
 * - Mobile: Content + Bottom navigation
 */
export const ResponsiveNavShell: React.FC<ResponsiveNavShellProps> = ({
    children,
    currentScreen,
    navItems,
    title = 'INDURAMA',
    subtitle,
    logo,
    onNavigateToNotifications,
    userId,
}) => {
    const { t } = useLanguage();
    const { isDesktopView, width } = useResponsive();
    const [collapsed, setCollapsed] = useState(false);
    const insets = useSafeAreaInsets();

    // Determine if we should show sidebar (web/tablet) or bottom nav (mobile)
    // Force sidebar if width >= 768px regardless of platform for better responsive web experience
    const showSidebar = width >= 768;

    const toggleSidebar = () => {
        // Simple state toggle, LayoutAnimation can be added for smoothness on native
        setCollapsed(!collapsed);
    };

    if (showSidebar) {
        // WEB/DESKTOP LAYOUT
        return (
            <View style={styles.webContainer}>
                {/* Sidebar Navigation */}
                <View style={[
                    styles.sidebar,
                    collapsed ? styles.sidebarCollapsed : styles.sidebarExpanded
                ]}>
                    {/* Header with Toggle */}
                    <View style={[styles.sidebarHeader, collapsed && styles.sidebarHeaderCollapsed]}>
                        {!collapsed && (
                            <View style={styles.brandContainer}>
                                {logo ? (
                                    <Image source={logo} style={styles.sidebarLogo} resizeMode="contain" />
                                ) : (
                                    <Text style={styles.sidebarTitle}>{title}</Text>
                                )}
                            </View>
                        )}

                        <TouchableOpacity
                            onPress={toggleSidebar}
                            style={styles.toggleButton}
                        >
                            <Ionicons
                                name={collapsed ? "menu" : "chevron-back"}
                                size={24}
                                color="#555"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Navigation Items */}
                    <View style={styles.sidebarNav}>
                        {navItems.slice(0, -1).map((item) => {
                            const isActive = currentScreen === item.key;
                            return (
                                <TouchableOpacity
                                    key={item.key}
                                    style={[
                                        styles.sidebarItem,
                                        isActive && styles.sidebarItemActive,
                                        collapsed && styles.sidebarItemCollapsed
                                    ]}
                                    onPress={item.onPress}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
                                        <Ionicons
                                            name={item.iconName}
                                            size={22}
                                            color={isActive ? '#FFFFFF' : '#6B7280'}
                                        />
                                    </View>

                                    {!collapsed && (
                                        <Text style={[styles.sidebarLabel, isActive && styles.sidebarLabelActive]}>
                                            {item.label}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            );
                        })}

                        {/* Notification Bell - Before last item (Profile) */}
                        {(() => {
                            const isNotificationsActive = currentScreen === 'Notifications';
                            return (
                                <TouchableOpacity
                                    style={[
                                        styles.sidebarItem,
                                        isNotificationsActive && styles.sidebarItemActive,
                                        collapsed && styles.sidebarItemCollapsed
                                    ]}
                                    onPress={() => {
                                        console.log('Notification clicked in sidebar', onNavigateToNotifications);
                                        if (onNavigateToNotifications) {
                                            onNavigateToNotifications();
                                        }
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.iconContainer, isNotificationsActive && styles.iconContainerActive]}>
                                        <NotificationBell
                                            onPress={() => {
                                                console.log('NotificationBell clicked in sidebar');
                                                if (onNavigateToNotifications) {
                                                    onNavigateToNotifications();
                                                }
                                            }}
                                            color={isNotificationsActive ? '#FFFFFF' : '#6B7280'}
                                            size={22}
                                            userId={userId} // Pass userId here
                                        />
                                    </View>
                                    {!collapsed && (
                                        <Text style={[styles.sidebarLabel, isNotificationsActive && styles.sidebarLabelActive]}>{t('appNotifications.title')}</Text>
                                    )}
                                </TouchableOpacity>
                            );
                        })()}

                        {/* Last item (Profile) */}
                        {navItems.slice(-1).map((item) => {
                            const isActive = currentScreen === item.key;
                            return (
                                <TouchableOpacity
                                    key={item.key}
                                    style={[
                                        styles.sidebarItem,
                                        isActive && styles.sidebarItemActive,
                                        collapsed && styles.sidebarItemCollapsed
                                    ]}
                                    onPress={item.onPress}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
                                        <Ionicons
                                            name={item.iconName}
                                            size={22}
                                            color={isActive ? '#FFFFFF' : '#6B7280'}
                                        />
                                    </View>

                                    {!collapsed && (
                                        <Text style={[styles.sidebarLabel, isActive && styles.sidebarLabelActive]}>
                                            {item.label}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Footer */}
                    <View style={styles.sidebarFooter}>
                        {!collapsed ? (
                            <Text style={styles.footerText}>© 2026 Indurama</Text>
                        ) : (
                            <Text style={styles.footerText}>©</Text>
                        )}
                    </View>
                </View>

                {/* Main Content Area */}
                <View style={styles.mainContent}>
                    {children}
                </View>
            </View>
        );
    }

    // MOBILE LAYOUT
    return (
        <View style={styles.mobileContainer}>
            {/* Main Content */}
            <View style={styles.mobileContent}>
                {children}
            </View>

            {/* Bottom Navigation */}
            <View style={[styles.bottomNavigation, { paddingBottom: insets.bottom }]}>
                {/* First half of nav items */}
                {navItems.slice(0, Math.ceil(navItems.length / 2)).map((item) => {
                    const isActive = currentScreen === item.key;
                    return (
                        <TouchableOpacity
                            key={item.key}
                            style={styles.bottomNavItem}
                            onPress={item.onPress}
                        >
                            <Ionicons
                                name={item.iconName}
                                size={24}
                                color={isActive ? PRIMARY_COLOR : '#9CA3AF'}
                            />
                            <Text style={[styles.bottomNavLabel, isActive && styles.bottomNavLabelActive]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}

                {/* Notification Bell in Center */}
                {(() => {
                    const isNotificationsActive = currentScreen === 'Notifications';
                    return (
                        <TouchableOpacity
                            style={styles.bottomNavItem}
                            onPress={() => {
                                console.log('Notification clicked in bottom nav', onNavigateToNotifications);
                                if (onNavigateToNotifications) {
                                    onNavigateToNotifications();
                                }
                            }}
                        >
                            <NotificationBell
                                onPress={() => {
                                    console.log('NotificationBell clicked in bottom nav');
                                    if (onNavigateToNotifications) {
                                        onNavigateToNotifications();
                                    }
                                }}
                                color={isNotificationsActive ? PRIMARY_COLOR : '#9CA3AF'}
                                size={24}
                                userId={userId} // Pass userId here as well
                            />
                            <Text style={[styles.bottomNavLabel, isNotificationsActive && styles.bottomNavLabelActive]}>{t('appNotifications.title')}</Text>
                        </TouchableOpacity>
                    );
                })()}

                {/* Second half of nav items */}
                {navItems.slice(Math.ceil(navItems.length / 2)).map((item) => {
                    const isActive = currentScreen === item.key;
                    return (
                        <TouchableOpacity
                            key={item.key}
                            style={styles.bottomNavItem}
                            onPress={item.onPress}
                        >
                            <Ionicons
                                name={item.iconName}
                                size={24}
                                color={isActive ? PRIMARY_COLOR : '#9CA3AF'}
                            />
                            <Text style={[styles.bottomNavLabel, isActive && styles.bottomNavLabelActive]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const SIDEBAR_WIDTH_EXPANDED = 260;
const SIDEBAR_WIDTH_COLLAPSED = 80;
const PRIMARY_COLOR = '#1565C0';

const styles = StyleSheet.create({
    // =============== WEB/DESKTOP STYLES ===============
    webContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#F5F7FA',
        overflow: 'hidden', // Prevent scrollbars from sidebar animation
    },
    sidebar: {
        backgroundColor: '#FFFFFF',
        borderRightWidth: 1,
        borderRightColor: '#E5E7EB',
        paddingTop: 24,
        flexDirection: 'column',
        ...Platform.select({
            web: {
                boxShadow: '2px 0 8px rgba(0,0,0,0.03)',
            },
            default: {
                elevation: 2
            }
        }),
        zIndex: 10,
    },
    sidebarExpanded: {
        width: SIDEBAR_WIDTH_EXPANDED,
    },
    sidebarCollapsed: {
        width: SIDEBAR_WIDTH_COLLAPSED,
        alignItems: 'center',
    },
    sidebarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 32,
        height: 40,
    },
    sidebarHeaderCollapsed: {
        justifyContent: 'center',
        paddingHorizontal: 0,
    },
    brandContainer: {
        flex: 1,
    },
    sidebarLogo: {
        width: 120,
        height: 32,
    },
    sidebarTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: PRIMARY_COLOR,
    },
    toggleButton: {
        padding: 4,
        borderRadius: 4,
        backgroundColor: '#F3F4F6',
    },

    // Navigation Items
    sidebarNav: {
        flex: 1,
        paddingHorizontal: 12,
    },
    sidebarItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 8,
        borderRadius: 12,
        // height: 48,
    },
    sidebarItemCollapsed: {
        justifyContent: 'center',
        paddingHorizontal: 0,
        width: 48,
        alignSelf: 'center',
    },
    sidebarItemActive: {
        // backgroundColor: '#E3F2FD', 
        // Changed to apply style to icon container mostly
    },

    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    iconContainerActive: {
        backgroundColor: PRIMARY_COLOR,
        shadowColor: PRIMARY_COLOR,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },

    sidebarIconIon: {
        // Handled in icon container
    },
    sidebarLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: '#4B5563',
    },
    sidebarLabelActive: {
        color: '#111827',
        fontWeight: '700',
    },

    sidebarFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#9CA3AF',
    },

    mainContent: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },

    // =============== MOBILE STYLES ===============
    mobileContainer: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    mobileContent: {
        flex: 1,
    },
    bottomNavigation: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        minHeight: 60, // Minimum height, will expand with safe area
        paddingTop: 8, // Add some top padding for content
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 8,
            }
        }),
    },
    bottomNavItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomNavLabel: {
        fontSize: 10,
        marginTop: 2,
        color: '#9CA3AF',
    },
    bottomNavLabelActive: {
        color: PRIMARY_COLOR,
        fontWeight: '600',
    },
});
