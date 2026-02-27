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
        <section id="integrations" className="py-24 bg-bg-body">
            <div className="container max-w-4xl text-center">
                <h3 className="text-2xl font-bold mb-12 opacity-80 uppercase tracking-widest text-text-muted">
                    Deep Integrations, Not Surface-Level Automations
                </h3>

                <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 grayscale opacity-60 hover:grayscale-0 transition-all duration-700">
                    {logos.map((logo, idx) => (
                        <div key={idx} className={`px-6 py-2 rounded-lg border border-border/40 font-black text-xl italic uppercase ${logo.color}`}>
                            {logo.name}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Integrations;
