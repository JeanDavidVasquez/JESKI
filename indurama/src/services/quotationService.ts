/**
 * QuotationService - Manejo de invitaciones y cotizaciones
 */
import { db } from './firebaseConfig';
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp,
    writeBatch,
    onSnapshot,
    Unsubscribe,
} from 'firebase/firestore';
import {
    QuotationInvitation,
    Quotation,
    QuotationComment,
    QuotationInvitationStatus,
} from '../types';
import { NotificationService } from './notificationService';
import { EmailHelperService } from './emailHelperService';

const INVITATIONS_COLLECTION = 'quotation_invitations';
const QUOTATIONS_COLLECTION = 'quotations';
const COMMENTS_COLLECTION = 'quotation_comments';

export const QuotationService = {
    // ============================================
    // INVITATIONS
    // ============================================

    /**
     * Enviar invitaciones a múltiples proveedores para cotizar una solicitud
     */
    async sendInvitations(
        requestId: string,
        supplierIds: string[],
        gestorId: string,
        dueDate: Date,
        message?: string,
        deliveryAddress?: string
    ): Promise<string[]> {
        const invitationIds: string[] = [];

        for (const supplierId of supplierIds) {
            // Build invitation object, excluding undefined values (Firebase doesn't allow undefined)
            const invitation: Record<string, any> = {
                requestId,
                supplierId,
                gestorId,
                status: 'pending',
                dueDate: Timestamp.fromDate(dueDate),
                createdAt: serverTimestamp(),
            };

            // Only add optional fields if they have values
            if (message) invitation.message = message;
            if (deliveryAddress) invitation.deliveryAddress = deliveryAddress;

            const docRef = await addDoc(collection(db, INVITATIONS_COLLECTION), invitation);
            invitationIds.push(docRef.id);

            // Enviar notificación al proveedor
            await NotificationService.create({
                userId: supplierId,
                type: 'quotation_invitation',
                title: 'Nueva Invitación a Cotizar',
                message: `Has sido invitado a cotizar para la solicitud #${requestId.slice(-6).toUpperCase()}`,
                relatedId: requestId,
                relatedType: 'request',
            });
        }

        // Actualizar estado de la solicitud a 'cotizacion'
        await updateDoc(doc(db, 'requests', requestId), {
            status: 'quoting',
            quotationStartedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        // Enviar emails de invitación (no bloqueante)
        try {
            const requestDoc = await getDoc(doc(db, 'requests', requestId));
            if (requestDoc.exists()) {
                const requestData = requestDoc.data();
                await EmailHelperService.sendQuotationInvitations(
                    requestId,
                    requestData.code || 'N/A',
                    requestData.title || 'Sin título',
                    requestData.description || '',
                    supplierIds,
                    requestData.userEmail || '',
                    dueDate.toLocaleDateString('es-ES')
                );
            }
        } catch (emailError) {
            console.error('Error enviando emails de invitación:', emailError);
            // No fallar la operación principal si falla el email
        }

        return invitationIds;
    },

    /**
     * Obtener invitaciones pendientes de un proveedor
     */
    async getProviderInvitations(supplierId: string): Promise<QuotationInvitation[]> {
        const q = query(
            collection(db, INVITATIONS_COLLECTION),
            where('supplierId', '==', supplierId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as QuotationInvitation));
    },

    /**
     * Obtener invitaciones de una solicitud
     */
    async getRequestInvitations(requestId: string): Promise<QuotationInvitation[]> {
        const q = query(
            collection(db, INVITATIONS_COLLECTION),
            where('requestId', '==', requestId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as QuotationInvitation));
    },

    /**
     * Marcar invitación como vista
     */
    async markInvitationViewed(invitationId: string): Promise<void> {
        await updateDoc(doc(db, INVITATIONS_COLLECTION, invitationId), {
            status: 'viewed',
            viewedAt: serverTimestamp(),
        });
    },

    /**
     * Declinar invitación
     */
    async declineInvitation(invitationId: string): Promise<void> {
        await updateDoc(doc(db, INVITATIONS_COLLECTION, invitationId), {
            status: 'declined',
        });
    },

    // ============================================
    // QUOTATIONS
    // ============================================

    /**
     * Enviar una cotización/oferta
     */
    async submitQuotation(
        invitationId: string,
        supplierId: string,
        supplierName: string,
        data: {
            totalAmount: number;
            currency: 'USD' | 'EUR';
            deliveryDays: number;
            paymentTerms: string;
            validUntil: Date;
            notes?: string;
            attachments?: string[];
        }
    ): Promise<string> {
        // Obtener la invitación para saber el requestId
        const invDoc = await getDoc(doc(db, INVITATIONS_COLLECTION, invitationId));
        if (!invDoc.exists()) throw new Error('Invitación no encontrada');

        const invitation = invDoc.data() as QuotationInvitation;

        const quotation: Omit<Quotation, 'id'> = {
            invitationId,
            requestId: invitation.requestId,
            supplierId,
            supplierName,
            totalAmount: data.totalAmount,
            currency: data.currency,
            deliveryDays: data.deliveryDays,
            paymentTerms: data.paymentTerms,
            validUntil: Timestamp.fromDate(data.validUntil),
            notes: data.notes || '',
            attachments: data.attachments || [],
            status: 'submitted',
            isWinner: false,
            submittedAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, QUOTATIONS_COLLECTION), quotation);

        // Actualizar la invitación con el ID de la cotización
        await updateDoc(doc(db, INVITATIONS_COLLECTION, invitationId), {
            status: 'quoted',
            quotationId: docRef.id,
        });

        // Notificar al gestor
        await NotificationService.create({
            userId: invitation.gestorId,
            type: 'quotation_received',
            title: 'Cotización Recibida',
            message: `${supplierName} envió su cotización para la solicitud #${invitation.requestId.slice(-6).toUpperCase()}`,
            relatedId: invitation.requestId,
            relatedType: 'request',
        });

        return docRef.id;
    },

    /**
     * Actualizar una cotización existente
     */
    async updateQuotation(
        quotationId: string,
        data: Partial<Quotation>
    ): Promise<void> {
        // Validar integridad básica (opcionalmente se podrían añadir más chequeos aquí)
        await updateDoc(doc(db, QUOTATIONS_COLLECTION, quotationId), {
            ...data,
            updatedAt: serverTimestamp(),
            status: 'submitted', // Asegurar que vuelva a submitted si estaba en otro estado (o mantener)
        });
    },

    /**
     * Cancelar una cotización
     */
    async cancelQuotation(quotationId: string, invitationId: string): Promise<void> {
        // Marcar cotización como cancelada
        await updateDoc(doc(db, QUOTATIONS_COLLECTION, quotationId), {
            status: 'cancelled',
            updatedAt: serverTimestamp(),
        });

        // Revertir invitación a 'viewed' para permitir acciones futuras si es necesario
        // Nota: Mantenemos el quotationId en la invitación para historial, 
        // pero el estado 'viewed' indica que no hay oferta activa vigente.
        await updateDoc(doc(db, INVITATIONS_COLLECTION, invitationId), {
            status: 'viewed',
        });
    },

    /**
     * Obtener cotizaciones de una solicitud
     */
    async getRequestQuotations(requestId: string): Promise<Quotation[]> {
        const q = query(
            collection(db, QUOTATIONS_COLLECTION),
            where('requestId', '==', requestId),
            orderBy('submittedAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Quotation));
    },

    /**
     * Obtener cotizaciones de un proveedor
     */
    async getProviderQuotations(supplierId: string): Promise<Quotation[]> {
        const q = query(
            collection(db, QUOTATIONS_COLLECTION),
            where('supplierId', '==', supplierId),
            orderBy('submittedAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Quotation));
    },

    /**
     * Calcular ranking de cotizaciones
     */
    calculateRanking(quotations: Quotation[], supplierScores: Record<string, number>): Quotation[] {
        if (quotations.length === 0) return [];

        const minPrice = Math.min(...quotations.map(q => q.totalAmount));
        const minDays = Math.min(...quotations.map(q => q.deliveryDays));

        return quotations.map(q => {
            const priceScore = minPrice > 0 ? (minPrice / q.totalAmount) * 40 : 0;
            const deliveryScore = minDays > 0 ? (minDays / q.deliveryDays) * 30 : 0;
            const epiScore = ((supplierScores[q.supplierId] || 0) / 100) * 20;
            const baseHistoryScore = 10; // Simplificado por ahora

            const rankingScore = priceScore + deliveryScore + epiScore + baseHistoryScore;

            return { ...q, rankingScore: Math.round(rankingScore * 100) / 100 };
        }).sort((a, b) => (b.rankingScore || 0) - (a.rankingScore || 0));
    },

    /**
     * Seleccionar cotización ganadora
     */
    async selectWinner(
        quotationId: string,
        requestId: string,
        solicitanteId: string
    ): Promise<void> {
        // Obtener la cotización ganadora
        const quotationDoc = await getDoc(doc(db, QUOTATIONS_COLLECTION, quotationId));
        if (!quotationDoc.exists()) throw new Error('Cotización no encontrada');

        const winner = quotationDoc.data() as Quotation;

        // Marcar como ganadora
        await updateDoc(doc(db, QUOTATIONS_COLLECTION, quotationId), {
            status: 'selected',
            isWinner: true,
            selectedAt: serverTimestamp(),
        });

        // Marcar las demás como rechazadas
        const allQuotations = await this.getRequestQuotations(requestId);
        for (const q of allQuotations) {
            if (q.id !== quotationId) {
                await updateDoc(doc(db, QUOTATIONS_COLLECTION, q.id), {
                    status: 'rejected',
                });

                // Notificar a los no seleccionados
                await NotificationService.create({
                    userId: q.supplierId,
                    type: 'quotation_not_selected',
                    title: 'Resultado de Cotización',
                    message: `Gracias por participar en la solicitud #${requestId.slice(-6).toUpperCase()}. En esta ocasión se seleccionó otra oferta.`,
                    relatedId: requestId,
                    relatedType: 'request',
                });
            }
        }

        // Notificar al ganador
        await NotificationService.create({
            userId: winner.supplierId,
            type: 'quotation_winner',
            title: '🏆 ¡Felicitaciones!',
            message: `Tu oferta fue seleccionada para la solicitud #${requestId.slice(-6).toUpperCase()}`,
            relatedId: requestId,
            relatedType: 'request',
        });

        // Notificar al solicitante
        await NotificationService.create({
            userId: solicitanteId,
            type: 'supplier_selected',
            title: 'Proveedor Seleccionado',
            message: `Se seleccionó a ${winner.supplierName} para tu solicitud #${requestId.slice(-6).toUpperCase()}`,
            relatedId: requestId,
            relatedType: 'request',
        });

        // Actualizar estado de la solicitud
        await updateDoc(doc(db, 'requests', requestId), {
            status: 'awarded',
            winnerId: winner.supplierId,
            winnerQuotationId: quotationId,
            winnerAmount: winner.totalAmount,
            winnerDeliveryDays: winner.deliveryDays,
            adjudicatedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        // Enviar emails de ganador (no bloqueante)
        try {
            const requestDoc = await getDoc(doc(db, 'requests', requestId));
            if (requestDoc.exists()) {
                const requestData = requestDoc.data();
                await EmailHelperService.sendWinnerNotifications(
                    requestId,
                    requestData.code || 'N/A',
                    requestData.title || 'Sin título',
                    winner.supplierId,
                    requestData.userEmail || '',
                    winner.totalAmount,
                    winner.currency
                );
            }
        } catch (emailError) {
            console.error('Error enviando emails de ganador:', emailError);
            // No fallar la operación principal si falla el email
        }
    },

    // ============================================
    // COMMENTS / Q&A
    // ============================================

    /**
     * Agregar un comentario
     */
    async addComment(comment: Omit<QuotationComment, 'id' | 'createdAt' | 'read'>): Promise<string> {
        // Remove undefined values to prevent Firestore errors
        const cleanComment = Object.entries(comment).reduce((acc, [key, value]) => {
            if (value !== undefined) {
                acc[key] = value;
            }
            return acc;
        }, {} as any);

        const docRef = await addDoc(collection(db, COMMENTS_COLLECTION), {
            ...cleanComment,
            createdAt: serverTimestamp(),
            read: false,
        });
        return docRef.id;
    },

    /**
     * Obtener comentarios de una conversación (solicitud - proveedor)
     */
    async getComments(requestId: string, supplierId: string): Promise<QuotationComment[]> {
        const q = query(
            collection(db, COMMENTS_COLLECTION),
            where('requestId', '==', requestId),
            where('supplierId', '==', supplierId),
            orderBy('createdAt', 'asc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as QuotationComment));
    },

    /**
     * Suscribirse a comentarios de una conversación (Real-time)
     */
    subscribeToComments(requestId: string, supplierId: string, callback: (comments: QuotationComment[]) => void): Unsubscribe {
        const q = query(
            collection(db, COMMENTS_COLLECTION),
            where('requestId', '==', requestId),
            where('supplierId', '==', supplierId),
            orderBy('createdAt', 'asc')
        );

        return onSnapshot(q, (snapshot) => {
            const comments = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as QuotationComment));
            callback(comments);
        }, (error) => {
            console.error("Error subscribing to comments:", error);
        });
    },

    /**
     * Marcar comentarios como leídos
     */
    async markCommentsAsRead(requestId: string, supplierId: string, authorRoleToRead: 'gestor' | 'proveedor'): Promise<void> {
        const q = query(
            collection(db, COMMENTS_COLLECTION),
            where('requestId', '==', requestId),
            where('supplierId', '==', supplierId),
            where('authorRole', '==', authorRoleToRead),
            where('read', '==', false)
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) return;

        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { read: true });
        });

        await batch.commit();
    },
};
