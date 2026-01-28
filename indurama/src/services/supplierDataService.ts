import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import {
    SupplierEpiData,
    SupplierGeneralData,
    SupplierOperationsData,
    SupplierSystemsData,
    SupplierQuestionnaireData,
    SupplierChecklistData
} from '../types/supplierEpi';

/**
 * Supplier Data Service
 * Manages supplier data across Firestore subcollections (EPI Sections)
 */

// ========== Save Sections ==========

export const saveSupplierGeneralData = async (userId: string, data: SupplierGeneralData) => {
    await setDoc(doc(db, 'users', userId, 'epiData', 'general'), { ...data, updatedAt: serverTimestamp() }, { merge: true });
};

export const saveSupplierOperationsData = async (userId: string, data: SupplierOperationsData) => {
    await setDoc(doc(db, 'users', userId, 'epiData', 'operations'), { ...data, updatedAt: serverTimestamp() }, { merge: true });
};

export const saveSupplierSystemsData = async (userId: string, data: SupplierSystemsData) => {
    await setDoc(doc(db, 'users', userId, 'epiData', 'systems'), { ...data, updatedAt: serverTimestamp() }, { merge: true });
};

export const saveSupplierQuestionnaireData = async (userId: string, data: SupplierQuestionnaireData) => {
    await setDoc(doc(db, 'users', userId, 'epiData', 'questionnaire'), { ...data, updatedAt: serverTimestamp() }, { merge: true });
};

export const saveSupplierChecklistData = async (userId: string, data: SupplierChecklistData) => {
    await setDoc(doc(db, 'users', userId, 'epiData', 'checklist'), { ...data, updatedAt: serverTimestamp() }, { merge: true });
};

// ========== Load Complete Data ==========

export const loadSupplierEpiData = async (userId: string): Promise<Partial<SupplierEpiData>> => {
    try {
        const epiRef = collection(db, 'users', userId, 'epiData');
        const snapshot = await getDocs(epiRef);

        const data: any = {};

        snapshot.forEach(doc => {
            data[doc.id] = doc.data();
        });

        // Also load legacy CompanyProfile if general is missing
        if (!data.general) {
            const legacyProfile = await getDoc(doc(db, 'users', userId, 'companyProfile', 'main'));
            if (legacyProfile.exists()) {
                const lp = legacyProfile.data();
                data.general = {
                    companyName: '', // Usually in user doc, need to fetch user doc for this? No, keep simple.
                    address: lp.fiscalAddress || '',
                    phone: lp.centralPhone || '',
                    website: lp.website || '',
                    city: lp.city || '',
                    country: lp.country || '',
                    postalCode: lp.postalCode || '',
                    ruc: lp.ruc || ''
                };
            }
        }

        return data as Partial<SupplierEpiData>;
    } catch (error) {
        console.error("Error loading EPI data:", error);
        return {};
    }
};

/**
 * Save all supplier data in a single batch operation (atomic)
 * Handles legacy collections for backward compatibility if needed, 
 * but primarily saves to 'epiData' subcollection.
 */
export const saveAllSupplierEpiData = async (
    userId: string,
    data: Partial<SupplierEpiData>,
    legacyContacts?: any
): Promise<void> => {
    const batch = writeBatch(db);

    if (data.general) {
        batch.set(doc(db, 'users', userId, 'epiData', 'general'), { ...data.general, updatedAt: serverTimestamp() }, { merge: true });

        // Sync legacy profile for compatibility with other screens
        batch.set(doc(db, 'users', userId, 'companyProfile', 'main'), {
            fiscalAddress: data.general.address,
            centralPhone: data.general.phone,
            website: data.general.website,
            city: data.general.city,
            country: data.general.country,
            ruc: data.general.ruc,
            postalCode: data.general.postalCode,
            updatedAt: serverTimestamp()
        }, { merge: true });
    }

    if (data.operations) {
        batch.set(doc(db, 'users', userId, 'epiData', 'operations'), { ...data.operations, updatedAt: serverTimestamp() }, { merge: true });

        // Sync productTags to root user document for search optimization
        if (data.operations.productTags) {
            batch.set(doc(db, 'users', userId), { productTags: data.operations.productTags }, { merge: true });
        }
    }

    if (data.systems) {
        batch.set(doc(db, 'users', userId, 'epiData', 'systems'), { ...data.systems, updatedAt: serverTimestamp() }, { merge: true });

        // Sync legacy contacts if provided or extracted from systems
        if (data.systems.generalManager) {
            batch.set(doc(db, 'users', userId, 'contacts', 'general_manager'), { ...data.systems.generalManager, type: 'general_manager' }, { merge: true });
        }
        if (data.systems.commercial) {
            batch.set(doc(db, 'users', userId, 'contacts', 'commercial'), { ...data.systems.commercial, type: 'commercial' }, { merge: true });
        }
        if (data.systems.quality) {
            batch.set(doc(db, 'users', userId, 'contacts', 'quality'), { ...data.systems.quality, type: 'quality' }, { merge: true });
        }
    }

    if (data.questionnaire) {
        batch.set(doc(db, 'users', userId, 'epiData', 'questionnaire'), { ...data.questionnaire, updatedAt: serverTimestamp() }, { merge: true });
    }

    if (data.checklist) {
        batch.set(doc(db, 'users', userId, 'epiData', 'checklist'), { ...data.checklist, updatedAt: serverTimestamp() }, { merge: true });
    }

    await batch.commit();
};


