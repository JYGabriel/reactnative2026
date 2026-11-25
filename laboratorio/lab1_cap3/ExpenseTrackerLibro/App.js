import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import AddAssetsScreen from './screens/AddAssetsScreen';
import TransactionScreen from './screens/TransactionScreen';
import StatsScreen from './screens/StatsScreen';
import TransactionDetailScreen from './screens/TransactionDetailScreen';
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
// Navegación Stack dentro de Transaction
function TransactionStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Transactions"
        component={TransactionScreen}
      />
      <Stack.Screen
        name="TransactionDetail"
        component={TransactionDetailScreen}
      />
    </Stack.Navigator>
  );
}
export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen
          name="Home"
          component={HomeScreen}
        />
        <Tab.Screen
          name="Add Assets"
          component={AddAssetsScreen}
        />
        <Tab.Screen
          name="Transaction"
          component={TransactionStack}
          options={{ headerShown: false }}
        />
        <Tab.Screen
          name="Stats"
          component={StatsScreen}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}