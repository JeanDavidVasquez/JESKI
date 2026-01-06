import { collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc, serverTimestamp } from 'firebase/firestore';
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
     * @param supplierId - ID del proveedor
     * @returns Evaluación completa o null si no existe
     */
    async getSupplierEvaluation(supplierId: string): Promise<SupplierEvaluation | null> {
        try {
            const evalRef = doc(db, COLLECTION_NAME, supplierId);
            const evalDoc = await getDoc(evalRef);

            if (evalDoc.exists()) {
                return { id: evalDoc.id, ...evalDoc.data() } as SupplierEvaluation;
            }
            return null;
        } catch (error) {
            console.error('Error getting evaluation:', error);
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
     * Envía la evaluación final (marca como submitted)
     * @param supplierId - ID del proveedor
     * @returns true si se envió correctamente
     */
    async submitEvaluation(supplierId: string): Promise<boolean> {
        try {
            const evaluation = await this.getSupplierEvaluation(supplierId);

            if (!evaluation) {
                throw new Error('No se encontró la evaluación');
            }

            // Verificar que esté completo
            if (evaluation.progress.percentageComplete < 100) {
                throw new Error('La evaluación no está completa');
            }

            const evalRef = doc(db, COLLECTION_NAME, supplierId);
            await updateDoc(evalRef, {
                status: 'submitted',
                submittedAt: Date.now(),
                updatedAt: Date.now()
            });

            return true;
        } catch (error) {
            console.error('Error submitting evaluation:', error);
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
    }
};
