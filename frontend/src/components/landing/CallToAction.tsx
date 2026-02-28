"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function CallToAction() {
    const { t } = useLanguage();

    return (
        <section className="py-24 relative overflow-hidden">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                <motion.div
                    className="relative rounded-3xl overflow-hidden bg-slate-900 border border-white/10 p-8 md:p-16 text-center"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Animated background glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[600px] max-h-[600px] bg-gradient-to-tr from-cyan-500/30 to-blue-600/30 blur-[100px] rounded-full pointer-events-none" />

                    <div className="relative z-10">
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6 mt-4">
                            {t("landing.pricing.title")}
                        </h2>
                        <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
                            {t("landing.pricing.desc")}
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/dashboard" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-8 py-4 text-lg font-bold text-slate-950 hover:shadow-[0_0_30px_-5px_rgba(34,211,238,0.4)] transition-all duration-300">
                                {t("landing.hero.cta_primary")} <ArrowRight size={20} />
                            </Link>
                            <Link href="/dashboard" className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 px-8 py-4 text-lg font-bold text-white transition-all duration-300 backdrop-blur-sm">
                                Talk to Sales
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
