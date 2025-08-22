import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen from './screens/WelcomeScreen';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import NfcScreen from './screens/NfcScreen';
import HistorialScreen from './screens/HistorialScreen';
import TrabajadorFormScreen from './screens/TrabajadorFormScreen';

// dentro del Stack.Navigator:

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Nfc" component={NfcScreen} />
        <Stack.Screen name="Historial" component={HistorialScreen} />
        <Stack.Screen name="RegistroTrabajador" component={TrabajadorFormScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