// ==========================================
// LEGACY SUPPORT
// ==========================================



// ========== Company Profile ==========

export interface CompanyProfileData {
    fiscalAddress?: string;
    centralPhone?: string;
    website?: string;
    city?: string;
    country?: string;
    ruc?: string;
    postalCode?: string;
    category?: string;
}

export const saveCompanyProfile = async (
    userId: string,
    data: CompanyProfileData
): Promise<void> => {
    const profileRef = doc(db, 'users', userId, 'companyProfile', 'main');
    await setDoc(profileRef, {
        ...data,
        updatedAt: serverTimestamp()
    }, { merge: true });
};

export const getCompanyProfile = async (
    userId: string
): Promise<CompanyProfileData | null> => {
    const profileRef = doc(db, 'users', userId, 'companyProfile', 'main');
    const snapshot = await getDoc(profileRef);
    return snapshot.exists() ? snapshot.data() as CompanyProfileData : null;
};

// ========== Contacts ==========

export type ContactType = 'general_manager' | 'commercial' | 'quality';

export interface ContactData {
    type: ContactType;
    name: string;
    email: string;
    phone?: string;
}

export const saveContact = async (
    userId: string,
    type: ContactType,
    data: { name: string; email: string; phone?: string }
): Promise<void> => {
    // Use type as document ID for easy retrieval
    const contactRef = doc(db, 'users', userId, 'contacts', type);
    await setDoc(contactRef, {
        type,
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        updatedAt: serverTimestamp()
    }, { merge: true });
};

export const getAllContacts = async (
    userId: string
): Promise<Record<ContactType, ContactData | null>> => {
    const contactsRef = collection(db, 'users', userId, 'contacts');
    const snapshot = await getDocs(contactsRef);

    const contacts: Record<string, ContactData | null> = {
        general_manager: null,
        commercial: null,
        quality: null
    };

    snapshot.forEach(doc => {
        const data = doc.data() as ContactData;
        contacts[data.type] = data;
    });

    return contacts as Record<ContactType, ContactData | null>;
};

export const getContact = async (
    userId: string,
    type: ContactType
): Promise<ContactData | null> => {
    const contactRef = doc(db, 'users', userId, 'contacts', type);
    const snapshot = await getDoc(contactRef);
    return snapshot.exists() ? snapshot.data() as ContactData : null;
};

// ========== Banking Info ==========

export interface BankingData {
    bankName: string;
    bankAddress?: string;
    accountNumber: string;
    accountType: string;
    bicSwift?: string;
    iban?: string;
    isPrimary?: boolean;
}

export const saveBankingInfo = async (
    userId: string,
    data: BankingData,
    isPrimary: boolean = true
): Promise<void> => {
    // Use 'primary' as document ID for the main account
    const accountId = isPrimary ? 'primary' : `account_${Date.now()}`;
    const bankingRef = doc(db, 'users', userId, 'banking', accountId);

    await setDoc(bankingRef, {
        ...data,
        isPrimary,
        updatedAt: serverTimestamp()
    }, { merge: true });
};

