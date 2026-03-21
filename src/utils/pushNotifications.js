import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

// Detecta si estamos en Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

export async function registerPushToken() {
  // En Expo Go las notificaciones push remotas no funcionan desde SDK 53
  if (isExpoGo) {
    console.log(
      '[PushNotifications] Expo Go detectado: el registro de push token requiere un development build.'
    );
    return null;
  }

  if (!Device.isDevice) {
    console.log('[PushNotifications] Solo funciona en dispositivos físicos.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[PushNotifications] Permisos de notificaciones no concedidos.');
    return null;
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

    if (!projectId) {
      console.log('[PushNotifications] No se encontró el projectId de EAS.');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

    if (auth.currentUser) {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        pushToken: token,
      });
    }

    return token;
  } catch (error) {
    console.log('[PushNotifications] Error al obtener el token:', error);
    return null;
  }
}
