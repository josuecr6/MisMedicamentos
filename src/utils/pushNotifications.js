import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
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
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const token = (
      await Notifications.getExpoPushTokenAsync({ projectId })
    ).data;

    const currentUser = auth.currentUser;

    // M2 — verificar que hay sesión activa y que el documento existe
    // antes de intentar escribir el token
    if (!currentUser) {
      console.log('No hay sesión activa, no se guarda el push token');
      return null;
    }

    const userRef = doc(db, 'users', currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.log('Documento de usuario no encontrado, no se guarda el push token');
      return null;
    }

    await updateDoc(userRef, { pushToken: token });

    return token;
  } catch (error) {
    console.log('Error al obtener o guardar el token:', error);
    return null;
  }
}
