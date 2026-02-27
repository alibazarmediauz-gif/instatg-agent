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
        <section className="py-32 relative">
            <div className="container max-w-7xl px-6 relative z-10">
                <div className="text-center mb-24 animate-entrance">
                    <h2 className="text-5xl md:text-6xl font-black tracking-tightest mb-8 text-text-primary">
                        {t('landing.features.title')}
                    </h2>
                    <p className="text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed font-medium">
                        {t('landing.features.desc')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {techFeatures.map((f, idx) => (
                        <div key={idx} className={`glass-card p-10 rounded-[32px] border border-white/5 hover:border-accent/40 transition-all flex flex-col gap-6 animate-entrance stagger-${(idx % 3) + 1}`}>
                            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-lg shadow-accent/5">
                                {f.icon}
                            </div>
                            <h4 className="font-black text-2xl tracking-tight">{f.title}</h4>
                            <p className="text-base text-text-secondary leading-relaxed font-medium">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
