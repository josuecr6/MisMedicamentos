import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

export default function ProfileScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setName(userDoc.data().name);
          setEmail(userDoc.data().email);
        }
      } catch (error) {
        Alert.alert('Error', 'No se pudo cargar el perfil');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSaveName = async () => {
    if (!name) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }
    try {
      setSavingName(true);
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { name });
      Alert.alert('Éxito', 'Nombre actualizado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el nombre');
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas nuevas no coinciden');
      return;
    }
    try {
      setSavingPassword(true);
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Éxito', 'Contraseña actualizada correctamente');
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        Alert.alert('Error', 'La contraseña actual es incorrecta');
      } else {
        Alert.alert('Error', 'No se pudo actualizar la contraseña');
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => await signOut(auth)
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2d6a4f" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Mi perfil</Text>

      <TouchableOpacity
        style={styles.reportsButton}
        onPress={() => navigation.navigate('Reports')}
      >
        <Text style={styles.reportsButtonText}>📋 Ver historial de medicamentos</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información personal</Text>
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Tu nombre"
        />
        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput
          style={[styles.input, styles.inputDisabled]}
          value={email}
          editable={false}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleSaveName}
          disabled={savingName}
        >
          <Text style={styles.buttonText}>
            {savingName ? 'Guardando...' : 'Guardar nombre'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cambiar contraseña</Text>
        <Text style={styles.label}>Contraseña actual</Text>
        <TextInput
          style={styles.input}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="Contraseña actual"
        />
        <Text style={styles.label}>Nueva contraseña</Text>
        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="Nueva contraseña"
        />
        <Text style={styles.label}>Confirmar nueva contraseña</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="Confirmar nueva contraseña"
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleChangePassword}
          disabled={savingPassword}
        >
          <Text style={styles.buttonText}>
            {savingPassword ? 'Actualizando...' : 'Cambiar contraseña'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d6a4f',
    marginTop: 40,
    marginBottom: 24
  },
  reportsButton: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#2d6a4f',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24
  },
  reportsButtonText: {
    color: '#2d6a4f',
    fontSize: 15,
    fontWeight: 'bold'
  },
  section: {
    marginBottom: 32,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d6a4f',
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 6
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999'
  },
  button: {
    backgroundColor: '#2d6a4f',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold'
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 40
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});