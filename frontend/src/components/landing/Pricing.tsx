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
        <section id="pricing" className="py-24 bg-bg-body">
            <div className="container max-w-6xl">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold tracking-tight mb-4">{t('landing.pricing.title')}</h2>
                    <p className="text-text-secondary">{t('landing.pricing.desc')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, idx) => (
                        <div key={idx} className={`p-8 rounded-3xl border flex flex-col ${plan.popular ? 'border-accent bg-accent/5 ring-1 ring-accent/20' : 'border-border bg-bg-card'}`}>
                            {plan.popular && (
                                <div className="bg-accent text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full self-start mb-4">
                                    {t('landing.pricing.popular')}
                                </div>
                            )}
                            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                            <div className="flex items-baseline gap-1 mb-8">
                                <span className="text-4xl font-black">{plan.price}</span>
                                <span className="text-text-muted text-sm">{plan.price.startsWith('$') ? '/mo' : ''}</span>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((f, fIdx) => (
                                    <li key={fIdx} className="flex items-center gap-3 text-sm text-text-secondary font-medium">
                                        <Check size={16} className="text-accent" />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <Link href="/dashboard" className={`w-full py-4 rounded-xl font-bold transition-all text-center flex items-center justify-center ${plan.popular ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-bg-body border border-border hover:border-accent'}`}>
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
