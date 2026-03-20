import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { COLORS } from '../utils/theme';
import { commonStyles } from '../utils/commonStyles';

export default function SharedWithMeScreen({ navigation }) {
  const [sharedList, setSharedList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'sharedAccess'),
      where('guestId', '==', auth.currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSharedList(list);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={commonStyles.card}
      onPress={() => navigation.navigate('SharedStatus', {
        ownerId: item.ownerId,
        ownerName: item.ownerEmail
      })}
    >
      <View style={styles.cardInfo}>
        <Text style={styles.cardEmail}>{item.ownerEmail}</Text>
        <Text style={styles.cardHint}>Toca para ver sus medicamentos</Text>
      </View>
      <Text style={styles.arrow}>→</Text>
    </TouchableOpacity>
  );

  return (
    <View style={commonStyles.container}>
      <Text style={commonStyles.title}>Compartido conmigo</Text>
      <Text style={commonStyles.subtitle}>
        Estas personas te dieron acceso a ver sus medicamentos
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.accent} />
      ) : sharedList.length === 0 ? (
        <View style={commonStyles.empty}>
          <Text style={commonStyles.emptyText}>Nadie ha compartido contigo aún</Text>
        </View>
      ) : (
        <FlatList
          data={sharedList}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 16
  },
  cardInfo: {
    flex: 1
  },
  cardEmail: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text
  },
  cardHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2
  },
  arrow: {
    fontSize: 20,
    color: COLORS.accent,
    fontWeight: 'bold'
  }
});