import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, ActivityIndicator } from 'react-native';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SimpleNavigator } from './src/navigation/SimpleNavigator';
import { SplashScreen } from './src/screens';
import { AuthProvider } from './src/context/AuthContext';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

// Inicialización de internacionalización (i18n)
import './src/i18n/config';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  useEffect(() => {
    if (Platform.OS === 'web') {
      setShowSplash(false);
    }
  }, []);

  const handleSplashEnd = () => {
    setShowSplash(false);
  };

  // On web, fonts load via CSS - don't block. On native, wait for fonts.
  if (!fontsLoaded && Platform.OS !== 'web') {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        {showSplash ? (
          <SplashScreen onAnimationEnd={handleSplashEnd} />
        ) : (
          <>
            <StatusBar style="dark" />
            <SimpleNavigator />
          </>
        )}
      </AuthProvider>
    </SafeAreaProvider>
  );
}