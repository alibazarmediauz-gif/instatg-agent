"use client";

import React from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { Check } from "lucide-react";
import Link from "next/link";

const Pricing: React.FC = () => {
    const { t } = useLanguage();

    const plans = [
        {
            name: t('landing.pricing.basic_name'),
            price: "$49",
            features: [
                t('landing.pricing.f_1_agent'),
                t('landing.pricing.f_1k_chats'),
                t('landing.pricing.f_crm_sync'),
                t('landing.pricing.f_tg_channel')
            ]
        },
        {
            name: t('landing.pricing.pro_name'),
            price: "$199",
            features: [
                t('landing.pricing.f_5_agents'),
                t('landing.pricing.f_10k_chats'),
                t('landing.pricing.f_voice_ai'),
                t('landing.pricing.f_sip'),
                t('landing.pricing.f_analytics')
            ],
            popular: true
        },
        {
            name: t('landing.pricing.ent_name'),
            price: t('landing.pricing.custom'),
            features: [
                t('landing.pricing.f_unlimited_agents'),
                t('landing.pricing.f_unlimited_usage'),
                t('landing.pricing.f_finetuning'),
                t('landing.pricing.f_dedicated'),
                t('landing.pricing.f_sla')
            ]
        }
    ];

    return (
        <section id="pricing" className="py-32 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/5 blur-[120px] pointer-events-none rounded-full"></div>

            <div className="container max-w-7xl px-6 relative z-10">
                <div className="text-center mb-24 animate-entrance">
                    <h2 className="text-5xl md:text-6xl font-black tracking-tightest mb-8 text-text-primary">
                        {t('landing.pricing.title')}
                    </h2>
                    <p className="text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed font-medium">
                        {t('landing.pricing.desc')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, idx) => (
                        <div key={idx} className={`glass-card p-12 rounded-[40px] border flex flex-col transition-all duration-500 hover:scale-[1.02] group animate-entrance stagger-${idx + 1} ${plan.popular ? 'border-accent/40 bg-accent/5 shadow-[0_0_50px_rgba(59,130,246,0.1)]' : 'border-white/5'}`}>
                            {plan.popular && (
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-accent text-white text-[11px] font-black uppercase tracking-[0.2em] px-6 py-2 rounded-full shadow-xl shadow-accent/20">
                                    {t('landing.pricing.popular')}
                                </div>
                            )}
                            <h3 className="text-2xl font-black mb-2 tracking-tight">{plan.name}</h3>
                            <div className="flex items-baseline gap-2 mb-10">
                                <span className="text-5xl font-black tracking-tighter text-text-primary">{plan.price}</span>
                                <span className="text-text-muted text-sm font-bold uppercase tracking-widest">{plan.price.startsWith('$') ? '/mo' : ''}</span>
                            </div>

                            <ul className="space-y-5 mb-12 flex-1">
                                {plan.features.map((f, fIdx) => (
                                    <li key={fIdx} className="flex items-start gap-4 text-base text-text-secondary font-medium group-hover:text-text-primary transition-colors">
                                        <div className="mt-1 w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center text-accent flex-shrink-0 animate-pulse">
                                            <Check size={12} strokeWidth={4} />
                                        </div>
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <Link href="/dashboard" className={`w-full py-5 rounded-2xl font-black transition-all text-center flex items-center justify-center text-lg tracking-tight ${plan.popular ? 'bg-accent text-white shadow-2xl shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-1' : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'}`}>
                                {t('landing.pricing.get_started')}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Pricing;
