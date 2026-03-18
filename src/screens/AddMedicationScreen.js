import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { auth } from '../services/firebase';

export default function AddMedicationScreen({ navigation }) {
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [doctor, setDoctor] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name || !reason || !doctor) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    try {
      setLoading(true);
      await addDoc(collection(db, 'medications'), {
        name,
        reason,
        doctor,
        userId: auth.currentUser.uid,
        createdAt: new Date()
      });
      Alert.alert('Éxito', 'Medicamento guardado correctamente');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el medicamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Agregar medicamento</Text>

      <Text style={styles.label}>Nombre del medicamento</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Paracetamol"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>¿Para qué fue recetado?</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Dolor de cabeza"
        value={reason}
        onChangeText={setReason}
      />

      <Text style={styles.label}>Doctor que lo recetó</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Dr. Juan Pérez"
        value={doctor}
        onChangeText={setDoctor}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Guardando...' : 'Guardar medicamento'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d6a4f',
    marginBottom: 24,
    marginTop: 16
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
  button: {
    backgroundColor: '#2d6a4f',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});