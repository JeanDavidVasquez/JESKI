/**
 * Respuesta individual a una pregunta del cuestionario
 */
export interface SupplierResponse {
    questionId: string;
    sectionId: string;
    category: 'calidad' | 'abastecimiento';
    answer: 'cumple' | 'no_cumple';
    evidenceUrl?: string; // URL de Firebase Storage
    note?: string; // Nota adicional del proveedor
    pointsEarned: number; // Puntos ganados (calculado)
    pointsPossible: number; // Puntos posibles de la pregunta
    timestamp: number;
}

/**
 * Progreso de la evaluación
 */
export interface SupplierProgress {
    totalQuestions: number;
    answeredQuestions: number;
    percentageComplete: number; // 0-100
    calidadQuestions: number;
    calidadAnswered: number;
    abastecimientoQuestions: number;
    abastecimientoAnswered: number;
}

/**
 * Clasificación según el score global
 */
export type SupplierClassification = 'SALIR' | 'MEJORAR' | 'CRECER';

/**
 * Evaluación completa del proveedor
 */
export interface SupplierEvaluation {
    id?: string;
    supplierId: string;
    supplierName?: string;

    // Datos adicionales del proveedor (del Excel)
    supplierType?: string; // Tipo de proveedor
    certifications?: string[]; // Certificados que tiene
    products?: string[]; // Productos que fabrica
    induramaParticipation?: string; // % de participación
    socialResponsibility?: boolean; // Responsabilidad Social
    signedContracts?: boolean; // Contratos Acordados y Firmados

    // Scores calculados
    calidadScore: number; // 0-100 (%)
    abastecimientoScore: number; // 0-100 (%)
    globalScore: number; // (calidad + abastecimiento) / 2
    classification: SupplierClassification;

    // Respuestas
    responses: SupplierResponse[];

    // Progreso
    progress: SupplierProgress;

    // Evidencias
    photoEvidence?: string[];

    // Estado de la evaluación
    status: 'draft' | 'in_progress' | 'submitted' | 'approved' | 'rejected';

    // Timestamps
    createdAt: number;
    updatedAt: number;
    submittedAt?: number;
    reviewedAt?: number;

    // Auditoría
    reviewedBy?: string; // ID del gestor que revisó
    reviewNotes?: string; // Notas de la revisión
}

/**
 * Resumen de scoring por sección
 */
export interface SectionScore {
    sectionId: string;
    sectionTitle: string;
    weight: number; // Peso de la sección (%)
    questionsTotal: number;
    questionsAnswered: number;
    pointsEarned: number;
    pointsPossible: number;
    percentage: number; // pointsEarned / pointsPossible * 100
}

// Legacy interfaces - mantener por compatibilidad
export interface EvaluationResponse {
    questionId: string;
    questionText: string;
    sectionId: string;
    answer: 'SI' | 'NO' | 'N/A';
    score: number;
    maxScore: number;
    observation?: string;
}
