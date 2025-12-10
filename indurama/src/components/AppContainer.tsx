import React from 'react';
import { View, StyleSheet, ViewStyle, ViewProps } from 'react-native';
import { theme } from '../styles/theme';

interface AppContainerProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'centered' | 'padded' | 'safe';
  backgroundColor?: string;
}

/**
 * Componente contenedor base de la aplicación
 * Proporciona estilos consistentes para las pantallas
 */
export const AppContainer: React.FC<AppContainerProps> = ({
  children,
  variant = 'default',
  backgroundColor = theme.colors.background.primary,
  style,
  ...props
}) => {
  const containerStyle = [
    styles.base,
    { backgroundColor },
    variant === 'centered' && styles.centered,
    variant === 'padded' && styles.padded,
    variant === 'safe' && styles.safe,
    style,
  ];

  return (
    <View style={containerStyle} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  padded: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[4],
  },
  safe: {
    paddingTop: theme.spacing[10], // Para status bar
  },
});