import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import AddMedicationScreen from '../screens/AddMedicationScreen';
import EditMedicationScreen from '../screens/EditMedicationScreen';
import PersonsScreen from '../screens/PersonsScreen';
import SharedStatusScreen from '../screens/SharedStatusScreen';
import SharedWithMeScreen from '../screens/SharedWithMeScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2d6a4f" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AddMedication"
              component={AddMedicationScreen}
              options={{ title: 'Agregar medicamento' }}
            />
            <Stack.Screen
              name="EditMedication"
              component={EditMedicationScreen}
              options={{ title: 'Editar medicamento' }}
            />
            <Stack.Screen
              name="Persons"
              component={PersonsScreen}
              options={{ title: 'Personas con acceso' }}
            />
            <Stack.Screen
              name="SharedStatus"
              component={SharedStatusScreen}
              options={{ title: 'Estado de medicamentos' }}
            />
            <Stack.Screen
              name="SharedWithMe"
              component={SharedWithMeScreen}
              options={{ title: 'Compartido conmigo' }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ title: 'Mi perfil' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ title: 'Crear cuenta' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}