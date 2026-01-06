export interface EpiQuestion {
    id: string;
    text: string;
    // Weight is now calculated automatically: sectionWeight / questionCount
    // weight field removed - points calculated dynamically
    evidenceRequired?: boolean; // Si requiere adjuntar evidencia
    evidenceDescription?: string; // Descripción de evidencia esperada
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
