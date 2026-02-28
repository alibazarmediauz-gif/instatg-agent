"use client";

import { motion } from "framer-motion";
import { MessageSquareText, PhoneCall, Settings2, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function BentoFeatures() {
    const { t } = useLanguage();

    const features = [
        {
            icon: <MessageSquareText size={24} className="text-cyan-400" />,
            title: t("landing.solution.f1"),
            desc: t("landing.solution.f1_d"),
            className: "md:col-span-2 lg:col-span-2 lg:row-span-2 bg-gradient-to-br from-slate-900/90 to-slate-800/50",
            delay: 0.1
        },
        {
            icon: <PhoneCall size={24} className="text-blue-400" />,
            title: t("landing.solution.f2"),
            desc: t("landing.solution.f2_d"),
            className: "md:col-span-1 lg:col-span-1 lg:row-span-1 bg-slate-900/60",
            delay: 0.2
        },
        {
            icon: <Settings2 size={24} className="text-emerald-400" />,
            title: t("landing.solution.f3"),
            desc: t("landing.solution.f3_d"),
            className: "md:col-span-1 lg:col-span-1 lg:row-span-1 bg-slate-900/60",
            delay: 0.3
        },
        {
            icon: <CheckCircle2 size={24} className="text-purple-400" />,
            title: t("landing.solution.f4"),
            desc: t("landing.solution.f4_d"),
            className: "md:col-span-2 lg:col-span-2 lg:row-span-1 bg-gradient-to-r from-slate-800/40 to-slate-900/80",
            delay: 0.4
        },
    ];

    return (
        <section id="features" className="py-24 relative">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <motion.h2
                        className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        {t("landing.solution.title")}
                    </motion.h2>
                    <motion.p
                        className="text-lg text-slate-400 max-w-2xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        {t("landing.solution.desc")}
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            className={`rounded-3xl border border-white/10 p-8 flex flex-col justify-between group hover:border-cyan-500/50 transition-all duration-300 backdrop-blur-md overflow-hidden relative ${feature.className}`}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: feature.delay }}
                            whileHover={{ y: -5 }}
                        >
                            {/* Subtle background glow effect on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/5 group-hover:to-transparent transition-all duration-500 rounded-3xl" />

                            <div className="relative z-10">
                                <div className="h-14 w-14 rounded-2xl bg-slate-800/80 border border-white/5 flex items-center justify-center mb-6 shadow-inner">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3 tracking-wide">{feature.title}</h3>
                                <p className="text-slate-400 leading-relaxed text-sm lg:text-base">{feature.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
