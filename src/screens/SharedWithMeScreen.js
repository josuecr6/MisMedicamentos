import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {
  collection,
  query,
  where,
  onSnapshot,
  limit,
} from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { COLORS } from '../utils/theme';
import { commonStyles } from '../utils/commonStyles';

export default function SharedWithMeScreen({ navigation }) {
  const [sharedList, setSharedList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'sharedAccess'),
      where('guestId', '==', auth.currentUser.uid),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSharedList(list);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handlePress = useCallback(
    (item) => {
      navigation.navigate('SharedStatus', {
        ownerId: item.ownerId,
        ownerName: item.ownerName || item.ownerEmail,
      });
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <TouchableOpacity style={commonStyles.card} onPress={() => handlePress(item)}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.ownerName || item.ownerEmail}</Text>
          <Text style={styles.cardHint}>Toca para ver sus medicamentos</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
      </TouchableOpacity>
    ),
    [handlePress]
  );

  const keyExtractor = useCallback((item) => item.id, []);

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
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  cardHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  arrow: {
    fontSize: 20,
    color: COLORS.accent,
    fontWeight: 'bold',
  },
});
