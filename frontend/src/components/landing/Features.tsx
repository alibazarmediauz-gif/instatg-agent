"use client";

import React from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { Cpu, Zap, Radio, Layout, ShieldCheck, Microscope, Database, Globe2 } from "lucide-react";

const Features: React.FC = () => {
    const { t } = useLanguage();

    const techFeatures = [
        { title: t('landing.features.f1_t'), icon: <Database size={20} />, desc: t('landing.features.f1_d') },
        { title: t('landing.features.f2_t'), icon: <Globe2 size={20} />, desc: t('landing.features.f2_d') },
        { title: t('landing.features.f3_t'), icon: <Radio size={20} />, desc: t('landing.features.f3_d') },
        { title: t('landing.features.f4_t'), icon: <ShieldCheck size={20} />, desc: t('landing.features.f4_d') },
        { title: t('landing.features.f5_t'), icon: <Cpu size={20} />, desc: t('landing.features.f5_d') },
        { title: t('landing.features.f6_t'), icon: <Layout size={20} />, desc: t('landing.features.f6_d') }
    ];

    return (
        <section className="py-24 bg-bg-card border-b border-border/40">
            <div className="container max-w-6xl">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold tracking-tight mb-4">{t('landing.features.title')}</h2>
                    <p className="text-text-secondary">{t('landing.features.desc')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {techFeatures.map((f, idx) => (
                        <div key={idx} className="p-6 rounded-xl border border-border/60 bg-bg-body hover:bg-bg-card hover:border-accent/30 transition-all flex flex-col gap-4">
                            <div className="text-accent">{f.icon}</div>
                            <h4 className="font-bold text-lg">{f.title}</h4>
                            <p className="text-xs text-text-muted leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
