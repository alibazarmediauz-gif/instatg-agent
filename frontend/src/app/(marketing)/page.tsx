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
                <section className="py-24 bg-bg-card relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-accent/5 blur-[120px] rounded-full translate-x-1/2 pointer-events-none"></div>

                    <div className="container max-w-6xl relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8">
                                    {t('security.title')}
                                </h2>
                                <p className="text-lg text-text-secondary mb-10 leading-relaxed">
                                    {t('security.desc')}
                                </p>

                                <div className="space-y-6">
                                    <div className="flex gap-4 p-4 rounded-xl bg-bg-body/50 border border-border/40">
                                        <div className="text-accent shrink-0 mt-1"><Server size={20} /></div>
                                        <div>
                                            <h4 className="font-bold mb-1">FastAPI Backend</h4>
                                            <p className="text-xs text-text-muted">High-performance asynchronous core built for speed and reliability at scale.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 p-4 rounded-xl bg-bg-body/50 border border-border/40">
                                        <div className="text-accent shrink-0 mt-1"><Shield size={20} /></div>
                                        <div>
                                            <h4 className="font-bold mb-1">Nginx Perimeter</h4>
                                            <p className="text-xs text-text-muted">Enterprise routing with secure reverse proxy and WebSocket optimization.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 p-4 rounded-xl bg-bg-body/50 border border-border/40">
                                        <div className="text-accent shrink-0 mt-1"><Lock size={20} /></div>
                                        <div>
                                            <h4 className="font-bold mb-1">Encrypted Core</h4>
                                            <p className="text-xs text-text-muted">End-to-end data safety in sync with CIS data protection standards.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="bg-bg-body border border-border p-8 rounded-3xl shadow-xl">
                                    <div className="flex items-center justify-between mb-8">
                                        <span className="text-xs font-bold uppercase tracking-widest text-text-muted">System Health</span>
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-500 font-bold uppercase">All Systems Operational</span>
                                    </div>
                                    <div className="space-y-4">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className="flex items-center gap-4">
                                                <div className="w-24 h-2 bg-border/40 rounded overflow-hidden">
                                                    <div className="h-full bg-accent animate-pulse" style={{ width: `${Math.random() * 60 + 40}%` }}></div>
                                                </div>
                                                <div className="flex-1 h-1.5 bg-border/20 rounded"></div>
                                                <span className="text-[10px] tabular-nums text-text-muted">0ms</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-12 flex justify-center">
                                        <div className="p-4 rounded-2xl bg-bg-card border border-border text-center w-full">
                                            <div className="text-2xl font-bold mb-1">99.9%</div>
                                            <div className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Platform Uptime</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <Pricing />

                {/* Final CTA */}
                <section className="py-24 bg-bg-body border-t border-border">
                    <div className="container max-w-4xl text-center">
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">
                            {t('cta_final.title')}
                        </h2>
                            <Link href="/dashboard" className="btn-primary px-12 py-5 text-xl font-bold min-w-[280px] shadow-2xl shadow-accent/20 flex items-center justify-center">
                                {t('cta_final.book')}
                            </Link>
                            <Link href="/dashboard" className="btn-secondary px-12 py-5 text-xl font-bold min-w-[280px] flex items-center justify-center">
                                {t('cta_final.start')}
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="py-12 border-t border-border/40 text-text-muted text-sm px-4">
                <div className="container max-w-6xl flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2 font-bold text-text-secondary uppercase tracking-tighter">
                        <Zap size={18} className="text-accent" /> SalesAI
                    </div>
                    <div className="flex gap-8 font-medium">
                        <a href="#" className="hover:text-text-primary transition-colors">Privacy</a>
                        <a href="#" className="hover:text-text-primary transition-colors">Terms</a>
                        <a href="#" className="hover:text-text-primary transition-colors">Security</a>
                    </div>
                    <div>
                        © 2026 SalesAI Enterprise. All rights reserved.
                    </div>
                </div>
            </footer>
        </div >
    );
}
