// Este archivo está temporalmente comentado debido a incompatibilidades con React Navigation v7
// Se reactivará una vez resueltas las incompatibilidades de tipos

/*
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text } from 'react-native';

const Stack = createStackNavigator();

export const AuthStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Login"
    >
      <Stack.Screen name="Login" component={PlaceholderLogin} />
      <Stack.Screen name="Register" component={PlaceholderRegister} />
    </Stack.Navigator>
  );
};

const PlaceholderLogin = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Login Screen - Coming Soon</Text>
  </View>
);

const PlaceholderRegister = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Register Screen - Coming Soon</Text>
  </View>
);
*/

// Exportación temporal vacía
export const AuthStack = () => null;