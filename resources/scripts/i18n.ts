import i18n from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';

import en from './locales/en.json';
import de from './locales/de.json';

const LANGUAGE_KEY = 'panel_language';

const getInitialLanguage = (): string => {
    if (typeof window === 'undefined') {
        return 'en';
    }

    const stored = localStorage.getItem(LANGUAGE_KEY);
    if (stored === 'en' || stored === 'de') {
        return stored;
    }

    return 'en';
};

i18n.use(initReactI18next).init({
    resources: {
        en: { translation: en },
        de: { translation: de },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
        escapeValue: true,
    },
    react: {
        useSuspense: false,
        defaultTransParent: undefined,
    },
});

declare module 'i18next' {
    interface CustomTypeOptions {
        returnNull: false;
        returnObjects: false;
    }
}

export const setPanelLanguage = (language: 'en' | 'de') => {
    localStorage.setItem(LANGUAGE_KEY, language);
    void i18n.changeLanguage(language);
};

export const getPanelLanguage = (): 'en' | 'de' => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(LANGUAGE_KEY) : null;
    return stored === 'de' ? 'de' : 'en';
};

export { I18nextProvider };
export default i18n;
