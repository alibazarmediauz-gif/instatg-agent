"use client";

import Link from "next/link";
import { Globe, Zap } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useLanguage } from "@/lib/LanguageContext";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function Header() {
    const { t, locale, setLocale } = useLanguage();
    const [scrolled, setScrolled] = useState(false);

    const switchLang = () => {
        const next: Record<string, "en" | "ru" | "uz"> = { uz: "ru", ru: "en", en: "uz" };
        setLocale(next[locale]);
    };

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <motion.header
            className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled
                ? "bg-slate-950/80 backdrop-blur-md border-b border-white/10 py-3"
                : "bg-transparent py-5"
                }`}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/20 group-hover:-translate-y-1 transition-transform duration-300">
                        <Zap size={20} className="fill-current" />
                    </div>
                    <div className="text-2xl font-black tracking-tight text-white">
                        Sales<span className="text-cyan-400">AI</span>
                    </div>
                </Link>

                <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-300 md:flex">
                    <a href="#features" className="hover:text-cyan-300 transition-colors uppercase tracking-wider text-xs">Features</a>
                    <a href="#pricing" className="hover:text-cyan-300 transition-colors uppercase tracking-wider text-xs">Pricing</a>
                </nav>

                <div className="flex items-center gap-3">
                    <button
                        onClick={switchLang}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-bold uppercase text-slate-200 transition-colors"
                    >
                        <Globe size={14} /> {locale}
                    </button>
                    <ThemeToggle />
                    <Link href="/dashboard" className="hidden rounded-xl bg-cyan-400 hover:bg-cyan-300 px-5 py-2.5 text-sm font-bold text-slate-950 transition-colors sm:inline-flex shadow-lg shadow-cyan-500/20">
                        {t("nav.control_center")}
                    </Link>
                </div>
            </div>
        </motion.header>
    );
}
