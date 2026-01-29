import { collection, getDocs, query, orderBy, addDoc, where } from 'firebase/firestore';
import { db } from './firebaseConfig';

export interface Company {
    id: string;
    name: string;
    isActive: boolean;
}

export interface Department {
    id: string;
    name: string;
    isActive: boolean;
}

/**
 * Service to manage Master Data (Companies, Departments, etc.)
 */
export const MasterDataService = {

    /**
     * Get all active companies
     */
    getCompanies: async (): Promise<Company[]> => {
        try {
            const q = query(collection(db, 'companies'), orderBy('name'));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                // Optional: Seed if empty (for dev convenience, removing in prod)
                // return [];
            }

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Company));
        } catch (error) {
            console.error('Error fetching companies:', error);
            // Fallback for demo if DB is empty or fails
            return [];
        }
    },

    /**
     * Get departments for a specific company
     */
    getDepartments: async (companyId: string): Promise<Department[]> => {
        if (!companyId) return [];
        try {
            const q = query(collection(db, `companies/${companyId}/departments`), orderBy('name'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Department));
        } catch (error) {
            console.error('Error fetching departments:', error);
            return [];
        }
    },

    /**
     * Seed initial data (Helper for setup)
     * Checks if data exists, if not (or if incomplete), fills it.
     */
    seedInitialData: async () => {
        const companiesData = [
            {
                name: 'Indurama',
                departments: ['Producción', 'Logística', 'Calidad', 'Mantenimiento', 'Comercial']
            },
            {
                name: 'Mercandina',
                departments: ['Ventas', 'Marketing', 'Finanzas', 'Bodega']
            },
            {
                name: 'Serinco',
                departments: ['Servicio Técnico', 'Atención al Cliente', 'Repuestos']
            },
            {
                name: 'Marcimex',
                departments: ['Ventas Retail', 'Crédito y Cobranzas', 'Marketing', 'Recursos Humanos']
            },
            {
                name: 'Tarpuq',
                departments: ['Sistemas', 'Desarrollo', 'Innovación', 'Soporte']
            }
        ];

        try {
            console.log('Checking/Seeding Master Data...');

            for (const compData of companiesData) {
                // 1. Check if Company exists by name
                const q = query(collection(db, 'companies'), where('name', '==', compData.name));
                const snapshot = await getDocs(q);

                let companyId = '';

                if (snapshot.empty) {
                    console.log(`Creating company: ${compData.name}`);
                    const newCompRef = await addDoc(collection(db, 'companies'), {
                        name: compData.name,
                        isActive: true
                    });
                    companyId = newCompRef.id;
                } else {
                    companyId = snapshot.docs[0].id;
                }

                // 2. Check/Add Departments for this company
                const departmentsRef = collection(db, `companies/${companyId}/departments`);
                const existingDeptsSnap = await getDocs(departmentsRef);

                if (existingDeptsSnap.empty) {
                    console.log(`Seeding departments for ${compData.name}...`);
                    for (const deptName of compData.departments) {
                        await addDoc(departmentsRef, { name: deptName, isActive: true });
                    }
                }
            }
        } catch (error) {
            console.error('Error seeding data:', error);
        }
    }
};
