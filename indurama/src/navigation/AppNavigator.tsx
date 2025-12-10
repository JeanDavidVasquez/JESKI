// Este archivo está temporalmente comentado debido a incompatibilidades con React Navigation v7
// Se reactivará una vez resueltas las incompatibilidades de tipos

/*
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';

const Stack = createStackNavigator();

export const AppNavigator: React.FC = () => {
  const isAuthenticated = false;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
*/

// Exportación temporal vacía
export const AppNavigator = () => null;