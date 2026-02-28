'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type CurrencyCode = 'USD' | 'UZS' | 'RUB' | 'EUR' | 'KZT';

interface CurrencyContextType {
    currency: CurrencyCode;
    setCurrency: (currency: CurrencyCode) => void;
    formatCurrency: (amount: number, minimumFractionDigits?: number, maximumFractionDigits?: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const currencyMap: Record<CurrencyCode, { symbol: string; rate: number; position: 'before' | 'after' }> = {
    USD: { symbol: '$', rate: 1, position: 'before' },
    UZS: { symbol: ' UZS', rate: 12500, position: 'after' },
    RUB: { symbol: '₽', rate: 90, position: 'after' },
    EUR: { symbol: '€', rate: 0.92, position: 'before' },
    KZT: { symbol: ' ₸', rate: 450, position: 'after' }
};

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrency] = useState<CurrencyCode>('USD');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('app_currency') as CurrencyCode | null;
        if (saved && currencyMap[saved]) {
            setCurrency(saved);
        }
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        localStorage.setItem('app_currency', currency);
    }, [currency, mounted]);

    const formatCurrency = (amount: number, minimumFractionDigits: number = 2, maximumFractionDigits: number = 2): string => {
        // Here we do a simple multiplication for demonstration purposes assuming the base value is always USD.
        // In a real application, you might want the backend to return numbers in the selected currency
        // or a fixed base currency that the frontend converts. We assume base is USD `amount`.
        const meta = currencyMap[currency];
        const convertedAmount = amount * meta.rate;

        // For large currencies like UZS, we often don't want decimals for large numbers
        if (currency === 'UZS' || currency === 'KZT') {
            minimumFractionDigits = 0;
            maximumFractionDigits = 0;
        }

        const formattedNumber = convertedAmount.toLocaleString(undefined, {
            minimumFractionDigits,
            maximumFractionDigits
        });

        if (meta.position === 'before') {
            return `${meta.symbol}${formattedNumber}`;
        } else {
            return `${formattedNumber}${meta.symbol}`;
        }
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
}
