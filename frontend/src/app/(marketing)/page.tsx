"use client";

import React from "react";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Problem from "@/components/landing/Problem";
import Solution from "@/components/landing/Solution";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import Integrations from "@/components/landing/Integrations";
import Pricing from "@/components/landing/Pricing";
import { useLanguage } from "@/lib/LanguageContext";
import { Shield, Lock, Server, Zap } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-bg-body text-text-primary">
            <Header />

            <main>
                <Hero />

                <Integrations />

                <Problem />

                <Solution />

                <HowItWorks />

                <Features />

                {/* Security Section (Enterprise Focus) */}
                <section className="py-40 relative overflow-hidden">
                    <div className="absolute top-1/2 left-0 w-[800px] h-[800px] bg-accent/5 blur-[150px] rounded-full -translate-x-1/2 pointer-events-none"></div>

                    <div className="container max-w-7xl px-6 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                            <div className="animate-entrance">
                                <h2 className="text-5xl md:text-6xl font-black tracking-tightest mb-10 text-text-primary">
                                    {t('landing.security.title')}
                                </h2>
                                <p className="text-xl text-text-secondary mb-14 leading-relaxed font-medium">
                                    {t('landing.security.desc')}
                                </p>

                                <div className="space-y-6">
                                    <div className="flex gap-6 p-8 rounded-[32px] glass-card border border-white/5 hover:border-white/10 transition-all group">
                                        <div className="text-accent shrink-0 mt-1 bg-accent/10 w-12 h-12 rounded-xl flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all"><Server size={24} /></div>
                                        <div>
                                            <h4 className="text-xl font-black mb-2 tracking-tight">{t('landing.security.f1_t')}</h4>
                                            <p className="text-base text-text-secondary font-medium">{t('landing.security.f1_d')}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-6 p-8 rounded-[32px] glass-card border border-white/5 hover:border-white/10 transition-all group">
                                        <div className="text-accent shrink-0 mt-1 bg-accent/10 w-12 h-12 rounded-xl flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all"><Shield size={24} /></div>
                                        <div>
                                            <h4 className="text-xl font-black mb-2 tracking-tight">{t('landing.security.f2_t')}</h4>
                                            <p className="text-base text-text-secondary font-medium">{t('landing.security.f2_d')}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-6 p-8 rounded-[32px] glass-card border border-white/5 hover:border-white/10 transition-all group">
                                        <div className="text-accent shrink-0 mt-1 bg-accent/10 w-12 h-12 rounded-xl flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all"><Lock size={24} /></div>
                                        <div>
                                            <h4 className="text-xl font-black mb-2 tracking-tight">{t('landing.security.f3_t')}</h4>
                                            <p className="text-base text-text-secondary font-medium">{t('landing.security.f3_d')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative animate-entrance stagger-2">
                                <div className="glass-card border border-white/10 p-12 rounded-[40px] shadow-[0_0_80px_rgba(0,0,0,0.4)]">
                                    <div className="flex items-center justify-between mb-12">
                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-text-muted">System Health</span>
                                        <span className="text-[10px] px-4 py-1.5 rounded-full bg-green-500/10 text-green-500 font-black uppercase tracking-widest ring-1 ring-green-500/20">All Systems Operational</span>
                                    </div>
                                    <div className="space-y-6">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className="flex items-center gap-6">
                                                <div className="w-32 h-2.5 bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-accent animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${40 + (i * 12) % 60}%` }}></div>
                                                </div>
                                                <div className="flex-1 h-px bg-white/5"></div>
                                                <span className="text-xs tabular-nums text-text-muted font-black">0ms</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-16 flex justify-center">
                                        <div className="p-8 rounded-[32px] bg-white/5 border border-white/5 text-center w-full group hover:border-white/10 transition-all">
                                            <div className="text-4xl font-black mb-2 tracking-tighter text-text-primary">99.9%</div>
                                            <div className="text-[10px] text-text-muted uppercase font-black tracking-[0.3em]">Platform Uptime</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <Pricing />

                {/* Final CTA */}
                <section className="py-40 relative">
                    <div className="container max-w-5xl text-center px-6 animate-entrance">
                        <h2 className="text-6xl md:text-8xl font-black tracking-tightest mb-12 leading-[0.95]">
                            {t('landing.cta_final.title')}
                        </h2>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                            <Link href="/dashboard" className="btn-primary px-14 py-6 text-2xl font-black min-w-[320px] shadow-2xl shadow-accent/20 hover:shadow-accent/40 rounded-2xl hover:-translate-y-1 transition-all">
                                {t('landing.cta_final.book')}
                            </Link>
                            <Link href="/dashboard" className="btn-secondary px-14 py-6 text-2xl font-black min-w-[320px] rounded-2xl glass-card hover:bg-white/5 hover:-translate-y-1 transition-all">
                                {t('landing.cta_final.start')}
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="py-20 border-t border-white/5 text-text-muted text-sm px-6">
                <div className="container max-w-7xl flex flex-col md:flex-row justify-between items-center gap-12">
                    <div className="flex items-center gap-3 font-black text-2xl text-text-primary tracking-tighter uppercase group cursor-pointer">
                        <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all">
                            <Zap size={20} className="fill-current" />
                        </div>
                        Sales<span className="text-accent">AI</span>
                    </div>
                    <div className="flex gap-12 font-black uppercase tracking-[0.2em] text-[10px]">
                        <a href="#" className="hover:text-accent transition-all hover:scale-105">Privacy</a>
                        <a href="#" className="hover:text-accent transition-all hover:scale-105">Terms</a>
                        <a href="#" className="hover:text-accent transition-all hover:scale-105">Security</a>
                    </div>
                    <div className="font-medium opacity-40">
                        © 2026 SalesAI Enterprise. All rights reserved.
                    </div>
                </div>
            </footer>
        </div >
    );
}
