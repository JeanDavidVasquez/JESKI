import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Image, Dimensions, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../../styles/theme';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

interface SplashScreenProps {
  onAnimationEnd: () => void;
}

/**
 * Pantalla de splash minimalista con el logo oficial
 */
export const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationEnd }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();

    const timer = setTimeout(() => {
      onAnimationEnd();
      pulseLoop.stop();
    }, 2500);

    return () => {
      clearTimeout(timer);
      pulseLoop.stop();
      pulseAnim.setValue(1);
    };
  }, [onAnimationEnd, pulseAnim]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={theme.colors.primary} />

      <Animated.View
        style={[
          styles.logoWrapper,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <Image
          source={require('../../../assets/icono_indurama.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>
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
    width: isMobile ? 180 : 240,
    height: isMobile ? 180 : 240,
  },
});