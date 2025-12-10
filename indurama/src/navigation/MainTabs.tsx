// Este archivo está temporalmente comentado debido a incompatibilidades con React Navigation v7
// Se reactivará una vez resueltas las incompatibilidades de tipos

/*
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { TabParamList } from './types';
import { theme } from '../styles/theme';

const Tab = createBottomTabNavigator<TabParamList>();

export const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.white,
          borderTopColor: theme.colors.border.light,
          height: theme.dimensions.tabBarHeight,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text.muted,
      }}
      initialRouteName="DashboardTab"
    >
      // ... screens
    </Tab.Navigator>
  );
};
*/

// Exportación temporal vacía
export const MainTabs = () => null;