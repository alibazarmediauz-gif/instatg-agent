"use client";

import React from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { MessageSquare, Phone, Rocket, Database, Layers, ShieldCheck, BarChart4, Users } from "lucide-react";

const Solution: React.FC = () => {
    const { t } = useLanguage();

    const features = [
        {
            title: t('landing.solution.f1'),
            desc: t('landing.solution.f1_d'),
            icon: <MessageSquare size={28} />,
        },
        {
            title: t('landing.solution.f2'),
            desc: t('landing.solution.f2_d'),
            icon: <Phone size={28} />,
        },
        {
            title: t('landing.solution.f3'),
            desc: t('landing.solution.f3_d'),
            icon: <Rocket size={28} />,
        },
        {
            title: t('landing.solution.f4'),
            desc: t('landing.solution.f4_d'),
            icon: <Database size={28} />,
        }
    ];

    return (
        <section id="features" className="py-32 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 blur-[150px] pointer-events-none rounded-full"></div>

            <div className="container max-w-7xl px-6 relative z-10">
                <div className="text-center mb-24 animate-entrance">
                    <h2 className="text-5xl md:text-6xl font-black tracking-tightest mb-8 text-text-primary">
                        {t('landing.solution.title')}
                    </h2>
                    <p className="text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed font-medium">
                        {t('landing.solution.desc')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, idx) => (
                        <div key={idx} className={`glass-card p-10 rounded-[32px] border border-white/5 hover:border-accent/40 transition-all group animate-entrance stagger-${idx + 1}`}>
                            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-8 group-hover:scale-110 group-hover:bg-accent group-hover:text-white transition-all shadow-xl shadow-accent/5">
                                {feature.icon}
                            </div>
                            <h3 className="text-2xl font-black mb-4 tracking-tight">{feature.title}</h3>
                            <p className="text-base text-text-secondary leading-relaxed font-medium">
                                {feature.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Solution;
