"use client";

import React from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { Cpu, Zap, Radio, Layout, ShieldCheck, Microscope, Database, Globe2 } from "lucide-react";

const Features: React.FC = () => {
    const { t } = useLanguage();

    const techFeatures = [
        { title: "Real-time CRM Sync", icon: <Database size={20} />, desc: "Deep bidirectional synchronization with amoCRM lead pipelines and task management." },
        { title: "Multi-language AI", icon: <Globe2 size={20} />, desc: "Native understanding and generation of Uzbek and Russian for localized sales scripts." },
        { title: "SIP Telephony", icon: <Radio size={20} />, desc: "Seamless integration with local SIP providers for automated voice sales and dialers." },
        { title: "QA Monitoring", icon: <ShieldCheck size={20} />, desc: "AI-driven accuracy scoring and transcript auditing for every interaction." },
        { title: "Celery Automation", icon: <Cpu size={20} />, desc: "Distributed campaign processing engine built for massive outbound scale." },
        { title: "Visual Flow Builder", icon: <Layout size={20} />, desc: "Node-based editor for designing complex sales funnels and logic trees." }
    ];

    return (
        <section className="py-24 bg-bg-card border-b border-border/40">
            <div className="container max-w-6xl">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold tracking-tight mb-4">Built Like Infrastructure</h2>
                    <p className="text-text-secondary">Enterprise-grade features for high-performance sales departments.</p>
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
