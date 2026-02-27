"use client";

import React from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { CheckCircle } from "lucide-react";

const Hero: React.FC = () => {
    const { t } = useLanguage();

    return (
        <section className="landing-hero min-h-[90vh] flex flex-col items-center justify-center pt-24 pb-12 overflow-hidden px-4">
            <div className="max-w-4xl text-center z-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-bold tracking-widest uppercase mb-6 border border-accent/20">
                    <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse"></span>
                    Enterprise AI Sales Platform
                </div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-balance text-text-primary">
                    {t('landing.hero.title')}
                </h1>

                <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
                    {t('landing.hero.subtitle')}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                    <button className="btn-primary px-8 py-4 text-lg font-bold min-w-[240px]">
                        {t('landing.hero.cta_primary')}
                    </button>
                    <button className="btn-secondary px-8 py-4 text-lg font-bold min-w-[240px]">
                        {t('landing.hero.cta_secondary')}
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-text-muted text-sm font-medium border-t border-border/50 pt-8 mt-4">
                    <div className="flex items-center justify-center gap-2">
                        <CheckCircle size={16} className="text-accent" />
                        amoCRM Native
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        <CheckCircle size={16} className="text-accent" />
                        Voice & Chat AI
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        <CheckCircle size={16} className="text-accent" />
                        Auto Dialer
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        <CheckCircle size={16} className="text-accent" />
                        UZ/RU Support
                    </div>
                </div>
            </div>

            {/* Premium Dashboard Mockup Placeholder */}
            <div className="mt-20 w-full max-w-6xl relative">
                <div className="absolute inset-0 bg-accent/20 blur-[100px] opacity-20 pointer-events-none rounded-full"></div>
                <div className="bg-bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden aspect-video relative z-0">
                    <div className="absolute top-0 left-0 w-full h-10 border-b border-border bg-bg-body flex items-center px-4 gap-2">
                        <div className="flex gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500/50"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500/50"></span>
                        </div>
                        <div className="mx-auto bg-bg-card border border-border text-[10px] px-8 py-1 rounded-md text-text-muted flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full border border-border"></span>
                            app.salesai.uz
                        </div>
                    </div>
                    <div className="p-8 pt-16 grid grid-cols-12 gap-4 h-full">
                        <div className="col-span-3 h-full flex flex-col gap-4">
                            <div className="h-20 bg-bg-body rounded-lg animate-pulse"></div>
                            <div className="h-40 bg-bg-body rounded-lg animate-pulse"></div>
                        </div>
                        <div className="col-span-6 h-full bg-bg-body rounded-lg border border-border/40 p-6">
                            <div className="h-6 w-32 bg-border rounded mb-8 animate-pulse"></div>
                            <div className="space-y-4">
                                <div className="h-4 w-full bg-border/40 rounded animate-pulse"></div>
                                <div className="h-4 w-3/4 bg-border/40 rounded animate-pulse"></div>
                                <div className="h-4 w-5/6 bg-border/40 rounded animate-pulse"></div>
                                <div className="h-4 w-1/2 bg-border/40 rounded animate-pulse"></div>
                            </div>
                        </div>
                        <div className="col-span-3 h-full flex flex-col gap-4">
                            <div className="h-32 bg-bg-body rounded-lg animate-pulse"></div>
                            <div className="h-28 bg-bg-body rounded-lg animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
