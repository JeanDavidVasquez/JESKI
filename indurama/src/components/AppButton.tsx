import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TouchableOpacityProps,
  Platform,
  Dimensions,
} from 'react-native';
import { AppText } from './AppText';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

interface AppButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

/**
 * Componente de botón base con estilos consistentes
 */
export const AppButton: React.FC<AppButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  onPress,
  ...props
}) => {
  const isDisabled = disabled || loading;

  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style,
  ];

  const textColor =
    variant === 'primary' ? theme.colors.white :
      variant === 'secondary' ? theme.colors.white :
        variant === 'outline' ? theme.colors.primary :
          theme.colors.primary;

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={theme.opacity.pressed}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={textColor}
          size="small"
        />
      ) : (
        <AppText
          variant="body"
          color={textColor}
          weight="semibold"
          align="center"
        >
          {title}
        </AppText>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.text.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  // Variantes
  primary: {
    backgroundColor: theme.colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: `0 4px 12px ${theme.colors.primary}40`,
      },
    }),
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  // Tamaños
  small: {
    height: isMobile ? 40 : 36,
    paddingHorizontal: theme.spacing[4],
  },
  medium: {
    height: isMobile ? 48 : theme.dimensions.buttonHeight,
    paddingHorizontal: theme.spacing[6],
  },
  large: {
    height: isMobile ? 52 : 56,
    paddingHorizontal: theme.spacing[8],
  },
  // Estados
  disabled: {
    opacity: theme.opacity.disabled,
  },
  fullWidth: {
    width: '100%',
  },
});