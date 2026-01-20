import { collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { SupplierEvaluation, SupplierResponse, SupplierProgress } from '../types/evaluation';
import { EpiService } from './epiService';
import { ScoringService } from './scoringService';

const COLLECTION_NAME = 'supplier_evaluations';

/**
 * Servicio para guardar y obtener respuestas de proveedores
 */
export const SupplierResponseService = {
    /**
     * Guarda o actualiza una respuesta individual
     * @param supplierId - ID del proveedor
     * @param response - Respuesta a guardar
     */
    async saveResponse(supplierId: string, response: SupplierResponse): Promise<void> {
        try {
            const evalRef = doc(db, COLLECTION_NAME, supplierId);

            // Obtener evaluación existente o crear una nueva
            const evalDoc = await getDoc(evalRef);

            if (evalDoc.exists()) {
                // Actualizar la respuesta existente
                const currentEval = evalDoc.data() as SupplierEvaluation;
                const existingResponseIndex = currentEval.responses.findIndex(
                    r => r.questionId === response.questionId
                );

                let updatedResponses: SupplierResponse[];
                if (existingResponseIndex >= 0) {
                    // Reemplazar respuesta existente
                    updatedResponses = [...currentEval.responses];
                    updatedResponses[existingResponseIndex] = response;
                } else {
                    // Agregar nueva respuesta
                    updatedResponses = [...currentEval.responses, response];
                }

                // Recalcular scores y progreso
                const config = await EpiService.getEpiConfig();
                const calidadScore = ScoringService.calculateCategoryScore(
                    config.calidad.sections,
                    updatedResponses,
                    'calidad'
                );
                const abastecimientoScore = ScoringService.calculateCategoryScore(
                    config.abastecimiento.sections,
                    updatedResponses,
                    'abastecimiento'
                );
                const globalScore = ScoringService.calculateGlobalScore(calidadScore, abastecimientoScore);
                const classification = ScoringService.getClassification(globalScore);
                const progress = ScoringService.calculateProgress(config, updatedResponses);

                await updateDoc(evalRef, {
                    responses: updatedResponses,
                    calidadScore,
                    abastecimientoScore,
                    globalScore,
                    classification,
                    progress,
                    updatedAt: Date.now(),
                    status: 'in_progress'
                });
            } else {
                // Crear nueva evaluación
                const config = await EpiService.getEpiConfig();
                const responses = [response];
                const calidadScore = ScoringService.calculateCategoryScore(
                    config.calidad.sections,
                    responses,
                    'calidad'
                );
                const abastecimientoScore = ScoringService.calculateCategoryScore(
                    config.abastecimiento.sections,
                    responses,
                    'abastecimiento'
                );
                const globalScore = ScoringService.calculateGlobalScore(calidadScore, abastecimientoScore);
                const classification = ScoringService.getClassification(globalScore);
                const progress = ScoringService.calculateProgress(config, responses);

                const newEval: SupplierEvaluation = {
                    supplierId,
                    responses,
                    calidadScore,
                    abastecimientoScore,
                    globalScore,
                    classification,
                    progress,
                    status: 'in_progress',
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };

                await setDoc(evalRef, newEval);
            }
        } catch (error) {
            console.error('Error saving response:', error);
            throw error;
        }
    },

    /**
     * Obtiene la evaluación completa de un proveedor
     * CORREGIDO: Ahora busca primero en supplier_evaluations, luego intenta epi_submissions
     * @param supplierId - ID del proveedor
     * @returns Evaluación completa o null si no existe
     */
    async getSupplierEvaluation(supplierId: string): Promise<SupplierEvaluation | null> {
        try {
            console.log('🔍 Buscando evaluación para supplier:', supplierId);

            // 1. Intentar obtener de epi_submissions (Prioridad: Auditoría/Submission final)
            // Primero verificamos si hay una submission enviada o auditada, ya que contiene la info más reciente de puntuación
            const submission = await this.getEPISubmission(supplierId);

            if (submission) {
                console.log('✅ Submission encontrada en epi_submissions');
                // Convertir submission a formato SupplierEvaluation
                const responses = [
                    ...(submission.qualityResponses || []),
                    ...(submission.supplyResponses || [])
                ];

                return {
                    id: submission.id,
                    supplierId: supplierId,
                    responses: responses,
                    calidadScore: submission.calidadScore || submission.qualityScore || 0,
                    abastecimientoScore: submission.abastecimientoScore || submission.supplyScore || 0,
                    globalScore: submission.calculatedScore || submission.globalScore || 0,
                    classification: submission.classification || 'Pendiente',
                    progress: {
                        totalQuestions: responses.length,
                        answeredQuestions: responses.length,
                        percentageComplete: 100,
                        calidadQuestions: submission.qualityResponses?.length || 0,
                        calidadAnswered: submission.qualityResponses?.length || 0,
                        abastecimientoQuestions: submission.supplyResponses?.length || 0,
                        abastecimientoAnswered: submission.supplyResponses?.length || 0
                    },
                    status: submission.status,
                    createdAt: submission.createdAt?.toMillis?.() || Date.now(),
                    updatedAt: submission.updatedAt?.toMillis?.() || Date.now(),
                    photoEvidence: submission.photoEvidence || []
                } as SupplierEvaluation;
            }

            console.log('⚠️ No hay submission, buscando en supplier_evaluations (Borrador)...');

            // 2. Si no existe submission, buscar en supplier_evaluations (Borrador/En Progreso)
            const evalRef = doc(db, COLLECTION_NAME, supplierId);
            const evalDoc = await getDoc(evalRef);

            if (evalDoc.exists()) {
                console.log('✅ Evaluación encontrada en supplier_evaluations');
                return { id: evalDoc.id, ...evalDoc.data() } as SupplierEvaluation;
            }

            console.log('❌ No se encontró evaluación en ninguna colección');
            return null;
        } catch (error) {
            console.error('❌ Error getting evaluation:', error);
            return null;
        }
    },

    /**
     * Obtiene todas las respuestas de un proveedor
     * @param supplierId - ID del proveedor
     * @returns Array de respuestas
     */
    async getSupplierResponses(supplierId: string): Promise<SupplierResponse[]> {
        const evaluation = await this.getSupplierEvaluation(supplierId);
        return evaluation?.responses || [];
    },

    /**
     * Calcula el progreso actual de un proveedor
     * @param supplierId - ID del proveedor
     * @returns Objeto con progreso detallado
     */
    async calculateProgress(supplierId: string): Promise<SupplierProgress> {
        try {
            const evaluation = await this.getSupplierEvaluation(supplierId);
            if (!evaluation) {
                // Sin evaluación, retornar progreso vacío
                return {
                    totalQuestions: 0,
                    answeredQuestions: 0,
                    percentageComplete: 0,
                    calidadQuestions: 0,
                    calidadAnswered: 0,
                    abastecimientoQuestions: 0,
                    abastecimientoAnswered: 0
                };
            }

            return evaluation.progress;
        } catch (error) {
            console.error('Error calculating progress:', error);
            throw error;
        }
    },

    /**
     * Actualiza los datos adicionales del proveedor
     * @param supplierId - ID del proveedor
     * @param data - Datos a actualizar
     */
    async updateSupplierData(
        supplierId: string,
        data: {
            supplierType?: string;
            certifications?: string[];
            products?: string[];
            induramaParticipation?: string;
            socialResponsibility?: boolean;
            signedContracts?: boolean;
        }
    ): Promise<void> {
        try {
            const evalRef = doc(db, COLLECTION_NAME, supplierId);
            const evalDoc = await getDoc(evalRef);

            if (evalDoc.exists()) {
                await updateDoc(evalRef, {
                    ...data,
                    updatedAt: Date.now()
                });
            } else {
                // Crear evaluación con datos iniciales
                const newEval: Partial<SupplierEvaluation> = {
                    supplierId,
                    ...data,
                    responses: [],
                    calidadScore: 0,
                    abastecimientoScore: 0,
                    globalScore: 0,
                    classification: 'SALIR',
                    progress: {
                        totalQuestions: 0,
                        answeredQuestions: 0,
                        percentageComplete: 0,
                        calidadQuestions: 0,
                        calidadAnswered: 0,
                        abastecimientoQuestions: 0,
                        abastecimientoAnswered: 0
                    },
                    status: 'draft',
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };

                await setDoc(evalRef, newEval);
            }
        } catch (error) {
            console.error('Error updating supplier data:', error);
            throw error;
        }
    },

    /**
     * Obtiene las preguntas sin responder
     * @param supplierId - ID del proveedor
     * @param category - 'calidad' o 'abastecimiento'
     * @returns Array de IDs de preguntas sin responder
     */
    async getUnansweredQuestions(
        supplierId: string,
        category: 'calidad' | 'abastecimiento'
    ): Promise<string[]> {
        try {
            const config = await EpiService.getEpiConfig();
            const evaluation = await this.getSupplierEvaluation(supplierId);
            const responses = evaluation?.responses || [];

            // Obtener todas las preguntas de la categoría
            const sections = config[category].sections;
            const allQuestionIds: string[] = [];
            sections.forEach(section => {
                section.questions.forEach(q => allQuestionIds.push(q.id));
            });

            // Filtrar las que NO han sido respondidas
            const answeredIds = responses
                .filter(r => r.category === category)
                .map(r => r.questionId);

            return allQuestionIds.filter(id => !answeredIds.includes(id));
        } catch (error) {
            console.error('Error getting unanswered questions:', error);
            return [];
        }
    },

    /**
     * Obtiene todas las evaluaciones (para gestor)
     * @returns Array de evaluaciones
     */
    async getAllEvaluations(): Promise<SupplierEvaluation[]> {
        try {
            const evaluationsRef = collection(db, COLLECTION_NAME);
            const snapshot = await getDocs(evaluationsRef);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as SupplierEvaluation[];
        } catch (error) {
            console.error('Error getting all evaluations:', error);
            return [];
        }
    },

    /**
     * Obtiene evaluaciones por estado
     * @param status - Estado a filtrar
     * @returns Array de evaluaciones
     */
    async getEvaluationsByStatus(
        status: 'draft' | 'in_progress' | 'submitted' | 'approved' | 'rejected'
    ): Promise<SupplierEvaluation[]> {
        try {
            const evaluationsRef = collection(db, COLLECTION_NAME);
            const q = query(evaluationsRef, where('status', '==', status));
            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as SupplierEvaluation[];
        } catch (error) {
            console.error('Error getting evaluations by status:', error);
            return [];
        }
    },

    /**
     * Submit complete EPI evaluation
     * Locks editing and creates submission snapshot
     */
    async submitEvaluation(supplierId: string): Promise<void> {
        try {
            // 1. Get current evaluation
            const evaluation = await this.getSupplierEvaluation(supplierId);

            if (!evaluation) {
                throw new Error('No se encontró la evaluación');
            }

            // 2. Validate completion
            const calidadResponses = evaluation.responses.filter(r => r.category === 'calidad');
            const abastecimientoResponses = evaluation.responses.filter(r => r.category === 'abastecimiento');

            const totalQuality = evaluation.progress?.calidadQuestions || 20;
            const totalSupply = evaluation.progress?.abastecimientoQuestions || 18;

            if (calidadResponses.length < totalQuality) {
                throw new Error(`Completa todas las preguntas de calidad (${calidadResponses.length}/${totalQuality})`);
            }

            if (abastecimientoResponses.length < totalSupply) {
                throw new Error(`Completa todas las preguntas de abastecimiento (${abastecimientoResponses.length}/${totalSupply})`);
            }

            // 3. Create snapshot in epi_submissions collection
            await addDoc(collection(db, 'epi_submissions'), {
                supplierId,
                status: 'submitted',
                qualityResponses: calidadResponses,
                supplyResponses: abastecimientoResponses,
                photoEvidence: evaluation.photoEvidence || [],
                calidadScore: evaluation.calidadScore || 0,
                abastecimientoScore: evaluation.abastecimientoScore || 0,
                calculatedScore: evaluation.globalScore || 0,
                classification: evaluation.classification || '',
                submittedAt: serverTimestamp(),
                canEdit: false,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // 4. Update user document status
            await updateDoc(doc(db, 'users', supplierId), {
                supplierStatus: 'epi_submitted',
                epiSubmittedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            console.log('✅ EPI submitted successfully');
        } catch (error) {
            console.error('Error submitting EPI:', error);
            throw error;
        }
    },

    /**
     * Get EPI submission status for a supplier
     */
    async getEPISubmission(supplierId: string): Promise<any | null> {
        try {
            const q = query(
                collection(db, 'epi_submissions'),
                where('supplierId', '==', supplierId)
            );

            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                return null;
            }

            // Return most recent submission
            const submissions = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            }));

            // Sort by createdAt descending and pick latest
            const sorted = submissions.sort((a: any, b: any) => {
                const aTime = a.createdAt?.toMillis?.() || a.createdAt || 0;
                const bTime = b.createdAt?.toMillis?.() || b.createdAt || 0;
                return bTime - aTime;
            });

            const latest = sorted[0];

            // Normalize known score fields for backwards compatibility
            if (latest) {
                const doc = latest as any;
                // many records store the overall as either 'calculatedScore' or 'globalScore'
                if (doc.calculatedScore == null && doc.globalScore != null) {
                    doc.calculatedScore = doc.globalScore;
                }
                if (doc.globalScore == null && doc.calculatedScore != null) {
                    doc.globalScore = doc.calculatedScore;
                }

                // Some older docs might have different naming for calidad/abastecimiento
                if (doc.calidadScore == null && doc.qualityScore != null) {
                    doc.calidadScore = doc.qualityScore;
                }
                if (doc.abastecimientoScore == null && doc.supplyScore != null) {
                    doc.abastecimientoScore = doc.supplyScore;
                }
            }

            return latest || null;

        } catch (error) {
            console.error('Error getting EPI submission:', error);
            return null;
        }
    },

    /**
     * Check if supplier can edit their EPI
     */
    async canEditEPI(supplierId: string): Promise<boolean> {
        try {
            const submission = await this.getEPISubmission(supplierId);

            // No submission = can edit
            if (!submission) {
                return true;
            }

            // Draft = can edit
            if (submission.status === 'draft') {
                return true;
            }

            // Submitted but enabled by gestor
            if (submission.status === 'submitted' && submission.canEdit) {
                return true;
            }

            // Revision requested = can edit
            if (submission.status === 'revision_requested') {
                return true;
            }

            // Otherwise cannot edit
            return false;
        } catch (error) {
            console.error('Error checking edit permission:', error);
            return true; // Default to allowing edit on error
        }
    },

    // --- AUDITORÍA Y RECALIBRACIÓN ---
    async auditAndRecalibrate(submissionId: string, supplierId: string, updatedResponses: any[]): Promise<number> {
        try {
            // Recalculate using the official ScoringService so weights/sections remain authoritative
            const config = await EpiService.getEpiConfig();

            // Ensure updatedResponses have category fields; ScoringService expects category in responses
            const calidadScore = ScoringService.calculateCategoryScore(
                config.calidad.sections,
                updatedResponses,
                'calidad'
            );

            const abastecimientoScore = ScoringService.calculateCategoryScore(
                config.abastecimiento.sections,
                updatedResponses,
                'abastecimiento'
            );

            // Global score and classification using ScoringService
            const totalScore = ScoringService.calculateGlobalScore(calidadScore, abastecimientoScore);
            const classification = ScoringService.getClassification(totalScore);

            // 3. Actualizar la Submisión (El detalle de la auditoría)
            const submissionRef = doc(db, 'epi_submissions', submissionId);
            await updateDoc(submissionRef, {
                responses: updatedResponses,
                qualityResponses: updatedResponses.filter(r => r.category === 'calidad'),
                supplyResponses: updatedResponses.filter(r => r.category === 'abastecimiento'),
                calidadScore: calidadScore,
                abastecimientoScore: abastecimientoScore,
                calculatedScore: totalScore,
                globalScore: totalScore,
                classification: classification,
                status: 'approved',
                reviewedAt: serverTimestamp(),
                reviewedBy: 'Auditor Indurama',
                canEdit: false
            });

            // 4. Actualizar el Usuario (CRUCIAL para el Buscador Rápido)
            const userRef = doc(db, 'users', supplierId);
            await updateDoc(userRef, {
                epiScore: totalScore,
                epiClassification: classification,
                supplierStatus: 'epi_approved',
                approved: true,
                isValidated: true,
                status: 'active',
                epiApprovedAt: serverTimestamp()
            });

            console.log('✅ Auditoría guardada y perfil de usuario actualizado correctamente.');
            return totalScore;

        } catch (error) {
            console.error('Error en auditAndRecalibrate:', error);
            throw error;
        }
    },

    /**
     * Approve EPI submission
     */
    async approveEPI(
        submissionId: string,
        supplierId: string,
        gestorId: string,
        comments?: string
    ): Promise<void> {
        try {
            const submissionRef = doc(db, 'epi_submissions', submissionId);
            const userRef = doc(db, 'users', supplierId);

            // Update submission
            await updateDoc(submissionRef, {
                status: 'approved',
                reviewedAt: serverTimestamp(),
                reviewedBy: gestorId,
                reviewComments: comments || '',
                canEdit: false,
            });

            // Update user
            await updateDoc(userRef, {
                supplierStatus: 'epi_approved',
                canSearchMatch: true,
                epiApprovedAt: serverTimestamp(),
                epiApprovedBy: gestorId,
                approved: true,
                isValidated: true
            });

            console.log('EPI approved successfully');
        } catch (error) {
            console.error('Error approving EPI:', error);
            throw error;
        }
    },

    /**
     * Reject EPI submission
     */
    async rejectEPI(
        submissionId: string,
        supplierId: string,
        gestorId: string,
        comments?: string
    ): Promise<void> {
        try {
            const submissionRef = doc(db, 'epi_submissions', submissionId);
            const userRef = doc(db, 'users', supplierId);

            // Update submission
            await updateDoc(submissionRef, {
                status: 'rejected',
                reviewedAt: serverTimestamp(),
                reviewedBy: gestorId,
                reviewComments: comments || '',
                canEdit: false,
            });

            // Update user
            await updateDoc(userRef, {
                supplierStatus: 'rejected',
                epiApprovedAt: serverTimestamp(),
                epiApprovedBy: gestorId,
                approved: false,
            });

            console.log('EPI rejected successfully');
        } catch (error) {
            console.error('Error rejecting EPI:', error);
            throw error;
        }
    },

    /**
     * Request revision for EPI submission
     */
    async requestRevision(
        submissionId: string,
        supplierId: string,
        gestorId: string,
        comments: string
    ): Promise<void> {
        try {
            const submissionRef = doc(db, 'epi_submissions', submissionId);

            await updateDoc(submissionRef, {
                status: 'revision_requested',
                reviewedAt: serverTimestamp(),
                reviewedBy: gestorId,
                reviewComments: comments,
                canEdit: true,
            });

            console.log('Revision requested successfully');
        } catch (error) {
            console.error('Error requesting revision:', error);
            throw error;
        }
    }
};