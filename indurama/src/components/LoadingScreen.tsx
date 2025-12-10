import React from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../styles/theme';

const { width, height } = Dimensions.get('window');
const isMobile = width < 768;

/**
 * Pantalla de carga minimalista con el logo oficial
 */
export const LoadingScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={theme.colors.primary} />

      <View style={styles.logoWrapper}>
        <Image
          source={require('../../assets/icono_indurama.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  logoWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: isMobile ? 190 : 220,
    height: isMobile ? 190 : 220,
  },
});