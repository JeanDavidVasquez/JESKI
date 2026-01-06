import { EpiConfig, EpiSection } from '../types/epi';
import { SupplierResponse, SupplierClassification, SectionScore } from '../types/evaluation';

/**
 * Servicio para cálculos de scoring automático
 */
export const ScoringService = {
    /**
     * Calcula los puntos que vale cada pregunta en una sección
     * @param section - Sección del cuestionario
     * @returns Puntos por pregunta (sectionWeight / questionCount)
     */
    calculateQuestionPoints(section: EpiSection): number {
        const questionCount = section.questions.length;
        if (questionCount === 0) return 0;
        return section.weight / questionCount;
    },

    /**
     * Calcula el score de una sección basado en las respuestas
     * @param section - Sección del cuestionario
     * @param responses - Respuestas del proveedor para esa sección
     * @returns SectionScore con desglose detallado
     */
    calculateSectionScore(section: EpiSection, responses: SupplierResponse[]): SectionScore {
        const pointsPerQuestion = this.calculateQuestionPoints(section);
        const totalQuestions = section.questions.length;

        // Filtrar respuestas de esta sección
        const sectionResponses = responses.filter(r => r.sectionId === section.id);
        const answeredQuestions = sectionResponses.length;

        // Calcular puntos ganados
        const pointsEarned = sectionResponses.reduce((sum, response) => {
            // Si responde "cumple", gana los puntos completos
            return sum + (response.answer === 'cumple' ? pointsPerQuestion : 0);
        }, 0);

        const pointsPossible = section.weight;
        const percentage = pointsPossible > 0 ? (pointsEarned / pointsPossible) * 100 : 0;

        return {
            sectionId: section.id,
            sectionTitle: section.title,
            weight: section.weight,
            questionsTotal: totalQuestions,
            questionsAnswered: answeredQuestions,
            pointsEarned,
            pointsPossible,
            percentage
        };
    },

    /**
     * Calcula el score total de una categoría (Calidad o Abastecimiento)
     * @param sections - Todas las secciones de la categoría
     * @param responses - Respuestas del proveedor
     * @param category - 'calidad' o 'abastecimiento'
     * @returns Score de 0-100
     */
    calculateCategoryScore(
        sections: EpiSection[],
        responses: SupplierResponse[],
        category: 'calidad' | 'abastecimiento'
    ): number {
        // Filtrar respuestas de esta categoría
        const categoryResponses = responses.filter(r => r.category === category);

        // Calcular score de cada sección
        const sectionScores = sections.map(section =>
            this.calculateSectionScore(section, categoryResponses)
        );

        // Sumar puntos ganados vs puntos posibles
        const totalEarned = sectionScores.reduce((sum, score) => sum + score.pointsEarned, 0);
        const totalPossible = sectionScores.reduce((sum, score) => sum + score.pointsPossible, 0);

        // El score es simplemente la suma de puntos (debería ser 0-100)
        return totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;
    },

    /**
     * Calcula el score global (promedio de Calidad y Abastecimiento)
     * @param calidadScore - Score de calidad (0-100)
     * @param abastecimientoScore - Score de abastecimiento (0-100)
     * @returns Score global (0-100)
     */
    calculateGlobalScore(calidadScore: number, abastecimientoScore: number): number {
        return (calidadScore + abastecimientoScore) / 2;
    },

    /**
     * Determina la clasificación según el score global
     * @param globalScore - Score global (0-100)
     * @returns Clasificación: SALIR | MEJORAR | CRECER
     */
    getClassification(globalScore: number): SupplierClassification {
        if (globalScore < 60) return 'SALIR';
        if (globalScore < 80) return 'MEJORAR';
        return 'CRECER';
    },

    /**
     * Calcula el progreso de completitud
     * @param config - Configuración EPI completa
     * @param responses - Respuestas del proveedor
     * @returns Objeto con desglose de progreso
     */
    calculateProgress(config: EpiConfig, responses: SupplierResponse[]) {
        // Contar preguntas de calidad
        const calidadQuestions = config.calidad.sections.reduce(
            (sum, section) => sum + section.questions.length,
            0
        );
        const calidadAnswered = responses.filter(r => r.category === 'calidad').length;

        // Contar preguntas de abastecimiento
        const abastecimientoQuestions = config.abastecimiento.sections.reduce(
            (sum, section) => sum + section.questions.length,
            0
        );
        const abastecimientoAnswered = responses.filter(r => r.category === 'abastecimiento').length;

        const totalQuestions = calidadQuestions + abastecimientoQuestions;
        const answeredQuestions = calidadAnswered + abastecimientoAnswered;
        const percentageComplete = totalQuestions > 0
            ? (answeredQuestions / totalQuestions) * 100
            : 0;

        return {
            totalQuestions,
            answeredQuestions,
            percentageComplete: Math.round(percentageComplete),
            calidadQuestions,
            calidadAnswered,
            abastecimientoQuestions,
            abastecimientoAnswered
        };
    },

    /**
     * Genera un objeto de respuesta con puntos calculados
     * @param questionId - ID de la pregunta
     * @param sectionId - ID de la sección
     * @param category - Categoría (calidad/abastecimiento)
     * @param answer - Respuesta (cumple/no_cumple)
     * @param pointsPossible - Puntos posibles de la pregunta
     * @param evidenceUrl - URL de evidencia (opcional)
     * @param note - Nota del proveedor (opcional)
     * @returns SupplierResponse completo
     */
    createResponse(
        questionId: string,
        sectionId: string,
        category: 'calidad' | 'abastecimiento',
        answer: 'cumple' | 'no_cumple',
        pointsPossible: number,
        evidenceUrl?: string,
        note?: string
    ): SupplierResponse {
        const pointsEarned = answer === 'cumple' ? pointsPossible : 0;

        const response: SupplierResponse = {
            questionId,
            sectionId,
            category,
            answer,
            pointsEarned,
            pointsPossible,
            timestamp: Date.now()
        };

        // Only add optional fields if they have values
        if (evidenceUrl) {
            response.evidenceUrl = evidenceUrl;
        }
        if (note) {
            response.note = note;
        }

        return response;
    },

    /**
     * Obtiene el color de la clasificación
     */
    getClassificationColor(classification: SupplierClassification): string {
        switch (classification) {
            case 'CRECER':
                return '#10B981'; // Verde
            case 'MEJORAR':
                return '#F59E0B'; // Amarillo
            case 'SALIR':
                return '#EF4444'; // Rojo
        }
    },

    /**
     * Obtiene el texto descriptivo de la clasificación
     */
    getClassificationDescription(classification: SupplierClassification): string {
        switch (classification) {
            case 'CRECER':
                return 'Proveedor excelente para desarrollar relación a largo plazo';
            case 'MEJORAR':
                return 'Proveedor aceptable con áreas de mejora identificadas';
            case 'SALIR':
                return 'Proveedor no cumple con estándares mínimos requeridos';
        }
    }
};
