import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

export async function registerPushToken() {
  if (!Device.isDevice) {
    console.log('Las notificaciones push solo funcionan en dispositivos físicos');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permisos de notificaciones no concedidos');
    return null;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId
      ?? Constants.easConfig?.projectId;

    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: projectId
    })).data;

    if (auth.currentUser) {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        pushToken: token
      });
    }

    return token;
  } catch (error) {
    console.log('Error al obtener el token:', error);
    return null;
  }
}