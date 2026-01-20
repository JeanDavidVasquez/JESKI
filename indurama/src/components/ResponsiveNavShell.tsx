import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform, Animated, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../styles/responsive';

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
}) => {
    const { isDesktopView, width } = useResponsive();
    const [collapsed, setCollapsed] = useState(false);

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
                        {navItems.map((item) => {
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

                                    {/* Tooltip-like effect or indicator could go here for collapsed state */}
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
            <View style={styles.bottomNavigation}>
                {navItems.map((item) => {
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
        transition: 'width 0.3s ease', // Smooth transition for web
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
        height: 60, // Standard height
        paddingBottom: Platform.OS === 'ios' ? 20 : 0, // Safe area for iOS
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    bottomNavItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
    },
    bottomNavLabel: {
        fontSize: 10,
        marginTop: 4,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    bottomNavLabelActive: {
        color: PRIMARY_COLOR,
        fontWeight: '700',
    },
});
