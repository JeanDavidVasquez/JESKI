import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Request, RequestStatus } from '../types';

/**
 * Request Service
 * Manages requests/solicitudes from Firebase
 */

/**
 * Get all requests
 */
export const getAllRequests = async (): Promise<Request[]> => {
    try {
        const requestsRef = collection(db, 'requests');
        const q = query(
            requestsRef,
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Request));
    } catch (error) {
        console.error('Error fetching all requests:', error);
        throw error;
    }
};

/**
 * Get requests by status
 */
export const getRequestsByStatus = async (status: string): Promise<Request[]> => {
    try {
        const requestsRef = collection(db, 'requests');
        const q = query(
            requestsRef,
            where('status', '==', status),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Request));
    } catch (error) {
        console.error(`Error fetching requests with status ${status}:`, error);
        throw error;
    }
};

/**
 * Get recent requests (limited)
 */
export const getRecentRequests = async (limitCount: number = 5): Promise<Request[]> => {
    try {
        const requestsRef = collection(db, 'requests');
        const q = query(
            requestsRef,
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Request));
    } catch (error) {
        console.error('Error fetching recent requests:', error);
        throw error;
    }
};

/**
 * Get request by ID
 */
export const getRequestById = async (requestId: string): Promise<Request | null> => {
    try {
        const requestRef = doc(db, 'requests', requestId);
        const snapshot = await getDoc(requestRef);

        if (snapshot.exists()) {
            return {
                id: snapshot.id,
                ...snapshot.data()
            } as Request;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching request ${requestId}:`, error);
        throw error;
    }
};

/**
 * Get request statistics
 */
export const getRequestStats = async (): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    rejected: number;
}> => {
    try {
        const requestsRef = collection(db, 'requests');
        const snapshot = await getDocs(requestsRef);

        const stats = {
            total: 0,
            pending: 0,
            inProgress: 0,
            completed: 0,
            rejected: 0
        };

        snapshot.docs.forEach(doc => {
            stats.total++;
            const data = doc.data();
            const status = data.status;

            if (status === RequestStatus.PENDING) {
                stats.pending++;
            } else if (status === RequestStatus.IN_PROGRESS) {
                stats.inProgress++;
            } else if (status === RequestStatus.COMPLETED) {
                stats.completed++;
            } else if (status === RequestStatus.REJECTED) {
                stats.rejected++;
            }
        });

        return stats;
    } catch (error) {
        console.error('Error fetching request stats:', error);
        throw error;
    }
};

/**
 * Update request status
 */
export const updateRequestStatus = async (
    requestId: string,
    status: string,
    managerId: string,
    comment?: string // Optional comment
): Promise<void> => {
    try {
        const requestRef = doc(db, 'requests', requestId);
        const updateData: any = {
            status,
            reviewedBy: managerId,
            reviewedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        if (comment) {
            updateData.rectificationComment = comment;
        }

        if (status === RequestStatus.COMPLETED) {
            updateData.completedAt = serverTimestamp();
        }

        await updateDoc(requestRef, updateData);
    } catch (error) {
        console.error(`Error updating request ${requestId} status:`, error);
        throw error;
    }
};

/**
 * Assign request to manager
 */
export const assignRequest = async (
    requestId: string,
    managerId: string
): Promise<void> => {
    try {
        const requestRef = doc(db, 'requests', requestId);
        await updateDoc(requestRef, {
            assignedTo: managerId,
            status: RequestStatus.IN_PROGRESS,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error(`Error assigning request ${requestId}:`, error);
        throw error;
    }
};

/**
 * Format Firestore timestamp to relative time string
 */
export const getRelativeTime = (timestamp: any): string => {
    if (!timestamp) return '';

    const now = new Date();
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return `Hace ${Math.floor(diffDays / 30)} meses`;
};

/**
 * Generate unique request code
 */
export const generateRequestCode = (): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `REQ-${year}${month}-${random}`;
};

/**
 * Get all requests for a specific user
 */
export const getUserRequests = async (userId: string): Promise<Request[]> => {
    try {
        const requestsRef = collection(db, 'requests');
        const q = query(
            requestsRef,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Request));
    } catch (error) {
        console.error(`Error fetching requests for user ${userId}:`, error);
        throw error;
    }
};

/**
 * Get request statistics for a specific user
 */
export const getUserRequestStats = async (userId: string): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    rejected: number;
}> => {
    try {
        const requests = await getUserRequests(userId);

        const stats = {
            total: requests.length,
            pending: 0,
            inProgress: 0,
            completed: 0,
            rejected: 0
        };

        requests.forEach(req => {
            const status = req.status;
            if (status === RequestStatus.PENDING || status === RequestStatus.RECTIFICATION_REQUIRED) {
                stats.pending++;
            } else if (status === RequestStatus.IN_PROGRESS || status === RequestStatus.QUOTING || (status as string) === 'cotizacion') {
                stats.inProgress++;
            } else if (status === RequestStatus.COMPLETED || status === RequestStatus.AWARDED || (status as string) === 'adjudicado') {
                stats.completed++;
            } else if (status === RequestStatus.REJECTED) {
                stats.rejected++;
            }
        });

        return stats;
    } catch (error) {
        console.error(`Error fetching stats for user ${userId}:`, error);
        throw error;
    }
};
