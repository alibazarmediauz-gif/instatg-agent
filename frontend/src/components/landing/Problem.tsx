"use client";

import React from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { AlertCircle, Clock, XCircle, TrendingDown, Users } from "lucide-react";

const Problem: React.FC = () => {
    const { t } = useLanguage();

    const pains = [
        { title: t('landing.problem.p1'), icon: <Clock size={20} /> },
        { title: t('landing.problem.p2'), icon: <AlertCircle size={20} /> },
        { title: t('landing.problem.p3'), icon: <XCircle size={20} /> },
        { title: t('landing.problem.p4'), icon: <TrendingDown size={20} /> },
        { title: t('landing.problem.p5'), icon: <Users size={20} /> },
    ];

    return (
        <section className="py-24 bg-bg-card border-b border-border/50">
            <div className="container max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-4xl font-bold tracking-tight mb-8">
                            {t('landing.problem.title')}
                        </h2>
                        <div className="space-y-4">
                            {pains.map((pain, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-bg-body border border-red-500/10 hover:border-red-500/30 transition-colors">
                                    <div className="text-red-500 shrink-0">{pain.icon}</div>
                                    <span className="font-medium text-text-secondary">{pain.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-0 bg-red-500/5 blur-[100px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <div className="bg-bg-body border border-border/40 p-8 rounded-2xl relative z-10">
                            <div className="flex items-center justify-between mb-8 opacity-40">
                                <div className="h-4 w-32 bg-border rounded"></div>
                                <div className="h-4 w-12 bg-border rounded"></div>
                            </div>
                            <div className="space-y-6">
                                <div className="p-4 rounded-lg border border-border/30 border-dashed text-text-muted text-xs">
                                    [Lead #8921] - No call for 48 hours
                                </div>
                                <div className="p-4 rounded-lg border border-border/30 border-dashed text-text-muted text-xs">
                                    [Lead #8922] - "Manager will return" - 3 days ago
                                </div>
                                <div className="p-12 flex items-center justify-center border border-red-500/20 bg-red-500/5 rounded-xl">
                                    <TrendingDown size={48} className="text-red-500/40" />
                                </div>
                            </div>
                            <div className="mt-8 text-center text-red-500/60 font-bold uppercase tracking-widest text-[10px]">
                                Revenue Leak Detected
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Problem;
