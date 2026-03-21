import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { COLORS } from '../utils/theme';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Campos vacíos', 'Por favor completa todos los campos');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Contraseña muy corta', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    try {
      setLoading(true);
      const normalizedEmail = email.trim().toLowerCase();
      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: name.trim(),
        email: normalizedEmail,
        emailNormalized: normalizedEmail,
        uid: userCredential.user.uid,
        createdAt: new Date(),
      });
      Alert.alert('¡Listo!', 'Cuenta creada correctamente');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => [
    styles.input,
    focusedField === field && styles.inputFocused,
  ];

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.inner,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.logoSection}>
          <Text style={styles.logoText}>
            <Text style={styles.logoMis}>Mis</Text>
            <Text style={styles.logoMedicamentos}>Medicamentos</Text>
          </Text>
          <Text style={styles.tagline}>Crea tu cuenta gratis</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Registro</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nombre completo</Text>
            <TextInput
              style={inputStyle('name')}
              placeholder="Tu nombre"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={inputStyle('email')}
              placeholder="tu@correo.com"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={inputStyle('password')}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>¿ya tienes cuenta?</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Al continuar aceptas los{' '}
          <Text style={styles.footerLink}>términos de uso</Text>
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
  },
  inner: {
    paddingHorizontal: 24,
  },

  logoSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 44,
    marginBottom: 6,
  },
  logoMis: {
    color: COLORS.text,
    fontSize: 36,
    fontWeight: '700',
  },
  logoMedicamentos: {
    color: COLORS.accent,
    fontSize: 36,
    fontWeight: '700',
  },
  tagline: {
    fontSize: 13,
    color: COLORS.textMuted,
    letterSpacing: 0.2,
  },

  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.surface,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 22,
    letterSpacing: -0.3,
  },

  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSub,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  inputFocused: {
    borderColor: COLORS.accent,
    backgroundColor: '#1a1c2a',
  },

  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.surface,
  },
  dividerText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  secondaryButton: {
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.accent,
    fontSize: 15,
    fontWeight: '600',
  },

  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 22,
  },
  footerLink: {
    color: COLORS.accent,
  },
});
