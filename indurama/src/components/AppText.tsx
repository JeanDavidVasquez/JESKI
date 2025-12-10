import React from 'react';
import { Text, StyleSheet, TextStyle, TextProps } from 'react-native';
import { theme } from '../styles/theme';

interface AppTextProps extends TextProps {
  children: React.ReactNode;
  variant?: 'heading1' | 'heading2' | 'heading3' | 'body' | 'caption' | 'small';
  color?: string;
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
}

/**
 * Componente de texto base con tipografía consistente
 */
export const AppText: React.FC<AppTextProps> = ({
  children,
  variant = 'body',
  color = theme.colors.text.primary,
  weight = 'normal',
  align = 'left',
  style,
  ...props
}) => {
  const textStyle = [
    styles.base,
    styles[variant],
    { color },
    { fontWeight: theme.typography.fontWeight[weight] },
    { textAlign: align },
    style,
  ];

  return (
    <Text style={textStyle} {...props}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    // fontFamily: theme.typography.fontFamily.regular, // Comentado para usar fuente por defecto
    lineHeight: theme.typography.lineHeight.normal,
  },
  heading1: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    lineHeight: theme.typography.lineHeight.tight,
  },
  heading2: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.semibold,
    lineHeight: theme.typography.lineHeight.tight,
  },
  heading3: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    lineHeight: theme.typography.lineHeight.normal,
  },
  body: {
    fontSize: theme.typography.fontSize.base,
    lineHeight: theme.typography.lineHeight.normal,
  },
  caption: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  small: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
});