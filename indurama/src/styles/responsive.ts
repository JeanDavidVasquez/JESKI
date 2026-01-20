import { Dimensions, Platform, useWindowDimensions } from 'react-native';

/**
 * Responsive Design Utilities for Indurama App
 * Provides hooks and helpers for adaptive layouts across web and mobile
 */

// Breakpoints (pixels)
export const BREAKPOINTS = {
    mobile: 480,
    tablet: 768,
    desktop: 1024,
    wide: 1280,
} as const;

// Device type detection
export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isMobile = !isWeb;

/**
 * Get current screen dimensions (static - for initial render)
 */
export const getScreenDimensions = () => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
};

/**
 * Determine device type based on width
 */
export const getDeviceType = (width: number): 'mobile' | 'tablet' | 'desktop' | 'wide' => {
    if (width < BREAKPOINTS.mobile) return 'mobile';
    if (width < BREAKPOINTS.tablet) return 'tablet';
    if (width < BREAKPOINTS.desktop) return 'desktop';
    return 'wide';
};

/**
 * Hook for responsive values - updates on window resize
 */
export const useResponsive = () => {
    const { width, height } = useWindowDimensions();

    const deviceType = getDeviceType(width);
    const isMobileView = width < BREAKPOINTS.tablet;
    const isTabletView = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
    const isDesktopView = width >= BREAKPOINTS.desktop;

    return {
        width,
        height,
        deviceType,
        isMobileView,
        isTabletView,
        isDesktopView,
        isWeb,
        isMobile: !isWeb,
    };
};

/**
 * Get responsive value based on device type
 * Usage: rValue({ mobile: 16, tablet: 20, desktop: 24 })
 */
export const rValue = <T>(values: {
    mobile?: T;
    tablet?: T;
    desktop?: T;
    default?: T;
}): T => {
    const { width } = getScreenDimensions();
    const deviceType = getDeviceType(width);

    if (deviceType === 'mobile' && values.mobile !== undefined) return values.mobile;
    if ((deviceType === 'tablet' || deviceType === 'mobile') && values.tablet !== undefined) return values.tablet;
    if (values.desktop !== undefined) return values.desktop;
    if (values.default !== undefined) return values.default;

    // Fallback chain
    return (values.mobile ?? values.tablet ?? values.desktop ?? values.default) as T;
};

/**
 * Scale a value proportionally based on screen width
 * Base width is 375 (iPhone standard)
 */
export const scale = (size: number, baseWidth = 375): number => {
    const { width } = getScreenDimensions();

    // On web with wide screens, cap scaling
    if (isWeb && width > BREAKPOINTS.desktop) {
        return size * 1.2; // Max 20% increase on desktop
    }

    return (width / baseWidth) * size;
};

/**
 * Get container max-width for centered layouts on web
 */
export const getContainerMaxWidth = (deviceType: 'mobile' | 'tablet' | 'desktop' | 'wide'): number | '100%' => {
    switch (deviceType) {
        case 'mobile': return '100%' as any;
        case 'tablet': return 720;
        case 'desktop': return 960;
        case 'wide': return 1200;
    }
};

/**
 * Responsive style patterns
 */
export const responsiveStyles = {
    // Container that centers content on wide screens
    webContainer: {
        flex: 1,
        width: '100%',
        maxWidth: isWeb ? 1200 : undefined,
        alignSelf: isWeb ? 'center' : undefined,
        paddingHorizontal: isWeb ? 24 : 16,
    } as const,

    // Card that adapts width
    cardWidth: {
        width: isWeb ? '48%' : '100%',
        minWidth: isWeb ? 300 : undefined,
    } as const,

    // Grid container
    gridContainer: {
        flexDirection: isWeb ? 'row' : 'column',
        flexWrap: isWeb ? 'wrap' : 'nowrap',
        gap: isWeb ? 16 : 12,
    } as const,

    // Table row that stacks on mobile
    tableRow: {
        flexDirection: isWeb ? 'row' : 'column',
        alignItems: isWeb ? 'center' : 'flex-start',
    } as const,
};

/**
 * Get number of columns for grid layouts
 */
export const getGridColumns = (): number => {
    const { width } = getScreenDimensions();
    if (width < BREAKPOINTS.mobile) return 1;
    if (width < BREAKPOINTS.tablet) return 2;
    if (width < BREAKPOINTS.desktop) return 3;
    return 4;
};

/**
 * Responsive font sizes
 */
export const fontSize = {
    xs: rValue({ mobile: 10, tablet: 11, desktop: 12 }),
    sm: rValue({ mobile: 12, tablet: 13, desktop: 14 }),
    base: rValue({ mobile: 14, tablet: 15, desktop: 16 }),
    lg: rValue({ mobile: 16, tablet: 17, desktop: 18 }),
    xl: rValue({ mobile: 18, tablet: 20, desktop: 22 }),
    '2xl': rValue({ mobile: 22, tablet: 26, desktop: 30 }),
    '3xl': rValue({ mobile: 28, tablet: 34, desktop: 40 }),
};

/**
 * Responsive spacing
 */
export const spacing = {
    xs: rValue({ mobile: 4, tablet: 6, desktop: 8 }),
    sm: rValue({ mobile: 8, tablet: 10, desktop: 12 }),
    md: rValue({ mobile: 12, tablet: 16, desktop: 20 }),
    lg: rValue({ mobile: 16, tablet: 24, desktop: 32 }),
    xl: rValue({ mobile: 24, tablet: 32, desktop: 48 }),
};

export default {
    BREAKPOINTS,
    isWeb,
    isMobile,
    useResponsive,
    rValue,
    scale,
    getContainerMaxWidth,
    getGridColumns,
    responsiveStyles,
    fontSize,
    spacing,
};
