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
import { User } from '../types';

/**
 * User Approval Service
 * Manages user approval workflow for SOLICITANTE role
 */

/**
 * Get all users pending approval
 * Only returns users with approved: false or undefined
 */
export const getUsersPendingApproval = async (): Promise<User[]> => {
    try {
        const usersRef = collection(db, 'users');
        const q = query(
            usersRef,
            where('approved', '==', false)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as User));
    } catch (error) {
        console.error('Error fetching pending users:', error);
        throw error;
    }
};

/**
 * Approve a user
 * Sets approved: true and records who approved and when
 */
export const approveUser = async (
    userId: string,
    managerId: string
): Promise<void> => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            approved: true,
            approvedBy: managerId,
            approvedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error approving user:', error);
        throw error;
    }
};

/**
 * Reject a user (optional: could also delete the user)
 * For now, we'll keep them in DB but mark as rejected
 */
export const rejectUser = async (
    userId: string,
    reason: string
): Promise<void> => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            approved: false,
            rejectionReason: reason,
            rejectedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error rejecting user:', error);
        throw error;
    }
};

/**
 * Get all approved users
 */
export const getApprovedUsers = async (): Promise<User[]> => {
    try {
        const usersRef = collection(db, 'users');
        const q = query(
            usersRef,
            where('approved', '==', true)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as User));
    } catch (error) {
        console.error('Error fetching approved users:', error);
        throw error;
    }
};
