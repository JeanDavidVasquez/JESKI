import { useContext } from 'react';
import { AuthContext, AuthContextType } from '../context/AuthContext';

/**
 * [CONEXIÓN: NODO DATABASE & APP SERVER]
 * Hook personalizado para acceder a la lógica de autenticación.
 * Abstrae el acceso al Contexto de Autenticación.
 * 
 * @returns {AuthContextType} El contexto de autenticación (user, signIn, signOut, etc.)
 * @throws {Error} Si se usa fuera de un AuthProvider
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }

    return context;
};
