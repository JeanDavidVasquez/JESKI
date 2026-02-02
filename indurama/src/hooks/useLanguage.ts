/**
 * Custom hook para manejo de idioma
 * Proporciona acceso fácil a traducciones y cambio de idioma
 */
import { useTranslation } from 'react-i18next';
import { changeLanguage, getLocalizedText } from '../i18n/config';

export const useLanguage = () => {
    const { t, i18n } = useTranslation();

    const currentLanguage = i18n.language as 'es' | 'en';
    const isSpanish = currentLanguage === 'es';
    const isEnglish = currentLanguage === 'en';

    const toggleLanguage = async () => {
        const newLang = currentLanguage === 'es' ? 'en' : 'es';
        await changeLanguage(newLang);
    };

    const setLanguage = async (lang: 'es' | 'en') => {
        await changeLanguage(lang);
    };

    // Helper para obtener texto localizado de objetos EPI
    const getEpiText = (item: { text: string; text_en?: string }) => {
        return getLocalizedText(item);
    };

    // Helper para obtener título localizado de secciones EPI
    const getEpiTitle = (item: { title: string; title_en?: string }) => {
        if (isEnglish && item.title_en) {
            return item.title_en;
        }
        return item.title;
    };

    return {
        t,                  // Función de traducción
        currentLanguage,    // 'es' | 'en'
        isSpanish,
        isEnglish,
        toggleLanguage,     // Cambiar entre es/en
        setLanguage,        // Establecer idioma específico
        getEpiText,         // Obtener texto EPI localizado
        getEpiTitle,        // Obtener título sección EPI localizado
    };
};

export default useLanguage;
