'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import enDict from '../messages/en.json';
import ruDict from '../messages/ru.json';
import uzDict from '../messages/uz.json';

type Locale = 'en' | 'ru' | 'uz';
type Dictionary = Record<string, any>;

interface LanguageContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocale] = useState<Locale>('uz'); // Defaulting to Uzbek
    const [dict, setDict] = useState<Dictionary>(uzDict);

    useEffect(() => {
        // Load preference from localStorage safely
        const savedLocale = localStorage.getItem('app_locale') as Locale;
        if (savedLocale === 'en' || savedLocale === 'ru' || savedLocale === 'uz') {
            setLocale(savedLocale);
        }
    }, []);

    useEffect(() => {
        setDict(locale === 'en' ? enDict : locale === 'ru' ? ruDict : uzDict);
        localStorage.setItem('app_locale', locale);
    }, [locale]);

    const t = (keyStr: string): string => {
        const keys = keyStr.split('.');
        let val: any = dict;
        for (const k of keys) {
            val = val?.[k];
            if (val === undefined) break;
        }
        return val !== undefined ? String(val) : keyStr;
    };

    return (
        <LanguageContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
