import { Platform } from 'react-native';

/**
 * Tema global de la aplicación Indurama
 * Incluye colores, tipografía, espaciados y otros tokens de diseño
 */

export const theme = {
  // Paleta de colores principal basada en el diseño de Indurama
  colors: {
    // Colores primarios de Indurama
    primary: '#003E85', // Azul oscuro principal
    primaryLight: '#4A90E2', // Azul claro
    primaryDark: '#062A4F', // Azul más oscuro

    // Colores secundarios
    secondary: '#00A8CC', // Azul turquesa del logo
    secondaryLight: '#33BCDB',
    secondaryDark: '#007B99',

    // Colores de acento
    accent: '#FF6B35', // Naranja para botones de acción
    accentLight: '#FF8A5F',
    accentDark: '#E55529',

    // Colores de estado
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    // Colores neutrales
    white: '#FFFFFF',
    black: '#000000',
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },

    // Colores de fondo
    background: {
      primary: '#FFFFFF',
      secondary: '#F8F9FA',
      tertiary: '#F3F4F6',
    },

    // Colores de texto
    text: {
      primary: '#111827',
      secondary: '#4B5563',
      tertiary: '#6B7280',
      inverse: '#FFFFFF',
      muted: '#9CA3AF',
    },

    // Colores de bordes
    border: {
      light: '#E5E7EB',
      medium: '#D1D5DB',
      dark: '#9CA3AF',
    }
  },

  // Tipografía
  typography: {
    fontFamily: {
      regular: undefined, // Usar fuente por defecto del sistema
      medium: undefined,
      bold: undefined,
    },

    // Estilos de texto predefinidos para usar con spread operator
    styles: {
      // Títulos principales
      h1: {
        fontSize: 36,
        fontWeight: '700' as '700',
        lineHeight: 42,
        color: '#111827',
      },
      h2: {
        fontSize: 24,
        fontWeight: '700' as '700',
        lineHeight: 32,
        color: '#111827',
      },
      h3: {
        fontSize: 20,
        fontWeight: '600' as '600',
        lineHeight: 28,
        color: '#111827',
      },
      h4: {
        fontSize: 18,
        fontWeight: '600' as '600',
        lineHeight: 24,
        color: '#111827',
      },

      // Cuerpo de texto
      bodyLarge: {
        fontSize: 16,
        fontWeight: '400' as '400',
        lineHeight: 24,
        color: '#4B5563',
      },
      body: {
        fontSize: 14,
        fontWeight: '400' as '400',
        lineHeight: 20,
        color: '#4B5563',
      },
      bodySmall: {
        fontSize: 12,
        fontWeight: '400' as '400',
        lineHeight: 18,
        color: '#6B7280',
      },

      // Texto semibold
      bodySemibold: {
        fontSize: 14,
        fontWeight: '600' as '600',
        lineHeight: 20,
        color: '#111827',
      },
      bodyLargeSemibold: {
        fontSize: 16,
        fontWeight: '600' as '600',
        lineHeight: 24,
        color: '#111827',
      },

      // Botones
      button: {
        fontSize: 16,
        fontWeight: '600' as '600',
        lineHeight: 20,
        color: '#FFFFFF',
      },
      buttonSmall: {
        fontSize: 14,
        fontWeight: '600' as '600',
        lineHeight: 18,
        color: '#FFFFFF',
      },

      // Labels y captions
      label: {
        fontSize: 14,
        fontWeight: '500' as '500',
        lineHeight: 20,
        color: '#374151',
      },
      labelBold: {
        fontSize: 14,
        fontWeight: '600' as '600',
        lineHeight: 20,
        color: '#424242',
      },
      caption: {
        fontSize: 12,
        fontWeight: '400' as '400',
        lineHeight: 16,
        color: '#6B7280',
      },
      captionBold: {
        fontSize: 12,
        fontWeight: '700' as '700',
        lineHeight: 16,
        color: '#6B7280',
      },

      // Tamaños especiales
      small: {
        fontSize: 10,
        fontWeight: '400' as '400',
        lineHeight: 14,
        color: '#757575',
      },
      smallBold: {
        fontSize: 10,
        fontWeight: '700' as '700',
        lineHeight: 14,
        color: '#757575',
      },
    },

    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
    },
    fontWeight: {
      normal: '400' as '400',
      medium: '500' as '500',
      semibold: '600' as '600',
      bold: '700' as '700',
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
      loose: 1.8,
    }
  },

  // Espaciados
  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
    24: 96,
  },

  // Radios de borde
  borderRadius: {
    none: 0,
    sm: 4,
    base: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    full: 999,
  },

  // Sombras
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    base: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },

  // Dimensiones responsivas
  dimensions: {
    buttonHeight: 48,
    inputHeight: 48,
    headerHeight: 56,
    tabBarHeight: 60,
    // Dimensiones específicas para diferentes dispositivos
    maxWidth: {
      mobile: 400,
      tablet: 600,
      desktop: 800,
    },
    iconSize: {
      xs: 16,
      sm: 20,
      base: 24,
      lg: 32,
      xl: 40,
    }
  },

  // Opacidades
  opacity: {
    disabled: 0.6,
    overlay: 0.5,
    pressed: 0.8,
  }
};

export type Theme = typeof theme;