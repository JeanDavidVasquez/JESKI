import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
import * as firebaseAuth from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  API_KEY,
  AUTH_DOMAIN,
  PROJECT_ID,
  STORAGE_BUCKET,
  MESSAGING_SENDER_ID,
  APP_ID,
  MEASUREMENT_ID
} from '@env';

/**
 * Configuración de Firebase para la aplicación Indurama
 * IMPORTANTE: Reemplaza estas credenciales con las de tu proyecto Firebase
 */

const firebaseConfig = {
  apiKey: API_KEY,
  authDomain: AUTH_DOMAIN,
  projectId: PROJECT_ID,
  storageBucket: STORAGE_BUCKET,
  messagingSenderId: MESSAGING_SENDER_ID,
  appId: APP_ID,
  measurementId: MEASUREMENT_ID
};

// Inicializar Firebase (solo una vez)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Inicializar Auth con persistencia AsyncStorage para React Native
// Usamos initializeAuth con getReactNativePersistence para persistencia en RN
// La función puede no estar en los tipos de TS actuales, así que accedemos dinámicamente
let auth;
try {
  const getReactNativePersistence = (firebaseAuth as any).getReactNativePersistence;

  if (getReactNativePersistence) {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } else {
    auth = getAuth(app);
  }
} catch (e) {
  auth = getAuth(app);
}

// Inicializar otros servicios de Firebase
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
export default app;