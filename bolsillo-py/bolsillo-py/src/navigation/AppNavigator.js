import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import InicioScreen from '../screens/InicioScreen';
import AgregarScreen from '../screens/AgregarScreen';
import MovimientosScreen from '../screens/MovimientosScreen';
import EstadisticasScreen from '../screens/EstadisticasScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0F172A',
            borderTopColor: '#1E293B',
          },
          tabBarActiveTintColor: '#38BDF8',
          tabBarInactiveTintColor: '#64748B',
          tabBarIcon: ({ color, size }) => {
            const iconos = {
              Inicio: 'wallet-outline',
              Agregar: 'add-circle-outline',
              Movimientos: 'list-outline',
              Estadísticas: 'bar-chart-outline',
            };
            return <Ionicons name={iconos[route.name]} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Inicio" component={InicioScreen} />
        <Tab.Screen name="Agregar" component={AgregarScreen} />
        <Tab.Screen name="Movimientos" component={MovimientosScreen} />
        <Tab.Screen name="Estadísticas" component={EstadisticasScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}