import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, browserLocalPersistence } from 'firebase/auth'; // Added browserLocalPersistence
import * as firebaseAuth from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore'; // Added imports for query checks
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native'; // Import Platform
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

// Inicializar Auth con persistencia adecuada según la plataforma
let auth;

try {
  if (Platform.OS === 'web') {
    // En Web, usamos getAuth que maneja persistence por defecto (localStorage)
    // Pero si queremos ser explícitos:
    auth = getAuth(app);
    auth.setPersistence(browserLocalPersistence).catch(e => console.error('Error setting web persistence:', e));
  } else {
    // En Native, usamos AsyncStorage
    const getReactNativePersistence = (firebaseAuth as any).getReactNativePersistence;
    if (getReactNativePersistence) {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
    } else {
      auth = getAuth(app);
    }
  }
} catch (e) {
  console.warn('Error initializing auth persistence, falling back to default:', e);
  auth = getAuth(app);
}

// Inicializar otros servicios de Firebase
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
export default app;