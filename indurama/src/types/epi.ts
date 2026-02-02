export interface EpiQuestion {
    id: string;
    text: string;           // Texto en español (principal)
    text_en?: string;       // Texto en inglés (traducción)
    weight: number;
    evidence?: string;
    evidenceRequired?: boolean;
    evidenceDescription?: string;
    isNew?: boolean;
}

export interface EpiSection {
    id: string;
    title: string;          // Título en español (principal)
    title_en?: string;      // Título en inglés (traducción)
    weight: number;
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
