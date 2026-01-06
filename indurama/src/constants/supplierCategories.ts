/**
 * Catálogo de categorías y tags para clasificación de proveedores
 */

export const BUSINESS_TYPES = [
    { value: 'fabricante', label: 'Fabricante Directo', description: 'Produce los bienes que vende' },
    { value: 'distribuidor', label: 'Distribuidor/Comercializador', description: 'Revende productos de terceros' },
    { value: 'servicio', label: 'Proveedor de Servicios', description: 'Ofrece servicios técnicos o logísticos' },
    { value: 'mixto', label: 'Mixto', description: 'Combina productos y servicios' }
];

export const PRODUCT_CATEGORIES = [
    {
        value: 'materia_prima',
        label: 'Materia Prima',
        icon: '⚙️',
        description: 'Materiales base para manufactura'
    },
    {
        value: 'componentes',
        label: 'Componentes y Partes',
        icon: '🔩',
        description: 'Piezas y partes para ensamble'
    },
    {
        value: 'productos_terminados',
        label: 'Productos Terminados',
        icon: '📦',
        description: 'Productos listos para uso final'
    },
    {
        value: 'insumos',
        label: 'Insumos y Consumibles',
        icon: '🧰',
        description: 'Materiales de uso continuo'
    },
    {
        value: 'servicios',
        label: 'Servicios',
        icon: '🔧',
        description: 'Servicios técnicos y especializados'
    }
];

export const PRODUCT_TAGS: Record<string, string[]> = {
    materia_prima: [
        'Acero',
        'Acero Inoxidable',
        'Aluminio',
        'Cobre',
        'Bronce',
        'Latón',
        'Plástico',
        'PVC',
        'Polietileno',
        'Polipropileno',
        'Madera',
        'Vidrio',
        'Caucho',
        'Silicona',
        'Resinas',
        'Fibra de Vidrio'
    ],
    componentes: [
        'Tornillos',
        'Pernos',
        'Tuercas',
        'Arandelas',
        'Remaches',
        'Rodamientos',
        'Cojinetes',
        'Motores Eléctricos',
        'Motores Hidráulicos',
        'Válvulas',
        'Bombas',
        'Sensores',
        'Actuadores',
        'Cables Eléctricos',
        'Conectores',
        'Interruptores',
        'Relés',
        'Transformadores',
        'Resistencias',
        'Capacitores',
        'Diodos',
        'Transistores'
    ],
    productos_terminados: [
        'Electrodomésticos',
        'Maquinaria Industrial',
        'Herramientas Manuales',
        'Herramientas Eléctricas',
        'Equipos de Medición',
        'Equipos de Seguridad',
        'Mobiliario',
        'Iluminación'
    ],
    insumos: [
        'Pintura Industrial',
        'Recubrimientos',
        'Adhesivos',
        'Selladores',
        'Lubricantes',
        'Aceites',
        'Grasas',
        'Limpiadores',
        'Disolventes',
        'Empaques',
        'Etiquetas',
        'Cajas y Embalajes',
        'EPP (Equipo de Protección Personal)',
        'Uniformes',
        'Guantes',
        'Mascarillas'
    ],
    servicios: [
        'Mecanizado CNC',
        'Torneado',
        'Fresado',
        'Soldadura',
        'Soldadura TIG',
        'Soldadura MIG',
        'Soldadura por Arco',
        'Pintura Industrial',
        'Powder Coating',
        'Galvanizado',
        'Cromado',
        'Anodizado',
        'Tratamiento Térmico',
        'Temple',
        'Revenido',
        'Corte por Láser',
        'Corte por Plasma',
        'Corte por Agua',
        'Doblado de Metal',
        'Estampado',
        'Fundición',
        'Inyección de Plástico',
        'Extrusión',
        'Transporte',
        'Logística',
        'Almacenamiento',
        'Distribución',
        'Mantenimiento Preventivo',
        'Mantenimiento Correctivo',
        'Instalación',
        'Calibración',
        'Certificación',
        'Consultoría Técnica',
        'Diseño de Producto',
        'Ingeniería'
    ]
};

export const INDUSTRIES = [
    { value: 'metalmecanica', label: 'Metalmecánica' },
    { value: 'automotriz', label: 'Automotriz' },
    { value: 'construccion', label: 'Construcción' },
    { value: 'electrica', label: 'Eléctrica' },
    { value: 'electronica', label: 'Electrónica' },
    { value: 'alimenticia', label: 'Alimenticia' },
    { value: 'farmaceutica', label: 'Farmacéutica' },
    { value: 'textil', label: 'Textil' },
    { value: 'quimica', label: 'Química' },
    { value: 'petroleo_gas', label: 'Petróleo y Gas' },
    { value: 'mineria', label: 'Minería' },
    { value: 'energia', label: 'Energía' },
    { value: 'telecomunicaciones', label: 'Telecomunicaciones' },
    { value: 'manufactura', label: 'Manufactura General' },
    { value: 'otra', label: 'Otra' }
];

/**
 * Obtiene los tags disponibles para una categoría
 */
export function getTagsForCategory(category: string): string[] {
    return PRODUCT_TAGS[category] || [];
}

/**
 * Obtiene todas las categorías como array simple
 */
export function getAllCategories(): string[] {
    return PRODUCT_CATEGORIES.map(c => c.value);
}

/**
 * Obtiene el label de una categoría
 */
export function getCategoryLabel(value: string): string {
    const category = PRODUCT_CATEGORIES.find(c => c.value === value);
    return category?.label || value;
}

/**
 * Obtiene el label de un tipo de negocio
 */
export function getBusinessTypeLabel(value: string): string {
    const type = BUSINESS_TYPES.find(t => t.value === value);
    return type?.label || value;
}

/**
 * Obtiene el label de una industria
 */
export function getIndustryLabel(value: string): string {
    const industry = INDUSTRIES.find(i => i.value === value);
    return industry?.label || value;
}
