import React from 'react';
import { View, StyleSheet, ScrollView, ViewStyle, Platform } from 'react-native';
import { useResponsive, getContainerMaxWidth, BREAKPOINTS } from './responsive';

/**
 * Responsive Layout Components
 * Pre-built containers that adapt to screen size
 */

interface WebContainerProps {
    children: React.ReactNode;
    style?: ViewStyle;
    maxWidth?: number;
    centered?: boolean;
}

/**
 * Container that limits width on web and centers content
 * On mobile, takes full width
 */
export const WebContainer: React.FC<WebContainerProps> = ({
    children,
    style,
    maxWidth = 1200,
    centered = true
}) => {
    const { width, isDesktopView } = useResponsive();

    const containerStyle: ViewStyle = {
        flex: 1,
        width: '100%',
        maxWidth: isDesktopView ? maxWidth : undefined,
        alignSelf: centered ? 'center' : undefined,
        paddingHorizontal: isDesktopView ? 32 : 16,
    };

    return (
        <View style={[containerStyle, style]}>
            {children}
        </View>
    );
};

interface ResponsiveGridProps {
    children: React.ReactNode;
    columns?: { mobile?: number; tablet?: number; desktop?: number };
    gap?: number;
    style?: ViewStyle;
}

/**
 * Grid layout that changes columns based on screen size
 */
export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
    children,
    columns = { mobile: 1, tablet: 2, desktop: 3 },
    gap = 16,
    style,
}) => {
    const { deviceType } = useResponsive();

    const cols = deviceType === 'mobile' ? columns.mobile ?? 1
        : deviceType === 'tablet' ? columns.tablet ?? 2
            : columns.desktop ?? 3;

    return (
        <View style={[styles.grid, { gap }, style]}>
            {React.Children.map(children, (child, index) => (
                <View style={{
                    width: cols === 1 ? '100%' : `${(100 / cols) - (gap / cols)}%`,
                    minWidth: cols > 1 ? 250 : undefined,
                }}>
                    {child}
                </View>
            ))}
        </View>
    );
};

interface TwoColumnLayoutProps {
    left: React.ReactNode;
    right: React.ReactNode;
    leftWidth?: string | number;
    gap?: number;
    stackOnMobile?: boolean;
    style?: ViewStyle;
}

/**
 * Two column layout that stacks on mobile
 */
export const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({
    left,
    right,
    leftWidth = '30%',
    gap = 24,
    stackOnMobile = true,
    style,
}) => {
    const { isMobileView } = useResponsive();
    const shouldStack = stackOnMobile && isMobileView;

    return (
        <View style={[
            styles.twoColumn,
            shouldStack && styles.twoColumnStacked,
            { gap },
            style
        ]}>
            <View style={[
                styles.leftColumn,
                !shouldStack && { width: leftWidth as any },
                shouldStack && { width: '100%' }
            ]}>
                {left}
            </View>
            <View style={[
                styles.rightColumn,
                shouldStack && { width: '100%' }
            ]}>
                {right}
            </View>
        </View>
    );
};

interface ResponsiveScrollViewProps {
    children: React.ReactNode;
    style?: ViewStyle;
    contentContainerStyle?: ViewStyle;
    maxWidth?: number;
}

/**
 * ScrollView that centers content on wide screens
 */
export const ResponsiveScrollView: React.FC<ResponsiveScrollViewProps> = ({
    children,
    style,
    contentContainerStyle,
    maxWidth = 1200,
}) => {
    const { isDesktopView } = useResponsive();

    return (
        <ScrollView
            style={[styles.scrollView, style]}
            contentContainerStyle={[
                styles.scrollContent,
                isDesktopView && { maxWidth, alignSelf: 'center', width: '100%' },
                contentContainerStyle
            ]}
            showsVerticalScrollIndicator={false}
        >
            {children}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    twoColumn: {
        flexDirection: 'row',
    },
    twoColumnStacked: {
        flexDirection: 'column',
    },
    leftColumn: {
        flexShrink: 0,
    },
    rightColumn: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: Platform.OS === 'web' ? 24 : 16,
    },
});

export default {
    WebContainer,
    ResponsiveGrid,
    TwoColumnLayout,
    ResponsiveScrollView,
};
