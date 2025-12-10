import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { User, UserRole, ApiResponse } from '../types';

/**
 * Servicio de autenticación para la aplicación Indurama
 */
export class AuthService {
  /**
   * Inicia sesión con email y contraseña
   */
  static async signIn(email: string, password: string): Promise<ApiResponse<User>> {
    try {
      const sanitizedEmail = email.trim();

      // Datos de usuarios de prueba con diferentes roles
      const testUsers = {
        'solicitante@indurama.com': {
          id: 'sol-001',
          email: 'solicitante@indurama.com',
          firstName: 'Juan',
          lastName: 'Pérez',
          role: UserRole.SOLICITANTE,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        'aprobador@indurama.com': {
          id: 'apr-001',
          email: 'aprobador@indurama.com',
          firstName: 'María',
          lastName: 'García',
          role: UserRole.APROBADOR,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        'admin@indurama.com': {
          id: 'adm-001',
          email: 'admin@indurama.com',
          firstName: 'Carlos',
          lastName: 'Ruiz',
          role: UserRole.ADMIN,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        'proveedor@indurama.com': {
          id: 'pro-001',
          email: 'proveedor@indurama.com',
          firstName: 'Ana',
          lastName: 'Soto',
          role: UserRole.PROVEEDOR,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        'gestor@indurama.com': {
          id: 'ges-001',
          email: 'gestor@indurama.com',
          firstName: 'Roberto',
          lastName: 'Mendez',
          role: UserRole.GESTOR,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      const emailKey = sanitizedEmail.toLowerCase() as keyof typeof testUsers;
      // Simulación de autenticación para cuentas de prueba
      const testUser = testUsers[emailKey];
      if (testUser) {
        if (password === 'password123') {
          return {
            success: true,
            data: testUser,
            message: 'Inicio de sesión exitoso'
          };
        }

        return {
          success: false,
          error: 'La contraseña no coincide con la cuenta de prueba',
          errorCode: 'auth/wrong-password'
        };
      }

      // Autenticación con Firebase para otras cuentas
      const userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, password);
      const firebaseUser = userCredential.user;
      
      // Datos básicos del usuario desde Firebase Auth (sin Firestore temporalmente)
      const userData: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || email,
        firstName: firebaseUser.displayName?.split(' ')[0] || 'Usuario',
        lastName: firebaseUser.displayName?.split(' ')[1] || '',
        role: UserRole.SOLICITANTE, // Rol por defecto
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return {
        success: true,
        data: userData,
        message: 'Inicio de sesión exitoso'
      };
    } catch (error: any) {
      console.error('Error en signIn:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        errorCode: error.code
      };
    }
  }

  /**
   * Registra un nuevo usuario
   */
  static async signUp(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole = UserRole.SOLICITANTE
  ): Promise<ApiResponse<User>> {
    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Actualizar el perfil con el nombre
      await updateProfile(firebaseUser, {
        displayName: `${firstName} ${lastName}`
      });

      // Crear documento del usuario en Firestore
      const userData: Omit<User, 'id'> = {
        email,
        firstName,
        lastName,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return {
        success: true,
        data: { id: firebaseUser.uid, ...userData },
        message: 'Registro exitoso'
      };
    } catch (error: any) {
      console.error('Error en signUp:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code),
        errorCode: error.code
      };
    }
  }

  /**
   * Cierra sesión
   */
  static async signOut(): Promise<ApiResponse<void>> {
    try {
      await signOut(auth);
      return {
        success: true,
        message: 'Sesión cerrada exitosamente'
      };
    } catch (error: any) {
      console.error('Error en signOut:', error);
      return {
        success: false,
        error: 'Error al cerrar sesión'
      };
    }
  }

  /**
   * Obtiene los datos del usuario desde Firestore
   */
  static async getUserData(userId: string): Promise<User> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      throw new Error('Usuario no encontrado');
    }

    const data = userDoc.data();
    return {
      id: userId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      isActive: data.isActive,
      createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt),
    };
  }

  /**
   * Convierte códigos de error de Firebase a mensajes legibles
   */
  static getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No existe un usuario con este email';
      case 'auth/wrong-password':
        return 'Contraseña incorrecta';
      case 'auth/email-already-in-use':
        return 'Ya existe una cuenta con este email';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres';
      case 'auth/invalid-email':
        return 'El email no es válido';
      case 'auth/too-many-requests':
        return 'Demasiados intentos. Intenta más tarde';
      case 'auth/network-request-failed':
        return 'Error de conexión. Verifica tu internet';
      default:
        return 'Error desconocido. Intenta nuevamente';
    }
  }

  /**
   * Obtiene el usuario actual
   */
  static getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  /**
   * Verifica si hay un usuario autenticado
   */
  static isAuthenticated(): boolean {
    return !!auth.currentUser;
  }
}