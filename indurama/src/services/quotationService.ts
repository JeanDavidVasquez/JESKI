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
} from '../types';
import { NotificationService } from './notificationService';
import { EmailHelperService } from './emailHelperService';
import i18n from '../i18n/config';

const INVITATIONS_COLLECTION = 'quotation_invitations';
const QUOTATIONS_COLLECTION = 'quotations';
const COMMENTS_COLLECTION = 'quotation_comments';

// --- FUNCIÓN HELPER PARA CALCULAR DÍAS HÁBILES ---
const addBusinessDays = (startDate: Date, days: number): Date => {
    const currentDate = new Date(startDate);
    let addedDays = 0;
    while (addedDays < days) {
        currentDate.setDate(currentDate.getDate() + 1);
        const day = currentDate.getDay(); // 0 = Domingo, 6 = Sábado
        if (day !== 0 && day !== 6) {
            addedDays++;
        }
    }
    return currentDate;
};

export const QuotationService = {
    // ... (MÉTODOS DE INVITATIONS SIN CAMBIOS) ...
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
            const invitation: Record<string, any> = {
                requestId,
                supplierId,
                gestorId,
                status: 'pending',
                dueDate: Timestamp.fromDate(dueDate),
                createdAt: serverTimestamp(),
            };
            if (message) invitation.message = message;
            if (deliveryAddress) invitation.deliveryAddress = deliveryAddress;

            const docRef = await addDoc(collection(db, INVITATIONS_COLLECTION), invitation);
            invitationIds.push(docRef.id);

            await NotificationService.create({
                userId: supplierId,
                type: 'quotation_invitation',
                title: i18n.t('notifications.newInvitation'),
                message: i18n.t('appNotifications.invitationMessage', { code: requestId.slice(-6).toUpperCase() }),
                relatedId: requestId,
                relatedType: 'request',
            });
        }

        await updateDoc(doc(db, 'requests', requestId), {
            status: 'quoting',
            quotationStartedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

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
        }
        return invitationIds;
    },

    async getProviderInvitations(supplierId: string): Promise<QuotationInvitation[]> {
        const q = query(
            collection(db, INVITATIONS_COLLECTION),
            where('supplierId', '==', supplierId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as QuotationInvitation));
    },

    async getRequestInvitations(requestId: string): Promise<QuotationInvitation[]> {
        const q = query(
            collection(db, INVITATIONS_COLLECTION),
            where('requestId', '==', requestId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as QuotationInvitation));
    },

    async markInvitationViewed(invitationId: string): Promise<void> {
        await updateDoc(doc(db, INVITATIONS_COLLECTION, invitationId), {
            status: 'viewed',
            viewedAt: serverTimestamp(),
        });
    },

    async declineInvitation(invitationId: string): Promise<void> {
        await updateDoc(doc(db, INVITATIONS_COLLECTION, invitationId), {
            status: 'declined',
        });
    },

    // ============================================
    // QUOTATIONS (AQUÍ ESTÁN LOS CAMBIOS)
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
        const invDoc = await getDoc(doc(db, INVITATIONS_COLLECTION, invitationId));
        if (!invDoc.exists()) throw new Error('Invitación no encontrada');

        const invitation = invDoc.data() as QuotationInvitation;

        // CALCULAR LA FECHA DE ENTREGA ESTIMADA (Solo días hábiles)
        const calculatedDeliveryDate = addBusinessDays(new Date(), data.deliveryDays);

        const quotation: Omit<Quotation, 'id'> & { deliveryDate: Timestamp } = {
            invitationId,
            requestId: invitation.requestId,
            supplierId,
            supplierName,
            totalAmount: data.totalAmount,
            currency: data.currency,
            deliveryDays: data.deliveryDays, // Se mantiene para referencia del input (ej: "6")
            deliveryDate: Timestamp.fromDate(calculatedDeliveryDate), // AQUI SE GUARDA LA FECHA CALCULADA
            paymentTerms: data.paymentTerms,
            validUntil: Timestamp.fromDate(data.validUntil),
            notes: data.notes || '',
            attachments: data.attachments || [],
            status: 'submitted',
            isWinner: false,
            submittedAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, QUOTATIONS_COLLECTION), quotation);

        await updateDoc(doc(db, INVITATIONS_COLLECTION, invitationId), {
            status: 'quoted',
            quotationId: docRef.id,
        });

        await NotificationService.create({
            userId: invitation.gestorId,
            type: 'quotation_received',
            title: i18n.t('notifications.quotationReceived'),
            message: i18n.t('appNotifications.quotationSubmittedMessage', { supplier: supplierName, code: invitation.requestId.slice(-6).toUpperCase() }),
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
        const cleanData: any = Object.entries(data).reduce((acc, [key, value]) => {
            if (value !== undefined) {
                acc[key] = value;
            }
            return acc;
        }, {} as any);

        // Si se actualizan los días de entrega, recalcular la fecha de entrega
        if (data.deliveryDays !== undefined) {
            const calculatedDeliveryDate = addBusinessDays(new Date(), data.deliveryDays);
            cleanData.deliveryDate = Timestamp.fromDate(calculatedDeliveryDate);
        }

        await updateDoc(doc(db, QUOTATIONS_COLLECTION, quotationId), {
            ...cleanData,
            updatedAt: serverTimestamp(),
            status: 'submitted',
        });
    },

    // ... (RESTO DE LOS MÉTODOS SIN CAMBIOS) ...
    async cancelQuotation(quotationId: string, invitationId: string): Promise<void> {
        await updateDoc(doc(db, QUOTATIONS_COLLECTION, quotationId), {
            status: 'cancelled',
            updatedAt: serverTimestamp(),
        });
        await updateDoc(doc(db, INVITATIONS_COLLECTION, invitationId), {
            status: 'viewed',
        });
    },

    async getRequestQuotations(requestId: string): Promise<Quotation[]> {
        const q = query(
            collection(db, QUOTATIONS_COLLECTION),
            where('requestId', '==', requestId),
            orderBy('submittedAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Quotation));
    },

    async getProviderQuotations(supplierId: string): Promise<Quotation[]> {
        const q = query(
            collection(db, QUOTATIONS_COLLECTION),
            where('supplierId', '==', supplierId),
            orderBy('submittedAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Quotation));
    },

    calculateRanking(quotations: Quotation[], supplierScores: Record<string, number>): Quotation[] {
        if (quotations.length === 0) return [];
        const minPrice = Math.min(...quotations.map(q => q.totalAmount));
        const minDays = Math.min(...quotations.map(q => q.deliveryDays));

        return quotations.map(q => {
            const priceScore = minPrice > 0 ? (minPrice / q.totalAmount) * 40 : 0;
            const deliveryScore = minDays > 0 ? (minDays / q.deliveryDays) * 30 : 0;
            const epiScore = ((supplierScores[q.supplierId] || 0) / 100) * 20;
            const baseHistoryScore = 10;
            const rankingScore = priceScore + deliveryScore + epiScore + baseHistoryScore;
            return { ...q, rankingScore: Math.round(rankingScore * 100) / 100 };
        }).sort((a, b) => (b.rankingScore || 0) - (a.rankingScore || 0));
    },

    async selectWinner(
        quotationId: string,
        requestId: string,
        solicitanteId: string
    ): Promise<void> {
        const quotationDoc = await getDoc(doc(db, QUOTATIONS_COLLECTION, quotationId));
        if (!quotationDoc.exists()) throw new Error('Cotización no encontrada');
        const winner = quotationDoc.data() as Quotation;

        await updateDoc(doc(db, QUOTATIONS_COLLECTION, quotationId), {
            status: 'selected',
            isWinner: true,
            selectedAt: serverTimestamp(),
        });

        const allQuotations = await this.getRequestQuotations(requestId);
        for (const q of allQuotations) {
            if (q.id !== quotationId) {
                await updateDoc(doc(db, QUOTATIONS_COLLECTION, q.id), {
                    status: 'rejected',
                });
                await NotificationService.create({
                    userId: q.supplierId,
                    type: 'quotation_not_selected',
                    title: i18n.t('notifications.quotationResult'),
                    message: i18n.t('notifications.quotationRejectedMessage', { code: requestId.slice(-6).toUpperCase() }),
                    relatedId: requestId,
                    relatedType: 'request',
                });
            }
        }

        await NotificationService.create({
            userId: winner.supplierId,
            type: 'quotation_winner',
            title: i18n.t('notifications.congratulations'),
            message: i18n.t('notifications.quotationWinnerMessage', { code: requestId.slice(-6).toUpperCase() }),
            relatedId: requestId,
            relatedType: 'request',
        });

        await NotificationService.create({
            userId: solicitanteId,
            type: 'supplier_selected',
            title: i18n.t('notifications.supplierSelected'),
            message: i18n.t('appNotifications.providerSelectedMessage', { supplier: winner.supplierName, code: requestId.slice(-6).toUpperCase() }),
            relatedId: requestId,
            relatedType: 'request',
        });

        await updateDoc(doc(db, 'requests', requestId), {
            status: 'awarded',
            winnerId: winner.supplierId,
            winnerQuotationId: quotationId,
            winnerAmount: winner.totalAmount,
            winnerDeliveryDays: winner.deliveryDays,
            adjudicatedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

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
        }
    },

    async addComment(comment: Omit<QuotationComment, 'id' | 'createdAt' | 'read'>): Promise<string> {
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

    /**
     * Re-select a new winner after non-compliance
     * This is used when the original winner didn't deliver
     */
    async reselectWinner(
        quotationId: string,
        requestId: string,
        gestorId: string
    ): Promise<void> {
        const quotationDoc = await getDoc(doc(db, QUOTATIONS_COLLECTION, quotationId));
        if (!quotationDoc.exists()) throw new Error('Cotización no encontrada');
        const newWinner = quotationDoc.data() as Quotation;

        // Get request to find previous winner
        const requestDoc = await getDoc(doc(db, 'requests', requestId));
        if (!requestDoc.exists()) throw new Error('Solicitud no encontrada');
        const requestData = requestDoc.data();

        // Validate the quotation is not from the penalized supplier
        if (newWinner.supplierId === requestData.previousWinnerId) {
            throw new Error('No se puede seleccionar al proveedor penalizado');
        }

        // Update new winning quotation
        await updateDoc(doc(db, QUOTATIONS_COLLECTION, quotationId), {
            status: 'selected',
            isWinner: true,
            selectedAt: serverTimestamp(),
            isReselection: true,
        });

        // Reject other quotations (except the revoked one)
        const allQuotations = await this.getRequestQuotations(requestId);
        for (const q of allQuotations) {
            if (q.id !== quotationId && q.status !== 'revoked') {
                await updateDoc(doc(db, QUOTATIONS_COLLECTION, q.id), {
                    status: 'rejected',
                });
            }
        }

        // Notify new winner
        await NotificationService.create({
            userId: newWinner.supplierId,
            type: 'quotation_winner',
            title: i18n.t('notifications.congratulations'),
            message: i18n.t('appNotifications.quotationWinnerAwarded', { code: requestId.slice(-6).toUpperCase() }),
            relatedId: requestId,
            relatedType: 'request',
        });

        // Update request status back to awarded with new winner
        await updateDoc(doc(db, 'requests', requestId), {
            status: 'awarded',
            winnerId: newWinner.supplierId,
            winnerQuotationId: quotationId,
            winnerAmount: newWinner.totalAmount,
            winnerDeliveryDays: newWinner.deliveryDays,
            adjudicatedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        console.log(`Reselection complete: ${newWinner.supplierName} for request ${requestId}`);
    },

    /**
     * Get eligible quotations for reselection (excludes penalized supplier)
     */
    async getEligibleQuotationsForReselection(requestId: string): Promise<Quotation[]> {
        const requestDoc = await getDoc(doc(db, 'requests', requestId));
        if (!requestDoc.exists()) return [];

        const requestData = requestDoc.data();
        const previousWinnerId = requestData.previousWinnerId;

        const allQuotations = await this.getRequestQuotations(requestId);

        // Filter out revoked quotation and any from the penalized supplier
        return allQuotations.filter(q =>
            q.status !== 'revoked' &&
            q.supplierId !== previousWinnerId
        );
    },
};