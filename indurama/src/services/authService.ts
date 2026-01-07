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
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { User, UserRole, UserStatus, ApiResponse } from '../types';

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
          status: UserStatus.ACTIVE,
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
          status: UserStatus.ACTIVE,
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
          status: UserStatus.ACTIVE,
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
          status: UserStatus.ACTIVE,
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
          status: UserStatus.ACTIVE,
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

      // Intentar obtener datos extendidos desde Firestore
      let firestoreData = {};
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          firestoreData = userDocSnap.data();
        }
      } catch (firestoreError) {
        console.warn('Error al obtener datos de Firestore:', firestoreError);
      }

      // Combinar datos de Auth y Firestore
      // Priorizar Firestore para el rol
      const userData: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || email,
        firstName: (firestoreData as any).firstName || firebaseUser.displayName?.split(' ')[0] || 'Usuario',
        lastName: (firestoreData as any).lastName || firebaseUser.displayName?.split(' ')[1] || '',
        role: (firestoreData as any).role || UserRole.SOLICITANTE,
        status: (firestoreData as any).status || UserStatus.ACTIVE,
        isActive: (firestoreData as any).isActive !== undefined ? (firestoreData as any).isActive : true,
        companyName: (firestoreData as any).companyName,
        phone: (firestoreData as any).phone,
        department: (firestoreData as any).department,
        position: (firestoreData as any).position,
        // Approval fields - CRITICAL for blocking unapproved users
        approved: (firestoreData as any).approved,
        approvedBy: (firestoreData as any).approvedBy,
        approvedAt: (firestoreData as any).approvedAt,
        createdAt: ((firestoreData as any).createdAt?.toDate && (firestoreData as any).createdAt.toDate()) || new Date(),
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
    role: UserRole = UserRole.SOLICITANTE,
    additionalData?: { companyName?: string; phone?: string; category?: string;[key: string]: any }
  ): Promise<ApiResponse<User>> {
    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Actualizar el perfil con el nombre
      await updateProfile(firebaseUser, {
        displayName: `${firstName} ${lastName}`
      });

      // --- LOGIC TO MERGE INVITED USER DATA ---
      let extraData = {};
      try {
        const { collection, query, where, getDocs, deleteDoc } = require('firebase/firestore');
        const q = query(collection(db, 'users'), where('email', '==', email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const inviteDoc = querySnapshot.docs[0];
          const inviteData = inviteDoc.data();
          console.log('Found invited user data:', inviteData);
          extraData = {
            companyName: inviteData.companyName || '',
            category: inviteData.category || '',
            phone: inviteData.phone || '',
            role: inviteData.role || role // Keep invited role
          };
          // Delete the temporary invite doc to avoid duplicates
          await deleteDoc(inviteDoc.ref);
        }
      } catch (e) {
        console.log('Error checking for invites:', e);
      }
      // ----------------------------------------

      // Crear documento del usuario en Firestore
      const initialStatus = role === UserRole.PROVEEDOR ? UserStatus.ACTIVE : UserStatus.ACTIVE; // Auto-activate for demo? Or PENDING? 
      // Let's set it to ACTIVE if they were invited, otherwise PENDING? 
      // For now, let's stick to default behavior but if extraData exists, maybe they are already 'reviewed'?
      // Let's keep it simple:

      const userData: Omit<User, 'id'> = {
        email,
        firstName,
        lastName,
        role: (extraData as any).role || role,
        status: initialStatus,
        isActive: initialStatus === UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...extraData, // Merge invite data
        ...additionalData,
        // Approval system: MUST be after spreads to not get overwritten
        approved: (role === UserRole.GESTOR || role === UserRole.ADMIN) ? true : false,
        approvedBy: (role === UserRole.GESTOR || role === UserRole.ADMIN) ? 'auto' : null,
        approvedAt: (role === UserRole.GESTOR || role === UserRole.ADMIN) ? serverTimestamp() : null,
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
   * Actualiza los datos del usuario
   */
  static async updateUser(userId: string, data: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      throw error;
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
      status: data.status || (data.isActive ? UserStatus.ACTIVE : UserStatus.DISABLED),
      isActive: data.isActive,
      companyName: data.companyName,
      phone: data.phone,
      department: data.department,
      position: data.position,
      // Approval fields - CRITICAL for approval workflow
      approved: data.approved,
      approvedBy: data.approvedBy,
      approvedAt: data.approvedAt,
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
      case 'auth/requests-from-this-ios-client-application-blocked':
      case 'auth/requests-from-this-ios-client-application-<empty>-are-blocked':
        return 'El API Key de Firebase está restringida. Por favor, revisa la configuración en Google Cloud Console.';
      default:
        if (errorCode?.includes('blocked')) {
          return 'Acceso bloqueado por configuración de seguridad (API Key).';
        }
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