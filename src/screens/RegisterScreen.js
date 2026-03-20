import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const COLORS = {
  bg: '#1c1c1e',
  secondary: '#2c2c2e',
  surface: '#3a3a3c',
  accent: '#ff9f0a',
  text: '#ffffff',
  textMuted: '#8e8e93'
};

// M3 — límite de intentos de registro
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60 * 1000; // 1 minuto de bloqueo

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const attemptCount = useRef(0);
  const lockedUntil = useRef(null);

  const isLockedOut = () => {
    if (lockedUntil.current && Date.now() < lockedUntil.current) {
      const secondsLeft = Math.ceil(
        (lockedUntil.current - Date.now()) / 1000
      );
      Alert.alert(
        'Demasiados intentos',
        `Por seguridad espera ${secondsLeft} segundos antes de intentar de nuevo.`
      );
      return true;
    }
    return false;
  };

  const handleRegister = async () => {
    // M3 — verificar bloqueo antes de proceder
    if (isLockedOut()) return;

    if (!name || !email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      attemptCount.current += 1;

      // Bloquear después de MAX_ATTEMPTS intentos fallidos
      if (attemptCount.current >= MAX_ATTEMPTS) {
        lockedUntil.current = Date.now() + LOCKOUT_MS;
        attemptCount.current = 0;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.toLowerCase().trim(),
        password
      );

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        uid: userCredential.user.uid,
        createdAt: new Date()
      });

      // Registro exitoso — resetear contador
      attemptCount.current = 0;
      lockedUntil.current = null;

      Alert.alert('Éxito', 'Cuenta creada correctamente');
      navigation.navigate('Login');
    } catch (error) {
      // Mensajes genéricos para no revelar si el email ya existe
      const genericErrors = {
        'auth/email-already-in-use': 'No se pudo crear la cuenta. Intenta con otro correo.',
        'auth/invalid-email': 'El formato del correo no es válido.',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.'
      };
      const message =
        genericErrors[error.code] ?? 'No se pudo crear la cuenta. Intenta de nuevo.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>
      <Text style={styles.subtitle}>Regístrate para comenzar</Text>

      <TextInput
        style={styles.input}
        placeholder="Nombre completo"
        placeholderTextColor={COLORS.textMuted}
        value={name}
        onChangeText={setName}
        autoCorrect={false}
      />
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor={COLORS.textMuted}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor={COLORS.textMuted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Creando cuenta...' : 'Registrarse'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.loginText}>¿Ya tienes cuenta? Inicia sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.bg
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: COLORS.accent
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 40,
    color: COLORS.textMuted
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: COLORS.secondary,
    color: COLORS.text
  },
  button: {
    backgroundColor: COLORS.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16
  },
  buttonText: {
    color: COLORS.bg,
    fontSize: 16,
    fontWeight: 'bold'
  },
  loginText: {
    textAlign: 'center',
    color: COLORS.accent,
    fontSize: 14
  }
});
