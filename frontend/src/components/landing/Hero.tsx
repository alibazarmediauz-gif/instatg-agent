"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function Hero() {
    const { t } = useLanguage();

    return (
        <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
            {/* Background Orbs */}
            <div className="absolute top-0 inset-x-0 h-full w-full pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl opacity-50 mix-blend-screen animate-pulse" />
                <div className="absolute top-40 -left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl opacity-40 mix-blend-screen animate-pulse" style={{ animationDelay: "2s" }} />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm font-medium mb-8">
                        <Zap size={16} className="fill-current text-cyan-400" />
                        <span>{t("landing.hero.badge")}</span>
                    </div>
                </motion.div>

                <motion.h1
                    className="text-5xl md:text-7xl font-black tracking-tight text-white mb-6 leading-tight"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    {t("landing.hero.title").split(' ').map((word: string, i: number) => (
                        <span key={i} className={i % 2 === 1 ? "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500" : ""}>
                            {word}{" "}
                        </span>
                    ))}
                </motion.h1>

                <motion.p
                    className="mx-auto max-w-2xl text-xl text-slate-300 mb-10 leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    {t("landing.hero.subtitle")}
                </motion.p>

                <motion.div
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <Link href="/dashboard" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-8 py-4 text-lg font-bold text-slate-950 hover:shadow-[0_0_30px_-5px_rgba(34,211,238,0.4)] transition-all duration-300">
                        {t("landing.hero.cta_primary")} <ArrowRight size={20} />
                    </Link>
                    <Link href="/dashboard" className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 px-8 py-4 text-lg font-bold text-white transition-all duration-300 backdrop-blur-sm">
                        {t("landing.hero.cta_secondary")}
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
