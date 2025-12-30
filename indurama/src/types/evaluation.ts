export interface EvaluationResponse {
    questionId: string;
    questionText: string;
    sectionId: string;
    answer: 'SI' | 'NO' | 'N/A';
    score: number; // Puntos obtenidos (basado en el peso)
    maxScore: number; // Puntos posibles (el peso de la pregunta)
    observation?: string;
}

export interface SupplierEvaluation {
    id?: string;
    supplierId: string;
    evaluatorId?: string; // ID del usuario que evaluó
    type: 'CALIDAD' | 'ABASTECIMIENTO';
    totalScore: number; // Suma de puntos obtenidos
    maxTotalScore: number; // Suma de puntos posibles (idealmente 100)
    responses: EvaluationResponse[];
    timestamp: number;
    status: 'COMPLETED' | 'IN_PROGRESS';
}
