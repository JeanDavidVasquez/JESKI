import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Configuración de Firebase para la aplicación Indurama
 * IMPORTANTE: Reemplaza estas credenciales con las de tu proyecto Firebase
 */

const firebaseConfig = {
  apiKey: "AIzaSyB7VxftGmsUaS42d1T9YRYDgSU3SOOhjrY",
  authDomain: "indurama-aadc3.firebaseapp.com",
  projectId: "indurama-aadc3",
  storageBucket: "indurama-aadc3.firebasestorage.app",
  messagingSenderId: "994674499679",
  appId: "1:994674499679:web:e342aaf59903f817977bea",
  measurementId: "G-8R2GRQ6901"
};

// Inicializar Firebase (solo una vez)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Inicializar Auth con persistencia AsyncStorage para React Native
let auth;
if (getApps().length === 0) {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} else {
  auth = getAuth(app);
}

// Inicializar otros servicios de Firebase
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
export default app;