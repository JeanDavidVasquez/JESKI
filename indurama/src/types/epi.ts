export interface EpiQuestion {
    id: string;
    text: string;
    weight: number; // Porcentaje (0-100)
    isNew?: boolean; // Para identificar si es un campo nuevo en la UI
    inputValue?: string; // Para controlar el input temporalmente
    evidence?: string; // Para el campo de evidencias
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
