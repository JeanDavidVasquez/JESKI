/**
 * Email Helper Service
 * Wrapper para llamar a la función de Firebase para enviar emails
 */

import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

type SendQuotationEmailData = {
    type: 'invitation' | 'winner' | 'supplier_selected' | 'quotation_started';
    requestId: string;
    requestCode?: string;
    requestTitle?: string;
    requestDescription?: string;
    supplierIds?: string[];
    supplierId?: string;
    solicitanteEmail?: string;
    dueDate?: string;
    amount?: number;
    currency?: string;
    supplierCount?: number;
};

export const EmailHelperService = {
    /**
     * Enviar email de invitación a cotizar
     */
    async sendQuotationInvitations(
        requestId: string,
        requestCode: string,
        requestTitle: string,
        requestDescription: string,
        supplierIds: string[],
        solicitanteEmail: string,
        dueDate: string
    ): Promise<void> {
        try {
            const sendEmail = httpsCallable<SendQuotationEmailData>(functions, 'sendQuotationEmail');

            // Enviar invitaciones a proveedores
            await sendEmail({
                type: 'invitation',
                requestId,
                requestCode,
                requestTitle,
                requestDescription,
                supplierIds,
                dueDate,
            });

            // Notificar al solicitante
            await sendEmail({
                type: 'quotation_started',
                requestId,
                requestCode,
                requestTitle,
                solicitanteEmail,
                supplierCount: supplierIds.length,
            });
        } catch (error) {
            console.error('Error enviando emails de invitación:', error);
            // No lanzar error para no bloquear el flujo principal
        }
    },

    /**
     * Enviar email de ganador seleccionado
     */
    async sendWinnerNotifications(
        requestId: string,
        requestCode: string,
        requestTitle: string,
        supplierId: string,
        solicitanteEmail: string,
        amount: number,
        currency: string
    ): Promise<void> {
        try {
            const sendEmail = httpsCallable<SendQuotationEmailData>(functions, 'sendQuotationEmail');

            // Notificar al proveedor ganador
            await sendEmail({
                type: 'winner',
                requestId,
                requestCode,
                requestTitle,
                supplierId,
                amount,
                currency,
            });

            // Notificar al solicitante
            await sendEmail({
                type: 'supplier_selected',
                requestId,
                requestCode,
                requestTitle,
                supplierId,
                solicitanteEmail,
                amount,
                currency,
            });
        } catch (error) {
            console.error('Error enviando emails de ganador:', error);
            // No lanzar error para no bloquear el flujo principal
        }
    },
};
