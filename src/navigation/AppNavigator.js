import React from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Svg, { Path } from 'react-native-svg';

import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/theme';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import AddMedicationScreen from '../screens/AddMedicationScreen';
import EditMedicationScreen from '../screens/EditMedicationScreen';
import PersonsScreen from '../screens/PersonsScreen';
import SharedStatusScreen from '../screens/SharedStatusScreen';
import SharedWithMeScreen from '../screens/SharedWithMeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReportsScreen from '../screens/ReportsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeIcon({ color }) {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24">
      <Path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill={color} />
    </Svg>
  );
}

function PersonsIcon({ color }) {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24">
      <Path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill={color} />
    </Svg>
  );
}

function SharedIcon({ color }) {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24">
      <Path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" fill={color} />
    </Svg>
  );
}

function ProfileIcon({ color }) {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24">
      <Path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill={color} />
    </Svg>
  );
}

function AddButton({ onPress }) {
  return (
    <TouchableOpacity style={styles.addButton} onPress={onPress}>
      <Svg width="28" height="28" viewBox="0 0 24 24">
        <Path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill={COLORS.bg} />
      </Svg>
    </TouchableOpacity>
  );
}

function BottomTabs({ navigation }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: styles.tabLabel
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color }) => <HomeIcon color={color} /> }}
      />
      <Tab.Screen
        name="Accesos"
        component={PersonsScreen}
        options={{ tabBarIcon: ({ color }) => <PersonsIcon color={color} /> }}
      />
      <Tab.Screen
        name="Agregar"
        component={AddMedicationScreen}
        options={{
          tabBarButton: () => (
            <AddButton onPress={() => navigation.navigate('AddMedication')} />
          )
        }}
      />
      <Tab.Screen
        name="Compartido"
        component={SharedWithMeScreen}
        options={{ tabBarIcon: ({ color }) => <SharedIcon color={color} /> }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color }) => <ProfileIcon color={color} /> }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 64,
    borderTopWidth: 0,
    backgroundColor: COLORS.secondary,
    paddingBottom: 8,
    paddingTop: 8
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500'
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 8
  }
});

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: COLORS.accent,
          background: COLORS.bg,
          card: COLORS.secondary,
          text: COLORS.text,
          border: COLORS.surface,
          notification: COLORS.accent
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '900' }
        }
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.secondary },
          headerTintColor: COLORS.text,
          headerTitleStyle: { fontWeight: '600' }
        }}
      >
        {user ? (
          <>
            <Stack.Screen name="Main" options={{ headerShown: false }}>
              {(props) => <BottomTabs {...props} />}
            </Stack.Screen>
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
              name="SharedStatus"
              component={SharedStatusScreen}
              options={{ title: 'Estado de medicamentos' }}
            />
            <Stack.Screen
              name="Reports"
              component={ReportsScreen}
              options={{ title: 'Historial de medicamentos' }}
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