export const getPrimaryBankingInfo = async (
    userId: string
): Promise<BankingData | null> => {
    const bankingRef = doc(db, 'users', userId, 'banking', 'primary');
    const snapshot = await getDoc(bankingRef);
    return snapshot.exists() ? snapshot.data() as BankingData : null;
};

export const getAllBankingAccounts = async (
    userId: string
): Promise<BankingData[]> => {
    const bankingRef = collection(db, 'users', userId, 'banking');
    const snapshot = await getDocs(bankingRef);

    return snapshot.docs.map(doc => doc.data() as BankingData);
};

// ========== Credit Info ==========

export interface CreditInfoData {
    creditDays?: string;
    deliveryDays?: string;
    paymentMethod?: string;
    retentionEmail?: string;
}

export const saveCreditInfo = async (
    userId: string,
    data: CreditInfoData
): Promise<void> => {
    const creditRef = doc(db, 'users', userId, 'creditInfo', 'main');
    await setDoc(creditRef, {
        ...data,
        updatedAt: serverTimestamp()
    }, { merge: true });
};

export const getCreditInfo = async (
    userId: string
): Promise<CreditInfoData | null> => {
    const creditRef = doc(db, 'users', userId, 'creditInfo', 'main');
    const snapshot = await getDoc(creditRef);
    return snapshot.exists() ? snapshot.data() as CreditInfoData : null;
};

// ========== Internal Management (Manager-only) ==========

export interface InternalManagementData {
    induramaExecutive?: string;
    epiAuditor?: string;
    auditType?: string;
    evalDate?: string;
}

export const saveInternalManagement = async (
    userId: string,
    data: InternalManagementData
): Promise<void> => {
    const managementRef = doc(db, 'users', userId, 'internalManagement', 'main');
    await setDoc(managementRef, {
        ...data,
        updatedAt: serverTimestamp()
    }, { merge: true });
};

export const getInternalManagement = async (
    userId: string
): Promise<InternalManagementData | null> => {
    const managementRef = doc(db, 'users', userId, 'internalManagement', 'main');
    const snapshot = await getDoc(managementRef);
    return snapshot.exists() ? snapshot.data() as InternalManagementData : null;
};

// ========== Batch Save (All supplier data at once) ==========

export interface SupplierCompleteData {
    companyProfile?: CompanyProfileData;
    contacts?: {
        generalManager?: { name: string; email: string };
        commercial?: { name: string; email: string };
        quality?: { name: string; email: string };
    };
    banking?: BankingData;
    credit?: CreditInfoData;
}

/**
 * Save all supplier data in a single batch operation (atomic)
 */
export const saveAllSupplierData = async (
    userId: string,
    data: SupplierCompleteData
): Promise<void> => {
    const batch = writeBatch(db);

    // Company Profile
    if (data.companyProfile) {
        const profileRef = doc(db, 'users', userId, 'companyProfile', 'main');
        batch.set(profileRef, {
            ...data.companyProfile,
            updatedAt: serverTimestamp()
        }, { merge: true });
    }

    // Contacts
    if (data.contacts) {
        if (data.contacts.generalManager) {
            const gmRef = doc(db, 'users', userId, 'contacts', 'general_manager');
            batch.set(gmRef, {
                type: 'general_manager',
                ...data.contacts.generalManager,
                updatedAt: serverTimestamp()
            }, { merge: true });
        }

        if (data.contacts.commercial) {
            const commRef = doc(db, 'users', userId, 'contacts', 'commercial');
            batch.set(commRef, {
                type: 'commercial',
                ...data.contacts.commercial,
                updatedAt: serverTimestamp()
            }, { merge: true });
        }

        if (data.contacts.quality) {
            const qualRef = doc(db, 'users', userId, 'contacts', 'quality');
            batch.set(qualRef, {
                type: 'quality',
                ...data.contacts.quality,
                updatedAt: serverTimestamp()
            }, { merge: true });
        }
    }

    // Banking
    if (data.banking) {
        const bankRef = doc(db, 'users', userId, 'banking', 'primary');
        batch.set(bankRef, {
            ...data.banking,
            isPrimary: true,
            updatedAt: serverTimestamp()
        }, { merge: true });
    }

    // Credit
    if (data.credit) {
        const creditRef = doc(db, 'users', userId, 'creditInfo', 'main');
        batch.set(creditRef, {
            ...data.credit,
            updatedAt: serverTimestamp()
        }, { merge: true });
    }

    await batch.commit();
};

