"use client";

import React from "react";
import { useLanguage } from "@/lib/LanguageContext";

const Integrations: React.FC = () => {
    const { t } = useLanguage();

    const logos = [
        { name: "amoCRM", color: "bg-blue-500/10 text-blue-500" },
        { name: "Telegram", color: "bg-sky-500/10 text-sky-500" },
        { name: "Instagram", color: "bg-pink-500/10 text-pink-500" },
        { name: "Zadarma", color: "bg-orange-500/10 text-orange-500" },
        { name: "Excel/Sheets", color: "bg-green-500/10 text-green-500" },
    ];

    return (
        <section id="integrations" className="py-24 relative z-10 animate-entrance stagger-1">
            <div className="container max-w-5xl text-center px-6">
                <h3 className="text-sm font-black mb-16 opacity-40 uppercase tracking-[0.3em] text-text-secondary">
                    {t('landing.integrations_section.title')}
                </h3>

                <div className="flex flex-wrap items-center justify-center gap-10 md:gap-20 opacity-40 hover:opacity-100 transition-all duration-1000">
                    {logos.map((logo, idx) => (
                        <div key={idx} className={`px-10 py-3 rounded-full border border-white/5 font-black text-2xl italic uppercase tracking-tighter glass-card hover:scale-110 hover:border-accent/40 transition-all cursor-crosshair ${logo.color}`}>
                            {logo.name}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Integrations;
