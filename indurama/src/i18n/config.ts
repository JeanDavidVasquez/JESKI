import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import es from '../locales/es.json';
import en from '../locales/en.json';

// Función para obtener el idioma guardado
const getStoredLanguage = async () => {
    try {
        const lang = await AsyncStorage.getItem('app_language');
        return lang || 'es'; // Español por defecto
    } catch {
        return 'es';
    }
};

// Inicializar i18next
i18n
    .use(initReactI18next)
    .init({
        resources: {
            es: { translation: es },
            en: { translation: en }
        },
        lng: 'es', // Idioma inicial (se actualiza después)
        fallbackLng: 'es',
        interpolation: {
            escapeValue: false // React ya escapa los valores
        },
        compatibilityJSON: 'v4' // Para React Native
    });

// Cargar idioma guardado al iniciar
getStoredLanguage().then(lang => {
    i18n.changeLanguage(lang);
});

// Función helper para cambiar idioma y guardarlo
export const changeLanguage = async (lang: 'es' | 'en') => {
    await AsyncStorage.setItem('app_language', lang);
    await i18n.changeLanguage(lang);
};

// Función helper para obtener texto traducible de objetos con text/text_en
export const getLocalizedText = (item: { text: string; text_en?: string }) => {
    if (i18n.language === 'en' && item.text_en) {
        return item.text_en;
    }
    return item.text;
};

export default i18n;
