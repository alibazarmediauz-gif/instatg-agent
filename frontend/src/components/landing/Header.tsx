"use client";

import React from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { CheckCircle, Zap, Shield, BarChart3, Globe } from "lucide-react";
import Link from "next/link";
import ThemeToggle from "../ThemeToggle";

const Header: React.FC = () => {
    const { t, locale, setLocale } = useLanguage();

    const toggleLanguage = () => {
        const next: Record<string, 'en' | 'ru' | 'uz'> = { 'uz': 'ru', 'ru': 'en', 'en': 'uz' };
        setLocale(next[locale]);
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 glass-header">
            <div className="container max-w-7xl h-20 flex items-center justify-between px-6">
                <div className="flex items-center gap-2.5 font-extrabold text-2xl tracking-tighter text-text-primary">
                    <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
                        <Zap size={22} className="text-white fill-white" />
                    </div>
                    <span>{t('brand.name').replace('AI', '')}<span className="text-accent">AI</span></span>
                </div>

                <nav className="hidden lg:flex items-center gap-10 text-sm font-semibold text-text-secondary tracking-tight">
                    <a href="#features" className="hover:text-accent transition-all hover:scale-105 active:scale-95">{t('landing.header.features')}</a>
                    <a href="#integrations" className="hover:text-accent transition-all hover:scale-105 active:scale-95">{t('landing.header.integrations')}</a>
                    <a href="#pricing" className="hover:text-accent transition-all hover:scale-105 active:scale-95">{t('landing.header.pricing')}</a>
                </nav>

                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleLanguage}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border text-[10px] font-black uppercase tracking-wider hover:bg-white/5 transition-all text-text-secondary"
                    >
                        <Globe size={13} className="text-accent" />
                        {locale}
                    </button>
                    <ThemeToggle />
                    <Link href="/dashboard" className="hidden sm:flex btn-primary px-6 py-2.5 rounded-xl shadow-xl shadow-accent/20 hover:shadow-accent/40 transition-all font-bold tracking-tight text-sm">
                        {t('nav.control_center')}
                    </Link>
                </div>
            </div>
        </header>
    );
};

export default Header;
