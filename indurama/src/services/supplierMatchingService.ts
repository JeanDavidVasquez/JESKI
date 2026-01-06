import { Request, User } from '../types/index';

/**
 * Resultado del matching entre una solicitud y un proveedor
 */
export interface SupplierMatch {
    supplier: User;
    score: number; // 0-100
    matchDetails: {
        businessTypeMatch: boolean;
        categoryMatches: string[];
        tagMatches: string[];
        industryMatch: boolean;
    };
    compatibilityPercentage: number;
}

/**
 * Servicio para hacer matching inteligente entre solicitudes y proveedores
 */
export const SupplierMatchingService = {
    /**
     * Calcula qué tan compatible es un proveedor con una solicitud
     * @param request - Solicitud con criterios de búsqueda
     * @param supplier - Proveedor a evaluar
     * @returns Objeto con score y detalles del match
     */
    calculateMatch(request: Request, supplier: User): SupplierMatch {
        let score = 0;
        const matchDetails = {
            businessTypeMatch: false,
            categoryMatches: [] as string[],
            tagMatches: [] as string[],
            industryMatch: false
        };

        // 1. Business Type Match (peso: 25 puntos)
        if (request.requiredBusinessType && supplier.businessType) {
            if (
                request.requiredBusinessType === 'cualquiera' ||
                request.requiredBusinessType === supplier.businessType
            ) {
                score += 25;
                matchDetails.businessTypeMatch = true;
            }
        } else if (!request.requiredBusinessType) {
            // Si no se especifica, dar puntos base
            score += 15;
        }

        // 2. Category Match (peso: 20 puntos máximo)
        if (request.requiredCategories && request.requiredCategories.length > 0 && supplier.productCategories) {
            const categoryIntersection = request.requiredCategories.filter(cat =>
                supplier.productCategories?.includes(cat)
            );
            matchDetails.categoryMatches = categoryIntersection;

            if (categoryIntersection.length > 0) {
                // Puntos proporcionales: 20 puntos si coinciden todas
                const categoryScore = (categoryIntersection.length / request.requiredCategories.length) * 20;
                score += categoryScore;
            }
        } else if (!request.requiredCategories || request.requiredCategories.length === 0) {
            // Si no se especifican categorías, dar puntos base
            score += 10;
        }

        // 3. Tag Match (peso: 40 puntos máximo) - MÁS IMPORTANTE
        // Combinar tags predefinidos y personalizados
        const requestTags = [
            ...(request.requiredTags || []),
            ...(request.customRequiredTags || [])
        ];

        if (requestTags.length > 0) {
            const allSupplierTags = [
                ...(supplier.productTags || []),
                ...(supplier.serviceTags || []),
                ...(supplier.customProductTags || []),
                ...(supplier.customServiceTags || [])
            ];

            const tagIntersection = requestTags.filter(tag =>
                allSupplierTags.some(supplierTag =>
                    supplierTag.toLowerCase().includes(tag.toLowerCase()) ||
                    tag.toLowerCase().includes(supplierTag.toLowerCase())
                )
            );

            matchDetails.tagMatches = tagIntersection;

            if (tagIntersection.length > 0) {
                // Puntos proporcionales: 40 puntos si coinciden todos
                const tagScore = (tagIntersection.length / requestTags.length) * 40;
                score += tagScore;
            }
        } else {
            // Si no se especifican tags, dar puntos base
            score += 20;
        }

        // 4. Industry Match (peso: 10 puntos)
        if (request.industry && supplier.industries) {
            if (supplier.industries.includes(request.industry)) {
                score += 10;
                matchDetails.industryMatch = true;
            }
        } else if (!request.industry) {
            // Si no se especifica industria, dar puntos base
            score += 5;
        }

        // 5. EPI Score bonus (peso: 5 puntos adicionales)
        if (supplier.score && supplier.score >= 80) {
            score += 5; // Bonus por tener buen score EPI
        }

        // Calcular porcentaje de compatibilidad
        const compatibilityPercentage = Math.round(score);

        return {
            supplier,
            score,
            matchDetails,
            compatibilityPercentage
        };
    },

    /**
     * Filtra y ordena proveedores según compatibilidad con una solicitud
     * @param request - Solicitud con criterios
     * @param suppliers - Lista de proveedores disponibles
     * @param minimumScore - Score mínimo para incluir (default: 20)
     * @returns Array de matches ordenados por score
     */
    matchSuppliers(
        request: Request,
        suppliers: User[],
        minimumScore: number = 20
    ): SupplierMatch[] {
        // Calcular match para cada proveedor
        const matches = suppliers
            .filter(s => s.role === 'proveedor') // Solo proveedores
            .map(supplier => this.calculateMatch(request, supplier))
            .filter(match => match.score >= minimumScore) // Filtrar por score mínimo
            .sort((a, b) => b.score - a.score); // Ordenar descendente

        return matches;
    },

    /**
     * Obtiene el nivel de compatibilidad como texto
     * @param score - Score de 0-100
     * @returns Nivel de compatibilidad
     */
    getCompatibilityLevel(score: number): string {
        if (score >= 80) return 'Muy Alta';
        if (score >= 60) return 'Alta';
        if (score >= 40) return 'Media';
        if (score >= 20) return 'Baja';
        return 'Muy Baja';
    },

    /**
     * Obtiene el color para el badge de compatibilidad
     * @param score - Score de 0-100
     * @returns Color hex
     */
    getCompatibilityColor(score: number): string {
        if (score >= 80) return '#10B981'; // Verde
        if (score >= 60) return '#3B82F6'; // Azul
        if (score >= 40) return '#F59E0B'; // Amarillo
        if (score >= 20) return '#EF4444'; // Rojo
        return '#9CA3AF'; // Gris
    },

    /**
     * Encuentra la intersección entre dos arrays
     */
    intersection<T>(arr1: T[], arr2: T[]): T[] {
        return arr1.filter(item => arr2.includes(item));
    },

    /**
     * Genera un resumen textual del match
     * @param match - Resultado del matching
     * @returns Texto descriptivo
     */
    getMatchSummary(match: SupplierMatch): string {
        const { matchDetails } = match;
        const parts: string[] = [];

        if (matchDetails.businessTypeMatch) {
            parts.push('Tipo de negocio coincide');
        }

        if (matchDetails.categoryMatches.length > 0) {
            parts.push(`${matchDetails.categoryMatches.length} categoría(s) coinciden`);
        }

        if (matchDetails.tagMatches.length > 0) {
            parts.push(`${matchDetails.tagMatches.length} producto(s)/servicio(s) coinciden`);
        }

        if (matchDetails.industryMatch) {
            parts.push('Industria coincide');
        }

        if (parts.length === 0) {
            return 'Proveedor general sin matches específicos';
        }

        return parts.join(' • ');
    }
};
