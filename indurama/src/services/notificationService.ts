/**
 * NotificationService - Manejo de notificaciones in-app
 */
import { db } from './firebaseConfig';
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    limit,
    writeBatch,
} from 'firebase/firestore';
import { AppNotification, NotificationType } from '../types';

const NOTIFICATIONS_COLLECTION = 'notifications';

export const NotificationService = {
    /**
     * Crear una nueva notificación
     */
    async create(data: {
        userId: string;
        type: NotificationType;
        title: string;
        message: string;
        relatedId?: string;
        relatedType?: 'request' | 'quotation' | 'invitation';
    }): Promise<string> {
        const notification: Omit<AppNotification, 'id'> = {
            ...data,
            read: false,
            createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), notification);
        return docRef.id;
    },

    /**
     * Obtener notificaciones de un usuario
     */
    async getUserNotifications(userId: string, limitCount: number = 50): Promise<AppNotification[]> {
        // Query without orderBy to avoid index issues or missing fields filtering
        const q = query(
            collection(db, NOTIFICATIONS_COLLECTION),
            where('userId', '==', userId)
        );
        const snapshot = await getDocs(q);

        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));

        // Sort client-side
        docs.sort((a, b) => {
            const getTime = (date: any) => {
                if (!date) return 0;
                if (date.seconds) return date.seconds; // Firestore Timestamp
                if (date.getTime) return date.getTime() / 1000; // JS Date
                return 0;
            };
            return getTime(b.createdAt) - getTime(a.createdAt);
        });

        return docs.slice(0, limitCount);
    },

    /**
     * Obtener contador de notificaciones no leídas
     */
    async getUnreadCount(userId: string): Promise<number> {
        const q = query(
            collection(db, NOTIFICATIONS_COLLECTION),
            where('userId', '==', userId),
            where('read', '==', false)
        );
        const snapshot = await getDocs(q);
        return snapshot.size;
    },

    /**
     * Marcar notificación como leída
     */
    async markAsRead(notificationId: string): Promise<void> {
        await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId), {
            read: true,
        });
    },

    /**
     * Marcar todas las notificaciones de un usuario como leídas
     */
    async markAllAsRead(userId: string): Promise<void> {
        const q = query(
            collection(db, NOTIFICATIONS_COLLECTION),
            where('userId', '==', userId),
            where('read', '==', false)
        );
        const snapshot = await getDocs(q);

        const batch = writeBatch(db);
        snapshot.docs.forEach(d => {
            batch.update(d.ref, { read: true });
        });
        await batch.commit();
    },

    /**
     * Obtener notificaciones no leídas (para polling)
     */
    async getUnreadNotifications(userId: string): Promise<AppNotification[]> {
        const q = query(
            collection(db, NOTIFICATIONS_COLLECTION),
            where('userId', '==', userId),
            where('read', '==', false)
            // orderBy removed
        );
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));

        // Sort client-side
        docs.sort((a, b) => {
            const getTime = (date: any) => {
                if (!date) return 0;
                if (date.seconds) return date.seconds;
                if (date.getTime) return date.getTime() / 1000;
                return 0;
            };
            return getTime(b.createdAt) - getTime(a.createdAt);
        });

        return docs;
    },
};
