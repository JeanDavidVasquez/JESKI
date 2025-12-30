import {
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { User, UserRole, UserStatus, ApiResponse } from '../types';

/**
 * Servicio para gestión de usuarios (Admin/Gestor)
 */
export class UserService {

    /**
     * Obtiene lista de usuarios por estado y/o rol
     */
    static async getUsers(role?: UserRole, status?: UserStatus): Promise<User[]> {
        try {
            const usersRef = collection(db, 'users');
            let q = query(usersRef);

            if (role) {
                q = query(q, where('role', '==', role));
            }

            if (status) {
                q = query(q, where('status', '==', status));
            }

            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    email: data.email,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    role: data.role,
                    status: data.status || (data.isActive ? UserStatus.ACTIVE : UserStatus.DISABLED),
                    isActive: data.isActive,
                    createdAt: data.createdAt?.toDate?.() || new Date(),
                    updatedAt: data.updatedAt?.toDate?.() || new Date(),
                    ...data
                } as User;
            });
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    }

    /**
     * Obtiene proveedores pendientes de aprobación
     */
    static async getPendingSuppliers(): Promise<User[]> {
        return this.getUsers(UserRole.PROVEEDOR, UserStatus.PENDING);
    }

    /**
     * Aprueba un proveedor (cambia estado a ACTIVO)
     */
    static async approveSupplier(userId: string): Promise<ApiResponse<void>> {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                status: UserStatus.ACTIVE,
                isActive: true,
                updatedAt: serverTimestamp()
            });

            return { success: true, message: 'Proveedor aprobado exitosamente' };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}
