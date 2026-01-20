export interface EpiQuestion {
    id: string;
    text: string;
    weight: number; // Re-added: UI allows manual weight configuration
    evidence?: string;
    evidenceRequired?: boolean; // Si requiere adjuntar evidencia
    evidenceDescription?: string; // Descripción de evidencia esperada
    isNew?: boolean; // UI State
}

export interface EpiSection {
    id: string;
    title: string;
    weight: number; // Porcentaje (0-100)
    questions: EpiQuestion[];
}

export interface EpiConfig {
    calidad: {
        totalWeight: number; // Debe sumar 100
        sections: EpiSection[];
    };
    abastecimiento: {
        totalWeight: number; // Debe sumar 100
        sections: EpiSection[];
    };
}

export type EpiCategory = 'calidad' | 'abastecimiento';
