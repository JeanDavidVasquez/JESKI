import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, AuthService } from '../services';
import { User, AuthState, ApiResponse } from '../types';

/**
 * Tipos para el contexto de autenticación
 */
export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<ApiResponse<User>>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<ApiResponse<User>>;
  signOut: () => Promise<ApiResponse<void>>;
  updateProfile: (data: Partial<User>) => Promise<ApiResponse<void>>;
  clearError: () => void;
}

/**
 * Acciones del reducer
 */
type AuthAction =
  | { type: 'AUTH_LOADING'; payload: boolean }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_SIGNOUT' }
  | { type: 'CLEAR_ERROR' };

/**
 * Reducer para el estado de autenticación
 */
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_LOADING':
      return {
        ...state,
        isLoading: action.payload,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_SIGNOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

/**
 * Estado inicial
 */
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

/**
 * Contexto de autenticación
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Proveedor del contexto de autenticación
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * Efecto para escuchar cambios en el estado de autenticación
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      dispatch({ type: 'AUTH_LOADING', payload: true });

      if (firebaseUser) {
        try {
          const userData = await AuthService.getUserData(firebaseUser.uid);

          // Check approval status (null/undefined = legacy users, considered approved)
          const isApproved = userData.approved !== false;

          if (!isApproved) {
            // User not approved, force sign out and show message
            await auth.signOut();
            dispatch({
              type: 'AUTH_ERROR',
              payload: 'Tu cuenta está pendiente de aprobación. Un gestor revisará tu solicitud pronto. Recibirás confirmación cuando sea aprobada.'
            });
            return;
          }

          // User is approved, proceed normally
          dispatch({ type: 'AUTH_SUCCESS', payload: userData });
        } catch (error) {
          dispatch({ type: 'AUTH_ERROR', payload: 'Error al cargar datos del usuario' });
        }
      } else {
        dispatch({ type: 'AUTH_SIGNOUT' });
      }
    });

    return unsubscribe;
  }, []);

  /**
   * Función para iniciar sesión
   */
  const signIn = async (email: string, password: string): Promise<ApiResponse<User>> => {
    dispatch({ type: 'AUTH_LOADING', payload: true });

    try {
      const result = await AuthService.signIn(email, password);

      if (result.success && result.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: result.data });
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: result.error || 'Error de autenticación' });
      }

      return result;
    } catch (error) {
      const errorMessage = 'Error inesperado durante el inicio de sesión';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Función para registrarse
   */
  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<ApiResponse<User>> => {
    dispatch({ type: 'AUTH_LOADING', payload: true });

    try {
      const result = await AuthService.signUp(email, password, firstName, lastName);

      if (result.success && result.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: result.data });
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: result.error || 'Error de registro' });
      }

      return result;
    } catch (error) {
      const errorMessage = 'Error inesperado durante el registro';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Función para cerrar sesión
   */
  const signOut = async (): Promise<ApiResponse<void>> => {
    dispatch({ type: 'AUTH_LOADING', payload: true });

    try {
      const result = await AuthService.signOut();
      dispatch({ type: 'AUTH_SIGNOUT' });
      return result;
    } catch (error) {
      const errorMessage = 'Error al cerrar sesión';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Actualiza el perfil del usuario
   */
  const updateProfile = async (data: Partial<User>): Promise<ApiResponse<void>> => {
    // No activamos loading global para no parpadear toda la app, 
    // pero actualizamos el estado al finalizar
    try {
      if (!state.user?.id) throw new Error('No hay sesión activa');

      await AuthService.updateUser(state.user.id, data);

      // Actualizar estado local
      const updatedUser = { ...state.user, ...data };
      dispatch({ type: 'AUTH_SUCCESS', payload: updatedUser });

      return { success: true, message: 'Perfil actualizado' };
    } catch (error: any) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message || 'Error al actualizar perfil' };
    }
  };

  /**
   * Función para limpiar errores
   */
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    updateProfile,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// El hook useAuth ha sido movido a src/hooks/useAuth.ts
// para cumplir con la arquitectura de separación de capas.