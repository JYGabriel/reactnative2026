import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FinanzasProvider } from './src/context/FinanzasContext';
import PresupuestoScreen from './src/screens/PresupuestoScreen';
import TarjetasScreen from './src/screens/TarjetasScreen';
import { colores } from './src/theme';

const Tab = createBottomTabNavigator();

const tema = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colores.fondo, card: colores.tarjeta, border: colores.borde },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <FinanzasProvider>
        <NavigationContainer theme={tema}>
          <StatusBar style='light' />
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarActiveTintColor: colores.acento,
              tabBarInactiveTintColor: colores.suave,
              tabBarIcon: ({ color, size }) => (
                <Ionicons
                  name={route.name === 'Presupuesto' ? 'wallet-outline' : 'card-outline'}
                  size={size}
                  color={color}
                />
              ),
            })}
          >
            <Tab.Screen name='Presupuesto' component={PresupuestoScreen} />
            <Tab.Screen name='Deuda Cero' component={TarjetasScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </FinanzasProvider>
    </SafeAreaProvider>
  );
}