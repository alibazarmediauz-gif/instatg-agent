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

const dictMap: Record<Locale, Dictionary> = { en: enDict, ru: ruDict, uz: uzDict };

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    // Always start with 'uz' to match server render — avoids hydration mismatch
    const [locale, setLocale] = useState<Locale>('uz');
    const [dict, setDict] = useState<Dictionary>(uzDict);
    const [mounted, setMounted] = useState(false);

    // After mount, apply saved locale from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('app_locale') as Locale | null;
        if (saved && dictMap[saved]) {
            setLocale(saved);
            setDict(dictMap[saved]);
        }
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        setDict(dictMap[locale]);
        localStorage.setItem('app_locale', locale);
    }, [locale, mounted]);

    const t = (keyStr: string): string => {
        const keys = keyStr.split('.');
        let val: any = dict;
        for (const k of keys) {
            val = val?.[k];
            if (val === undefined) break;
        }
        if (val === undefined && keyStr.includes('dashboard')) {
            console.log('Language Debug: Key not found:', keyStr, 'in dict keys:', Object.keys(dict || {}));
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