/**
 * Load all supplier data at once
 */
export const loadAllSupplierData = async (
    userId: string
): Promise<SupplierCompleteData> => {
    const [profile, contacts, banking, credit] = await Promise.all([
        getCompanyProfile(userId),
        getAllContacts(userId),
        getPrimaryBankingInfo(userId),
        getCreditInfo(userId)
    ]);

    return {
        companyProfile: profile || undefined,
        contacts: {
            generalManager: contacts.general_manager ? {
                name: contacts.general_manager.name,
                email: contacts.general_manager.email
            } : undefined,
            commercial: contacts.commercial ? {
                name: contacts.commercial.name,
                email: contacts.commercial.email
            } : undefined,
            quality: contacts.quality ? {
                name: contacts.quality.name,
                email: contacts.quality.email
            } : undefined
        },
        banking: banking || undefined,
        credit: credit || undefined
    };
};

/**
 * Get count of active suppliers
 */
export const getSupplierCount = async (): Promise<number> => {
    try {
        const suppliersRef = collection(db, 'users');
        const q = query(suppliersRef, where('role', '==', 'proveedor'));
        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        console.error('Error fetching supplier count:', error);
        return 0;
    }
};

export interface SupplierSummary {
    id: string;
    name: string;
    email: string;
    location?: string;
    tags?: string[];
    score?: number;
    phone?: string;
    status?: string;
    certifications?: string[];
    productCategories?: string[]; // Added to support category display
}

export const getSuppliersList = async (): Promise<SupplierSummary[]> => {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', '==', 'proveedor'));
        const querySnapshot = await getDocs(q);

        const suppliers: SupplierSummary[] = [];

        // Fetch EPI submissions for all suppliers to get real scores
        const epiSubmissionsRef = collection(db, 'epi_submissions');
        const epiSnapshot = await getDocs(epiSubmissionsRef);

        // Create a map of supplierId -> most recent submission data (by createdAt)
        const submissionsMap = new Map<string, any>();
        epiSnapshot.docs.forEach(d => {
            const data = d.data();
            const supplierId = data.supplierId;
            if (!supplierId) return;

            const existing = submissionsMap.get(supplierId);
            const existingTime = existing?.createdAt?.toMillis?.() || existing?.createdAt || 0;
            const thisTime = data.createdAt?.toMillis?.() || data.createdAt || 0;

            if (!existing || thisTime > existingTime) {
                submissionsMap.set(supplierId, { id: d.id, ...data });
            }
        });

        const promises = querySnapshot.docs.map(async (docSnap) => {
            const userData = docSnap.data();
            const userId = docSnap.id;

            // Get EPI submission for this supplier (most recent)
            const submission = submissionsMap.get(userId) || {};

            // Fetch company profile for location and category
            const profileRef = doc(db, 'users', userId, 'companyProfile', 'main');
            const profileSnap = await getDoc(profileRef);
            const profileData = profileSnap.exists() ? profileSnap.data() as CompanyProfileData : null;

            const score = Math.round((submission.calculatedScore ?? submission.globalScore ?? 0) as number);

            // STRICT FILTER: Only show suppliers with Score > 80 AND (Approved or Active)
            const isApproved = userData.supplierStatus === 'epi_approved' || userData.supplierStatus === 'active' || userData.approved === true;

            if (!isApproved || score <= 80) {
                return null;
            }

            return {
                id: userId,
                name: userData.companyName || (userData.firstName ? `${userData.firstName} ${userData.lastName || ''}` : 'Proveedor'),
                email: userData.email || '',
                location: profileData?.city ? `${profileData.city}, ${profileData.country || ''}` : 'Ubicación no disponible',
                tags: userData.productTags && userData.productTags.length > 0 ? userData.productTags : (profileData?.category ? [profileData.category] : []),
                score: score,
                phone: profileData?.centralPhone || userData.phone || '',
                certifications: userData.certifications || [], // From user data
                productCategories: userData.productCategories || [], // Map from user data
                status: userData.supplierStatus
            };
        });

        const results = await Promise.all(promises);

        // Filter out null values (non-approved or low score suppliers)
        return results.filter(s => s !== null) as SupplierSummary[];

    } catch (error) {
        console.error('Error fetching suppliers list:', error);
        return [];
    }
};
