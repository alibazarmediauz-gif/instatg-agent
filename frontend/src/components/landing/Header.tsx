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
        <header className="landing-header">
            <div className="container landing-nav">
                <div className="landing-logo">
                    <Zap className="text-accent" size={24} />
                    <span className="font-bold text-xl tracking-tight uppercase">
                        {t('brand.name')}
                    </span>
                </div>

                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
                    <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
                    <a href="#integrations" className="hover:text-text-primary transition-colors">Integrations</a>
                    <a href="#pricing" className="hover:text-text-primary transition-colors">Pricing</a>
                </nav>

                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleLanguage}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-xs font-bold uppercase hover:bg-bg-body transition-colors"
                    >
                        <Globe size={14} />
                        {locale}
                    </button>
                    <ThemeToggle />
                    <Link href="/dashboard" className="btn-primary text-sm px-6 py-2">
                        {t('nav.control_center')}
                    </Link>
                </div>
            </div>
        </header>
    );
};

export default Header;
