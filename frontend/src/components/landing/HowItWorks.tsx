"use client";

import React from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { Link2, MessageSquarePlus, UserPlus, GraduationCap, PlayCircle, BarChart } from "lucide-react";

const HowItWorks: React.FC = () => {
    const { t } = useLanguage();

    const steps = [
        { title: "Connect amoCRM", icon: <Link2 size={20} /> },
        { title: "Connect Channels", icon: <MessageSquarePlus size={20} /> },
        { title: "Create AI Agent", icon: <UserPlus size={20} /> },
        { title: "Train with Data", icon: <GraduationCap size={20} /> },
        { title: "Launch Campaigns", icon: <PlayCircle size={20} /> },
        { title: "Monitor Revenue", icon: <BarChart size={20} /> },
    ];

    return (
        <section className="py-24 bg-bg-body overflow-hidden">
            <div className="container max-w-6xl">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold tracking-tight mb-4">Enterprise Implementation Flow</h2>
                    <p className="text-text-secondary">Deploy a complete AI sales department in days, not months.</p>
                </div>

                <div className="relative">
                    {/* Progress Line */}
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 hidden lg:block"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 relative z-10">
                        {steps.map((step, idx) => (
                            <div key={idx} className="flex flex-col items-center group">
                                <div className="w-14 h-14 rounded-full bg-bg-card border border-border flex items-center justify-center text-text-muted mb-4 group-hover:border-accent group-hover:text-accent transition-all duration-300 shadow-sm relative">
                                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-bg-body border border-border text-[10px] flex items-center justify-center font-bold">
                                        {idx + 1}
                                    </span>
                                    {step.icon}
                                </div>
                                <h4 className="text-sm font-bold text-center group-hover:text-text-primary transition-colors italic opacity-80 group-hover:opacity-100">
                                    {step.title}
                                </h4>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
