import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { firebaseConfigError, missingFirebaseKeys } from './src/services/firebase';
import { COLORS } from './src/utils/theme';

function FirebaseConfigErrorScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Configuración incompleta</Text>
        <Text style={styles.text}>
          La app no puede iniciar porque faltan variables de entorno de Firebase.
        </Text>
        <Text style={styles.text}>
          Variables faltantes: {missingFirebaseKeys.join(', ')}
        </Text>
        <Text style={styles.hint}>
          Vuelve a compilar el APK incluyendo las variables EXPO_PUBLIC_FIREBASE_* en el build.
        </Text>
      </View>
    </View>
  );
}

export default function App() {
  if (firebaseConfigError) {
    return <FirebaseConfigErrorScreen />;
  }

  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.bg,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    gap: 12,
  },
  title: {
    color: COLORS.danger,
    fontSize: 24,
    fontWeight: '700',
  },
  text: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 22,
  },
  hint: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
