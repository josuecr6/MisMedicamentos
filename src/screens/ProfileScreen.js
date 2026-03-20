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
import { COLORS } from '../utils/theme';
import { commonStyles } from '../utils/commonStyles';

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
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
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
      <View style={[commonStyles.container, styles.loader]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={commonStyles.scrollContainer}>
      <Text style={commonStyles.title}>Mi perfil</Text>

      <TouchableOpacity
        style={styles.reportsButton}
        onPress={() => navigation.navigate('Reports')}
      >
        <Text style={styles.reportsButtonText}>📋 Ver historial de medicamentos</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={commonStyles.sectionTitle}>Información personal</Text>
        <Text style={commonStyles.label}>Nombre</Text>
        <TextInput
          style={commonStyles.input}
          value={name}
          onChangeText={setName}
          placeholder="Tu nombre"
          placeholderTextColor={COLORS.textMuted}
        />
        <Text style={commonStyles.label}>Correo electrónico</Text>
        <TextInput
          style={[commonStyles.input, commonStyles.inputDisabled]}
          value={email}
          editable={false}
        />
        <TouchableOpacity
          style={commonStyles.button}
          onPress={handleSaveName}
          disabled={savingName}
        >
          <Text style={commonStyles.buttonText}>
            {savingName ? 'Guardando...' : 'Guardar nombre'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={commonStyles.sectionTitle}>Cambiar contraseña</Text>
        <Text style={commonStyles.label}>Contraseña actual</Text>
        <TextInput
          style={commonStyles.input}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="Contraseña actual"
          placeholderTextColor={COLORS.textMuted}
        />
        <Text style={commonStyles.label}>Nueva contraseña</Text>
        <TextInput
          style={commonStyles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="Nueva contraseña"
          placeholderTextColor={COLORS.textMuted}
        />
        <Text style={commonStyles.label}>Confirmar nueva contraseña</Text>
        <TextInput
          style={commonStyles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="Confirmar nueva contraseña"
          placeholderTextColor={COLORS.textMuted}
        />
        <TouchableOpacity
          style={commonStyles.button}
          onPress={handleChangePassword}
          disabled={savingPassword}
        >
          <Text style={commonStyles.buttonText}>
            {savingPassword ? 'Actualizando...' : 'Cambiar contraseña'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={commonStyles.deleteButton} onPress={handleLogout}>
        <Text style={commonStyles.deleteButtonText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loader: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  reportsButton: {
    backgroundColor: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24
  },
  reportsButtonText: {
    color: COLORS.accent,
    fontSize: 15,
    fontWeight: 'bold'
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.surface,
    borderRadius: 12,
    backgroundColor: COLORS.secondary
  }
});