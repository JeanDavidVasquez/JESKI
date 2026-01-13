/**
 * Interfaz base para entidades con propiedades comunes
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interfaz para datos de usuario/empleado
 */
export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: UserRole;
  status: UserStatus;
  isActive: boolean; // Mantener por compatibilidad temporal, pero usar status
  profileImageUrl?: string;
  companyName?: string;
  category?: string;
  phone?: string;
  termsAccepted?: boolean;
  city?: string;
  country?: string;
  position?: string;

  // Department and Approval (for SOLICITANTE validation)
  department?: string;
  approved?: boolean;
  approvedBy?: string; // Manager userId who approved
  approvedAt?: any; // Firestore Timestamp

  // Supplier Profile Fields
  fiscalAddress?: string;
  centralPhone?: string;
  website?: string;

  // Internal Management
  induramaExecutive?: string;
  epiAuditor?: string;
  auditType?: string;
  evalDate?: string;

  // Contacts
  generalManagerName?: string;
  generalManagerEmail?: string;
  commercialContactName?: string;
  commercialContactEmail?: string;
  qualityContactName?: string;
  qualityContactEmail?: string;

  // Banking
  bankName?: string;
  bankAddress?: string;
  accountNumber?: string;
  bicSwift?: string;
  iban?: string;
  accountType?: string;

  // Credit
  creditDays?: string;
  deliveryDays?: string;
  paymentMethod?: string; // e.g., "Transferencia Bancaria"

  // Categorization (for PROVEEDOR role) - NEW
  businessType?: 'fabricante' | 'distribuidor' | 'servicio' | 'mixto';
  productCategories?: string[]; // ["materia_prima", "componentes"]
  productTags?: string[]; // ["tornillos", "acero_inoxidable", "pernos"]
  serviceTags?: string[]; // ["mecanizado", "soldadura", "pintura"]
  industries?: string[]; // ["metalmecanica", "automotriz"]
  capabilities?: string; // Descripción libre de capacidades
  score?: number; // Score del EPI (0-100)

  // Custom/Free-text tags when catalog doesn't match - NEW
  customProductTags?: string[]; // Tags personalizados de productos
  customServiceTags?: string[]; // Tags personalizados de servicios
  customCategories?: string[]; // Categorías personalizadas

  // EPI Submission Status (for PROVEEDOR role) - NEW
  supplierStatus?: 'pending_epi' | 'epi_submitted' | 'epi_approved' | 'active' | 'suspended' | 'rejected';
  epiScore?: number; // Score calculado por el gestor (0-100)
  canSearchMatch?: boolean; // Si puede aparecer en búsqueda de proveedores
  epiSubmittedAt?: any; // Firestore Timestamp
  epiApprovedAt?: any; // Firestore Timestamp
  epiApprovedBy?: string; // Gestor que aprobó el EPI
  profileCompleted?: boolean; // Si completó su perfil de proveedor
}



/**
 * Interface para submission de evaluación EPI
 */
export interface EPISubmission {
  id: string;
  supplierId: string;

  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'revision_requested' | 'quoting' | 'awarded';

  // Snapshot de respuestas al momento del envío
  qualityResponses: any[]; // Array de respuestas de calidad
  supplyResponses: any[]; // Array de respuestas de abastecimiento
  photoEvidence: any[]; // Array de evidencias fotográficas

  // Metadata
  submittedAt?: any; // Firestore Timestamp
  reviewedAt?: any; // Firestore Timestamp
  reviewedBy?: string; // ID del gestor que revisó

  // Control de edición
  canEdit: boolean;
  revisionReason?: string; // Motivo si se solicita corrección
  revisionDeadline?: any; // Firestore Timestamp

  // Score calculado por el gestor
  calculatedScore?: number;
  reviewComments?: string;

  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

/**
 * Roles de usuario en el sistema
 */
export enum UserRole {
  ADMIN = 'admin',           // Administrador del sistema
  SOLICITANTE = 'solicitante', // Usuario que hace solicitudes
  APROBADOR = 'aprobador',    // Usuario que aprueba solicitudes
  GESTOR = 'gestor',         // Gestor que administra el sistema
  PROVEEDOR = 'proveedor'    // Proveedor que completa evaluaciones
}

/**
 * Estados de usuario
 */
export enum UserStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  DISABLED = 'disabled'
}

/**
 * Interfaz para datos de proveedor
 */
export interface Supplier extends BaseEntity {
  businessName: string;
  contactPerson: string;
  email: string;
  phoneNumber: string;
  address: Address;
  taxId: string; // RUC o documento tributario
  category: SupplierCategory;
  status: SupplierStatus;
  rating: number; // Calificación del proveedor (1-5)
  notes?: string;
  contractStartDate?: Date;
  contractEndDate?: Date;
  products: Product[];
  documents: Document[];
}

/**
 * Categorías de proveedores
 */
