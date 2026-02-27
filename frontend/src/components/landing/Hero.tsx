"use client";

import React from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

const Hero: React.FC = () => {
    const { t } = useLanguage();

    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 overflow-hidden px-6">
            <div className="glow-bg"></div>

            <div className="max-w-5xl text-center z-10 relative">
                <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-accent/10 text-accent text-[11px] font-black tracking-[0.2em] uppercase mb-10 border border-accent/20 animate-entrance shadow-2xl shadow-accent/10">
                    <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse"></span>
                    {t('landing.hero.badge')}
                </div>

                <h1 className="text-6xl md:text-8xl font-black tracking-tightest mb-10 text-balance text-text-primary animate-entrance stagger-1 leading-[0.95]">
                    {t('landing.hero.title')}
                </h1>

                <p className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto mb-14 leading-relaxed animate-entrance stagger-2 font-medium">
                    {t('landing.hero.subtitle')}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24 animate-entrance stagger-3">
                    <Link href="/dashboard" className="btn-primary px-10 py-5 text-xl font-black min-w-[280px] rounded-2xl shadow-2xl shadow-accent/20 hover:shadow-accent/40 active:scale-95 transition-all">
                        {t('landing.hero.cta_primary')}
                    </Link>
                    <Link href="/dashboard" className="btn-secondary px-10 py-5 text-xl font-black min-w-[280px] rounded-2xl glass-card hover:bg-white/5 active:scale-95 transition-all">
                        {t('landing.hero.cta_secondary')}
                    </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-text-secondary text-xs font-black uppercase tracking-widest animate-entrance stagger-4 opacity-70">
                    <div className="flex items-center justify-center gap-3">
                        <CheckCircle size={18} className="text-accent" />
                        {t('landing.hero.check1')}
                    </div>
                    <div className="flex items-center justify-center gap-3">
                        <CheckCircle size={18} className="text-accent" />
                        {t('landing.hero.check2')}
                    </div>
                    <div className="flex items-center justify-center gap-3">
                        <CheckCircle size={18} className="text-accent" />
                        {t('landing.hero.check3')}
                    </div>
                    <div className="flex items-center justify-center gap-3">
                        <CheckCircle size={18} className="text-accent" />
                        {t('landing.hero.check4')}
                    </div>
                </div>
            </div>

            {/* Premium Dashboard Mockup Placeholder */}
            <div className="mt-32 w-full max-w-7xl relative animate-entrance stagger-4 px-4">
                <div className="absolute -inset-4 bg-gradient-to-b from-accent/20 to-transparent blur-[120px] opacity-30 pointer-events-none rounded-full"></div>
                <div className="glass-card border border-white/10 rounded-[32px] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden relative z-10 transition-transform duration-700 hover:scale-[1.01]">
                    <div className="absolute top-0 left-0 w-full h-12 border-b border-white/5 bg-white/5 flex items-center px-6 gap-3">
                        <div className="flex gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-500/30"></span>
                            <span className="w-3 h-3 rounded-full bg-yellow-500/30"></span>
                            <span className="w-3 h-3 rounded-full bg-green-500/30"></span>
                        </div>
                        <div className="mx-auto bg-black/40 border border-white/10 text-[10px] px-10 py-1.5 rounded-full text-text-muted flex items-center gap-2 font-bold tracking-tight">
                            <span className="w-2 h-2 rounded-full border border-white/20"></span>
                            app.salesai.uz
                        </div>
                    </div>
                    <div className="p-12 pt-20 grid grid-cols-12 gap-8 h-full aspect-[16/9]">
                        <div className="col-span-3 h-full flex flex-col gap-6">
                            <div className="h-24 bg-white/5 rounded-2xl animate-pulse"></div>
                            <div className="flex-1 bg-white/5 rounded-2xl animate-pulse"></div>
                        </div>
                        <div className="col-span-6 h-full bg-black/20 rounded-[24px] border border-white/5 p-10">
                            <div className="h-8 w-40 bg-white/10 rounded-lg mb-12 animate-pulse"></div>
                            <div className="space-y-6">
                                <div className="h-5 w-full bg-white/5 rounded-full animate-pulse"></div>
                                <div className="h-5 w-3/4 bg-white/5 rounded-full animate-pulse"></div>
                                <div className="h-5 w-5/6 bg-white/5 rounded-full animate-pulse"></div>
                                <div className="h-5 w-1/2 bg-white/5 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                        <div className="col-span-3 h-full flex flex-col gap-6">
                            <div className="h-40 bg-white/5 rounded-2xl animate-pulse"></div>
                            <div className="flex-1 bg-white/5 rounded-2xl animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
