"use client";

import React from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { Check } from "lucide-react";

const Pricing: React.FC = () => {
    const { t } = useLanguage();

    const plans = [
        {
            name: "Basic",
            price: "$49",
            features: ["1 AI Agent", "1,000 Chats/mo", "CRM Sync", "Telegram Channel"]
        },
        {
            name: "Pro",
            price: "$199",
            features: ["5 AI Agents", "10,000 Chats/mo", "Voice AI Support", "SIP Telephony", "Advanced Analytics"],
            popular: true
        },
        {
            name: "Enterprise",
            price: "Custom",
            features: ["Unlimited Agents", "Unlimited Usage", "Custom LLM Fine-tuning", "Dedicated Support", "SLA Guarantee"]
        }
    ];

    return (
        <section id="pricing" className="py-24 bg-bg-body">
            <div className="container max-w-6xl">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold tracking-tight mb-4">Infrastructure That Scales With You</h2>
                    <p className="text-text-secondary">Simple plans for serious sales teams.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, idx) => (
                        <div key={idx} className={`p-8 rounded-3xl border flex flex-col ${plan.popular ? 'border-accent bg-accent/5 ring-1 ring-accent/20' : 'border-border bg-bg-card'}`}>
                            {plan.popular && (
                                <div className="bg-accent text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full self-start mb-4">
                                    Most Popular
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

                            <button className={`w-full py-4 rounded-xl font-bold transition-all ${plan.popular ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-bg-body border border-border hover:border-accent'}`}>
                                Get Started
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Pricing;