export enum SupplierCategory {
  MATERIALS = 'materials',
  SERVICES = 'services',
  EQUIPMENT = 'equipment',
  TECHNOLOGY = 'technology',
  LOGISTICS = 'logistics',
  CONSULTING = 'consulting'
}

/**
 * Estados de proveedor
 */
export enum SupplierStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING_APPROVAL = 'pending_approval',
  SUSPENDED = 'suspended'
}

/**
 * Interfaz para dirección
 */
export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/**
 * Interfaz para productos/servicios del proveedor
 */
export interface Product extends BaseEntity {
  name: string;
  description: string;
  category: string;
  unitPrice: number;
  currency: string;
  minimumQuantity?: number;
  leadTime?: number; // Tiempo de entrega en días
  isAvailable: boolean;
}

/**
 * Interfaz para documentos del proveedor
 */
export interface Document extends BaseEntity {
  name: string;
  type: DocumentType;
  url: string;
  expirationDate?: Date;
  isRequired: boolean;
  isVerified: boolean;
}

/**
 * Tipos de documentos
 */
export enum DocumentType {
  TAX_CERTIFICATE = 'tax_certificate',
  BUSINESS_LICENSE = 'business_license',
  INSURANCE_POLICY = 'insurance_policy',
  QUALITY_CERTIFICATE = 'quality_certificate',
  CONTRACT = 'contract',
  OTHER = 'other'
}

/**
 * Interfaz para evaluaciones de proveedores
 */
export interface SupplierEvaluation extends BaseEntity {
  supplierId: string;
  evaluatorId: string;
  period: string; // Ej: "2024-Q1"
  qualityScore: number; // 1-5
  deliveryScore: number; // 1-5
  serviceScore: number; // 1-5
  priceScore: number; // 1-5
  overallScore: number; // Promedio calculado
  comments?: string;
  improvementAreas?: string[];
}

/**
 * Interfaz para contratos
 */
export interface Contract extends BaseEntity {
  supplierId: string;
  contractNumber: string;
  startDate: Date;
  endDate: Date;
  value: number;
  currency: string;
  terms: string;
  status: ContractStatus;
  renewalOptions?: string;
}

/**
 * Estados de contrato
 */
export enum ContractStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
  PENDING = 'pending'
}

/**
 * Interfaz para datos de autenticación
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Interfaz para respuestas de API
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errorCode?: string;
}

/**
 * Interfaz para filtros de búsqueda de proveedores
 */
export interface SupplierFilters {
  category?: SupplierCategory;
  status?: SupplierStatus;
  rating?: number;
  searchText?: string;
}

/**
 * Interfaz para estadísticas del dashboard
 */
export interface DashboardStats {
  totalSuppliers: number;
  activeSuppliers: number;
  pendingApprovals: number;
  averageRating: number;
  contractsExpiringThisMonth: number;
  recentEvaluations: SupplierEvaluation[];
}

/**
 * Estados de solicitud
 */
export enum RequestStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  QUOTING = 'quoting',
  AWARDED = 'awarded',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  // Legacy values (mantener para compatibilidad)
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  CANCELLED = 'cancelled',
  RECTIFICATION_REQUIRED = 'rectification_required'
}

/**
 * Prioridades de solicitud
 */
export enum RequestPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Categorías de solicitud
 */
export enum RequestCategory {
  MATERIALS = 'materials',
  EQUIPMENT = 'equipment',
  SERVICES = 'services',
  MAINTENANCE = 'maintenance',
  SUPPLIES = 'supplies',
  OTHER = 'other'
}

/**
 * Interfaz para solicitudes
 */
export interface Request extends BaseEntity {
  code: string; // Código único de la solicitud (ej: REQ-202412-001)
  title: string;
  description: string;

  // User Info
  userId: string;           // requestedBy renamed
  userEmail: string;
  userName: string;
  department: string;

  // Request Details
  requestDate: string;
  tipoProyecto: string;     // "Proyecto de Investigacion" | "Proyecto con Presupuesto Aprobado" | ...
  claseBusqueda: string;    // "Producto terminado" | "Materia Prima" | "Maquinaria" | "Servicios"
  supplierSuggestion?: string;

  category: RequestCategory;
  priority: RequestPriority;
  status: RequestStatus;

  requestedBy: string; // ID del usuario solicitante (keep for backward compatibility)
  assignedTo?: string; // ID del usuario asignado
  approvedBy?: string; // ID del usuario que aprobó
  reviewedBy?: string; // ID del usuario que revisó
  reviewedAt?: any;    // Timestamp
  completedAt?: any;   // Timestamp

  dueDate?: Date;
  estimatedCost?: number;
  actualCost?: number;
  notes?: string;
  attachments?: string[]; // URLs de archivos adjuntos
  items?: RequestItem[]; // Elementos específicos de la solicitud
  timeline?: RequestTimelineEvent[]; // Historial de eventos
  rectificationComment?: string; // Additional comment for rectification status
  urgency?: 'baja' | 'media' | 'alta';
  documents?: { name: string; url: string; type?: string }[];

