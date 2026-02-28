"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";

export default function HowItWorks() {
    const { t } = useLanguage();

    const steps = [
        {
            number: "01",
            title: t("landing.problem.p1"),
            desc: "Connect your Telegram channels and groups to our platform in one click.",
        },
        {
            number: "02",
            title: t("landing.problem.p2"),
            desc: "Train your AI bot using your company's knowledge base and FAQs.",
        },
        {
            number: "03",
            title: t("landing.problem.p3"),
            desc: "Start resolving customer inquiries automatically, 24/7 without delay.",
        }
    ];

    return (
        <section className="py-24 relative overflow-hidden bg-slate-950">
            {/* Soft background line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent hidden lg:block" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-20">
                    <motion.h2
                        className="text-4xl md:text-5xl font-black text-white tracking-tight"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        How It Works
                    </motion.h2>
                </div>

                <div className="space-y-16 lg:space-y-24">
                    {steps.map((step, idx) => (
                        <motion.div
                            key={idx}
                            className={`flex flex-col ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8 lg:gap-16`}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                        >
                            <div className={`w-full md:w-1/2 flex justify-center ${idx % 2 === 0 ? 'md:justify-end' : 'md:justify-start'}`}>
                                <div className="relative">
                                    <div className="text-8xl md:text-9xl lg:text-[180px] font-black leading-none text-slate-800/40 select-none">
                                        {step.number}
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 blur-xl opacity-20" />
                                    </div>
                                </div>
                            </div>

                            <div className={`w-full md:w-1/2 text-center ${idx % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>
                                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">{step.title}</h3>
                                <p className="text-lg text-slate-400 leading-relaxed max-w-md mx-auto md:mx-0">
                                    {step.desc}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
