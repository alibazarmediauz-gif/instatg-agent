"use client";

import React from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { MessageSquare, Phone, Rocket, Database, Layers, ShieldCheck, BarChart4, Users } from "lucide-react";

const Solution: React.FC = () => {
    const { t } = useLanguage();

    const features = [
        {
            title: t('solution.f1'),
            desc: "Human-like chat interactions on Telegram and Instagram with instant conversion potential.",
            icon: <MessageSquare size={24} />,
        },
        {
            title: t('solution.f2'),
            desc: "Voice agents capable of natural conversations in Uzbek and Russian for automated outbound calls.",
            icon: <Phone size={24} />,
        },
        {
            title: t('solution.f3'),
            desc: "Scale your reach with Celery-powered multi-channel automated sales funnels.",
            icon: <Rocket size={24} />,
        },
        {
            title: t('solution.f4'),
            desc: "Deeper than integration. A 2-way native sync that makes AI act as a perfect CRM operator.",
            icon: <Database size={24} />,
        }
    ];

    return (
        <section id="features" className="py-24 bg-bg-body border-y border-border/50">
            <div className="container max-w-6xl">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                        {t('solution.title')}
                    </h2>
                    <p className="text-text-secondary max-w-2xl mx-auto">
                        We don&apos;t just automate chats. We build infrastructure that thinks, talks, and sells like your best manager.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, idx) => (
                        <div key={idx} className="p-8 rounded-2xl bg-bg-card border border-border/60 hover:border-accent/40 transition-all group">
                            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform">
                                {feature.icon}
                            </div>
                            <h3 className="text-lg font-bold mb-3">{feature.title}</h3>
                            <p className="text-sm text-text-secondary leading-relaxed">
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