  // Supplier Search Criteria - NEW
  requiredBusinessType?: 'fabricante' | 'distribuidor' | 'servicio' | 'cualquiera';
  requiredCategories?: string[]; // ["materia_prima", "componentes"]
  requiredTags?: string[]; // ["tornillos", "acero_inoxidable"]
  industry?: string; // "metalmecanica"

  // Custom search criteria - NEW
  customRequiredTags?: string[]; // Tags personalizados de búsqueda

  // Location
  deliveryLocationSuggestion?: string; // Ubicación sugerida por el solicitante
  winnerQuotationId?: string; // ID de cotización ganadora
}

/**
 * Elementos/items de una solicitud
 */
export interface RequestItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string; // kg, pcs, m2, etc.
  estimatedUnitPrice?: number;
  supplier?: string; // ID del proveedor sugerido
}

/**
 * Eventos del timeline de solicitudes
 */
export interface RequestTimelineEvent {
  id: string;
  type: 'created' | 'submitted' | 'approved' | 'rejected' | 'assigned' | 'completed' | 'comment';
  description: string;
  createdBy: string; // ID del usuario
  createdAt: Date;
  metadata?: Record<string, any>; // Datos adicionales del evento
}

// ============================================
// QUOTATION SYSTEM TYPES
// ============================================

/**
 * Estados de invitación a cotizar
 */
export type QuotationInvitationStatus = 'pending' | 'viewed' | 'quoted' | 'declined' | 'expired';

/**
 * Interface Invitación a Cotizar
 */
export interface QuotationInvitation {
  id: string;
  requestId: string;
  supplierId: string;
  gestorId: string;
  status: QuotationInvitationStatus;
  message?: string;
  dueDate: any; // Timestamp
  createdAt: any; // Timestamp
  viewedAt?: any; // Timestamp
  quotationId?: string;
  deliveryAddress?: string; // Dirección de entrega oficial para cotizar
}

/**
 * Estados de cotización
 */
export type QuotationStatus = 'submitted' | 'selected' | 'rejected' | 'cancelled';

/**
 * Comentarios / Q&A dentro de una cotización
 */
export interface QuotationComment {
  id: string;
  requestId: string;
  quotationId?: string; // Opcional: si es específico de una oferta
  supplierId: string;   // Contexto de la conversación (quién es el proveedor involucrado)
  authorId: string;
  authorName: string;
  authorRole: 'gestor' | 'proveedor';
  message: string;
  createdAt: any; // Timestamp
  read: boolean;
}

/**
 * Cotización/Oferta enviada por un proveedor
 */
export interface Quotation {
  id: string;
  invitationId: string;        // Referencia a la invitación
  requestId: string;           // Solicitud original
  supplierId: string;          // Proveedor que cotiza
  supplierName?: string;       // Nombre del proveedor (denormalizado)

  // Datos de la oferta
  totalAmount: number;
  currency: 'USD' | 'EUR';
  deliveryDays: number;        // Días de entrega
  paymentTerms: string;        // "30 días", "Contado", etc.
  validUntil: any;             // Vigencia de la oferta (Firestore Timestamp)
  notes?: string;              // Observaciones
  attachments?: string[];      // URLs de archivos adjuntos

  // Estado
  status: QuotationStatus;
  isWinner: boolean;

  // Ranking calculado
  rankingScore?: number;       // Puntaje de ranking (0-100)

  // Tracking
  submittedAt: any;
  selectedAt?: any;
}

/**
 * Comentario en una cotización
 */
export interface QuotationComment {
  id: string;
  quotationId?: string;
  invitationId?: string;
  requestId: string;
  authorId: string;
  authorName: string;
  authorRole: 'gestor' | 'proveedor';
  message: string;
  createdAt: any;
}

// ============================================
// NOTIFICATION SYSTEM TYPES
// ============================================

/**
 * Tipos de notificación
 */
export type NotificationType =
  | 'quotation_invitation'      // Proveedor recibe invitación a cotizar
  | 'quotation_received'        // Gestor recibe cotización
  | 'quotation_winner'          // Proveedor ganó
  | 'quotation_not_selected'    // Proveedor no fue seleccionado
  | 'request_status_change'     // Cambio de estado de solicitud
  | 'supplier_selected'         // Notificar al solicitante que se eligió proveedor
  | 'comment_received';         // Nuevo comentario

/**
 * Notificación in-app
 */
export interface AppNotification {
  id: string;
  userId: string;              // Destinatario
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;          // ID de solicitud/cotización relacionada
  relatedType?: 'request' | 'quotation' | 'invitation';
  read: boolean;
  createdAt: any;
}