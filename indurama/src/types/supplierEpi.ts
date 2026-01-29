export interface SupplierGeneralData {
    companyName: string;
    ruc: string; // RUC o ID Fiscal
    address: string; // Dirección completa
    city: string;
    country: string;
    postalCode: string;
    phone: string; // Teléfono del proveedor
    website: string;

    // New Fields (Libro1.pdf)
    legalRepresentative: string;
    legalForm: string; // Forma Jurídica
    supplierType: 'fabricante' | 'distribuidor' | 'servicio' | '';
    rucType: string; // "Copia de RUC" description or type
    marketTime: string; // Tiempo en el mercado (años)
    sapBilling: string; // "Por Indurama" or custom
    contactPersonName: string; // Nombre de quien llena esta EPI
    contactPersonPhone: string; // Teléfono persona de contacto
    evaluationDate: any; // Fecha de Evaluación realizada

    // SAP Fields: Identificación y Datos Maestros
    bpType?: 'Persona' | 'Organización' | ''; // Tipo de BP
    groupingType?: string; // Tipo de agrupador
    treatment?: string; // Sra., Sr., Empresa, Sres.
    lastName?: string; // Apellidos (persona natural)
    nationality?: string; // Nacionalidad
    maritalStatus?: string; // Estado Civil
    taxCategory?: string; // Categoría tributaria
    language?: 'Español' | 'Inglés' | '';
    searchTerm?: string; // Concepto de búsqueda

    // SAP Fields: Ubicación Desglosada
    street?: string; // Calle principal
    street2?: string; // Calle 2
    street3?: string; // Calle 3
    houseNumber?: string; // Número de casa
    district?: string; // Distrito / Población
    region?: string; // Provincia / Región
    email?: string; // Email de facturación
    mobilePhone?: string; // Teléfono celular
    centralPhone?: string; // Teléfono fijo
}

export interface SupplierOperationsData {
    mainFocus: string; // Principal rubro de enfoque (checkbox in PDF, string here)
    mainRawMaterials: string; // Principales Materias Primas
    productsOrServices: string; // Productos que fabrica o comercializa

    // Clients
    mainClients: { name: string; share?: string }[]; // Principales Clientes (1 y 2)
    clientShare: string; // Participación de sus principales clientes en la facturación

    inventoryDays: string; // Tiempo promedio de días de Inventario
    mainSuppliers: string; // Principales Proveedores
    salesExpectation: string; // Expectativa de ventas para este año

    // Sales History
    sales2023: string;
    sales2024: string;
    sales2025: string;

    employeesCount: string; // Cantidad de Empleados
    shifts: string; // Horarios de atención y entrega
    factoryArea: string; // Área Total de la Fábrica/Bodega (m2)
    certifications: string; // Certificaciones de distribución/marcas
    productTags?: string[]; // Etiquetas de productos para búsqueda

    // SAP Fields: Enfoque de Servicio y Actividad Comercial
    serviceFocus?: 'Servicio Reparación' | 'Servicios de Construcción' | 'Servicio de Asesoramiento' | 'Venta de Repuestos' | 'Suministros / Materia Prima' | '';
    deliveryTime?: string; // Plazo de Entrega (días)
    commercialDescription?: string; // Descripción comercial detallada
    businessType?: string[]; // Tipos de negocio (multi-select)
}

export interface SupplierSystemsData {
    has5S: boolean;
    hasIndustrialSafety: boolean;
    hasQualitySystem: boolean;

    // Expanded Contacts (Libro1.pdf)
    generalManager: { name: string; email: string; phone?: string };
    commercial: { name: string; email: string; phone?: string };
    quality: { name: string; email: string; phone?: string };
    technical: { name: string; email: string; phone?: string }; // Cargo: Técnico
    production: { name: string; email: string; phone?: string }; // Cargo: Producción

    // SAP Fields: Información Bancaria
    taxIdType?: string; // Tipo de identificación fiscal
    taxId?: string; // Número de identificación fiscal
    bankName?: string; // Nombre del banco
    bankKey?: string; // Clave del banco
    accountNumber?: string; // Número de cuenta bancaria
    accountType?: 'Ahorros' | 'Corriente' | '';
    iban?: string; // IBAN
    bankCertificate?: string; // URL del certificado bancario

    // SAP Fields: Datos de Sociedad (Optional for provider, typically filled by Gestor)
    society?: string; // Sociedad asignada
    paymentCondition?: string; // Condición de pago Sociedad
    paymentMethods?: string[]; // Vías de pago
    withholdingType?: string; // Tipo de retención
    purchasingOrg?: string; // Organización de compras
    purchasingGroup?: string; // Grupo de compras
}

// The 20 Yes/No Questions from Section 4
export interface SupplierQuestionnaireData {
    signContract: boolean; // Disposición a firmar contrato
    firstContactName: string; // Primer contacto con INDURAMA
    relationshipStartDate: string; // Fecha de inicio de relaciones
    clientReference: boolean; // Referencia comercial de un cliente
    shareFinancial: boolean; // Compartir situación Financiera
    writtenContracts: boolean; // Contratos de empleados por escrito
    hseProcedures: boolean; // Procedimientos de Salud y Seguridad
    governmentCompliance: boolean; // Al día con Organismos
    replenishmentTime: string; // Tiempos de reposición (días)
    reworkInIndurama: boolean; // Reproceso en instalaciones
    creditConditions: boolean; // Condiciones de Crédito
    claimsProcess: boolean; // Proceso de reclamos (OBLIGATORIO)
    codeOfConduct: boolean; // Posesión de Código de Conducta
    iso50001: boolean; // Eficiencia Energética
    sriCompliance: boolean; // Cumplimiento tributario
    iessCompliance: boolean; // Cumplimiento IESS
    billingSystem: boolean; // Sistema propio de facturación
    quoteResponseTime: string; // Tiempo de respuesta cotizaciones
    warranty: boolean; // Garantía y Post Venta
    productsOffered: string; // Productos o insumos ofrecidos
}

// Checklist from Section 5
export interface ChecklistItem {
    id: string;
    label: string;
    required: boolean;
    checked: boolean;
    fileUrl?: string; // URL del archivo subido
    fileName?: string; // Nombre del archivo local o remoto
}

export interface SupplierChecklistData {
    financialStatus: ChecklistItem; // Situación Financiera
    employeeContract: ChecklistItem; // Copia de Contrato empleado
    companies: ChecklistItem; // Compañías (?? from PDF)
    municipalCompliance: ChecklistItem; // Certificado Organismos Municipales
    codeOfConduct: ChecklistItem; // Copia Código Conducta
    sriCompliance: ChecklistItem; // Certificado SRI

    // Others listed without explicit X but likely needed
    evaluationForm: ChecklistItem;
    rucUpdate: ChecklistItem;
    idCopy: ChecklistItem;
    appointment: ChecklistItem; // Nombramiento
    managementSystem: ChecklistItem; // Procedimiento Sistemas Gestión
    clientCertificate: ChecklistItem;
    taxDeclaration: ChecklistItem;
    iessCertificate: ChecklistItem;
    excelList: ChecklistItem;
    productCatalog: ChecklistItem;
}

// Combined Interface for Saving
export interface SupplierEpiData {
    general: SupplierGeneralData;
    operations: SupplierOperationsData;
    systems: SupplierSystemsData;
    questionnaire: SupplierQuestionnaireData;
    checklist: SupplierChecklistData;

    progress: number; // 0-100
    lastStep: number; // 1-5
    isComplete: boolean;
}
