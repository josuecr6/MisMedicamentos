import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDrw8Utihu20qd2QSDshGrDCIouCAfK6HI",
  authDomain: "mismedicamentos.firebaseapp.com",
  projectId: "mismedicamentos",
  storageBucket: "mismedicamentos.firebasestorage.app",
  messagingSenderId: "796320688489",
  appId: "1:796320688489:web:ba1b2acf52be331040f5f8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);