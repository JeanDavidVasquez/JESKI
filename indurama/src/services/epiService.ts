import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { EpiConfig } from '../types/epi';

const COLLECTION_NAME = 'epi_config';
const DOC_ID = 'default';

// Configuración por defecto por si no existe en BD
const defaultConfig: EpiConfig = {
    calidad: {
        totalWeight: 100,
        sections: [
            {
                id: 'default_s1',
                title: 'Nueva Sección (Calidad)',
                weight: 100,
                questions: [
                    {
                        id: 'default_q1',
                        text: '¿El proveedor cuenta con certificación ISO 9001? (Pregunta de ejemplo)'
                    }
                ]
            }
        ]
    },
    abastecimiento: {
        totalWeight: 100,
        sections: [
            {
                id: 'default_a1',
                title: 'Nueva Sección (Abastecimiento)',
                weight: 100,
                questions: [
                    {
                        id: 'default_q2',
                        text: '¿El proveedor cumple con los tiempos de entrega? (Pregunta de ejemplo)'
                    }
                ]
            }
        ]
    }
};

export const EpiService = {
    getEpiConfig: async (): Promise<EpiConfig> => {
        try {
            console.log('Fetching EPI config from Firestore...');
            const docRef = doc(db, COLLECTION_NAME, DOC_ID);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                console.log('Config found in Firestore');
                return docSnap.data() as EpiConfig;
            } else {
                console.log('No config found, creating default in Firestore');
                // Intentamos crearla, pero si falla (por permisos), igual retornamos la default para no bloquear la app
                try {
                    await setDoc(docRef, defaultConfig);
                } catch (writeError) {
                    console.warn("Could not write default config to Firestore (permissions?), using local default:", writeError);
                }
                return defaultConfig;
            }
        } catch (error) {
            console.error("Error al obtener config EPI:", error);
            // Fallback crítico: Si falla la conexión o lo que sea, devolvemos la config local para que la UI cargue
            return defaultConfig;
        }
    },

    saveEpiConfig: async (newConfig: EpiConfig): Promise<boolean> => {
        try {
            console.log('Saving EPI config to Firestore...');
            const docRef = doc(db, COLLECTION_NAME, DOC_ID);
            await setDoc(docRef, newConfig);
            console.log('Config saved successfully');
            return true;
        } catch (error) {
            console.error("Error al guardar config EPI:", error);
            throw error;
        }
    },

    validateWeights: (config: EpiConfig): { isValid: boolean; messages: string[] } => {
        const messages: string[] = [];
        let isValid = true;

        // Validar Calidad
        const totalCalidad = config.calidad.sections.reduce((sum, section) => sum + section.weight, 0);
        if (Math.abs(totalCalidad - 100) > 0.1) {
            isValid = false;
            messages.push(`El peso total de Calidad es ${totalCalidad}%, debe ser 100%.`);
        }

        // Validar Abastecimiento
        const totalAbastecimiento = config.abastecimiento.sections.reduce((sum, section) => sum + section.weight, 0);
        if (Math.abs(totalAbastecimiento - 100) > 0.1) {
            isValid = false;
            messages.push(`El peso total de Abastecimiento es ${totalAbastecimiento}%, debe ser 100%.`);
        }

        return { isValid, messages };
    },

    // --- NUEVO: Métodos para Evaluaciones ---

    saveEvaluation: async (evaluation: import('../types/evaluation').SupplierEvaluation): Promise<string> => {
        try {
            console.log('Saving evaluation to Firestore...', evaluation);
            const { addDoc, collection } = require('firebase/firestore');
            const colRef = collection(db, 'evaluations');

            // Asegurar timestamp
            const finalData = {
                ...evaluation,
                createdAt: evaluation.createdAt || Date.now(),
                updatedAt: Date.now()
            };

            const docRef = await addDoc(colRef, finalData);
            console.log('Evaluation saved with ID:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error("Error al guardar evaluación:", error);
            throw error;
        }
    },

    getEvaluationsBySupplier: async (supplierId: string): Promise<import('../types/evaluation').SupplierEvaluation[]> => {
        try {
            const { collection, query, where, getDocs, orderBy } = require('firebase/firestore');
            const colRef = collection(db, 'evaluations');
            const q = query(
                colRef,
                where('supplierId', '==', supplierId),
                orderBy('createdAt', 'desc')
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error al obtener evaluaciones:", error);
            return [];
        }
    }
};
