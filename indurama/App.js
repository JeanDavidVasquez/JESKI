import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import 'react-native-gesture-handler';
import { SimpleNavigator } from './src/navigation/SimpleNavigator';
import { SplashScreen } from './src/screens/SplashScreen';
import { AuthProvider } from './src/context/AuthContext';

// Usando un navegador simple temporal para evitar errores de React Navigation v7
// Una vez resueltas las incompatibilidades, migraremos a React Navigation completo

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // En web, omitir el splash screen
    if (Platform.OS === 'web') {
      setShowSplash(false);
    }
  }, []);

  const handleSplashEnd = () => {
    setShowSplash(false);
  };

  return (
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
  );
}
