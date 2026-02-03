import React, { useState } from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { AppText } from './AppText';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
  required?: boolean;
  containerStyle?: any;
}

/**
 * Componente de input base con estilos consistentes
 */
export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  isPassword = false,
  required = false,
  containerStyle,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const inputContainerStyle = [
    styles.container,
    isFocused && styles.containerFocused,
    error && styles.containerError,
  ];

  const inputStyle = [
    styles.input,
    leftIcon && styles.inputWithLeftIcon,
    (rightIcon || isPassword) && styles.inputWithRightIcon,
    style,
  ];

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <AppText variant="caption" weight="medium" color={theme.colors.text.secondary}>
            {label}
            {required && <AppText color={theme.colors.error}> *</AppText>}
          </AppText>
        </View>
      )}

      <View style={inputContainerStyle}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            {leftIcon}
          </View>
        )}

        <TextInput
          style={inputStyle}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={theme.colors.text.muted}
          secureTextEntry={isPassword && !isPasswordVisible}
          {...props}
        />

        {(rightIcon || isPassword) && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={isPassword ? () => setIsPasswordVisible(!isPasswordVisible) : undefined}
          >
            {isPassword ? (
              <AppText color={theme.colors.text.muted}>
                {isPasswordVisible ? '👁️' : '👁️‍🗨️'}
              </AppText>
            ) : rightIcon}
          </TouchableOpacity>
        )}
      </View>

      {(error || hint) && (
        <View style={styles.messageContainer}>
          <AppText
            variant="small"
            color={error ? theme.colors.error : theme.colors.text.tertiary}
          >
            {error || hint}
          </AppText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: theme.spacing[2], // Reducido de theme.spacing[4]
  },
  labelContainer: {
    marginBottom: theme.spacing[2],
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0', // Color más suave para el prototipo
    borderRadius: theme.borderRadius.lg,
    backgroundColor: '#ffffff', // Fondo blanco
    height: isMobile ? 56 : 60, // Altura específica del prototipo
    paddingHorizontal: theme.spacing[4],
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.text.primary,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  containerFocused: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: `0 2px 8px ${theme.colors.primary}30`,
      },
    }),
  },
  containerError: {
    borderColor: theme.colors.error,
    borderWidth: 2,
  },
  input: {
    flex: 1,
    fontSize: isMobile ? 16 : theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    paddingVertical: isMobile ? theme.spacing[2] : theme.spacing[3],
    lineHeight: isMobile ? 20 : 24,
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  leftIconContainer: {
    paddingLeft: isMobile ? theme.spacing[3] : theme.spacing[4],
    paddingRight: theme.spacing[2],
  },
  rightIconContainer: {
    paddingRight: isMobile ? theme.spacing[3] : theme.spacing[4],
    paddingLeft: theme.spacing[2],
  },
  messageContainer: {
    marginTop: theme.spacing[1],
    paddingHorizontal: theme.spacing[1],
  },
});