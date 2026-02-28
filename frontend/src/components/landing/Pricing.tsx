"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

export default function Pricing() {
    const { t } = useLanguage();

    const plans = [
        {
            name: t("landing.pricing.basic_name"),
            price: "$49",
            items: [t("landing.pricing.f_1_agent"), t("landing.pricing.f_1k_chats"), t("landing.pricing.f_crm_sync"), t("landing.pricing.f_tg_channel")],
            popular: false
        },
        {
            name: t("landing.pricing.pro_name"),
            price: "$199",
            popular: true,
            items: [t("landing.pricing.f_5_agents"), t("landing.pricing.f_10k_chats"), t("landing.pricing.f_voice_ai"), t("landing.pricing.f_sip"), t("landing.pricing.f_analytics")],
        },
        {
            name: t("landing.pricing.ent_name"),
            price: t("landing.pricing.custom"),
            items: [t("landing.pricing.f_unlimited_agents"), t("landing.pricing.f_unlimited_usage"), t("landing.pricing.f_finetuning"), t("landing.pricing.f_dedicated"), t("landing.pricing.f_sla")],
            popular: false
        },
    ];

    return (
        <section id="pricing" className="py-24 relative">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <motion.h2
                        className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        {t("landing.pricing.title")}
                    </motion.h2>
                    <motion.p
                        className="text-lg text-slate-400 max-w-2xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        {t("landing.pricing.desc")}
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-center max-w-5xl mx-auto lg:max-w-none">
                    {plans.map((plan, idx) => (
                        <motion.article
                            key={plan.name}
                            className={`relative rounded-3xl p-8 backdrop-blur-md transition-all duration-300 ${plan.popular
                                ? "bg-slate-900/90 border-2 border-cyan-400 shadow-[0_0_40px_-10px_rgba(34,211,238,0.3)] lg:-translate-y-4"
                                : "bg-slate-900/50 border border-white/10 hover:border-white/30 mt-0"
                                }`}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: plan.popular ? -16 : 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cyan-400 text-slate-950 px-4 py-1 rounded-full text-xs font-black tracking-wide uppercase">
                                    Most Popular
                                </div>
                            )}

                            <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                            <div className="flex items-baseline gap-2 mb-8">
                                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                                    {plan.price}
                                </span>
                                {plan.price !== t("landing.pricing.custom") && <span className="text-slate-400">/mo</span>}
                            </div>

                            <ul className="space-y-4 mb-8">
                                {plan.items.map((item) => (
                                    <li key={item} className="flex items-start gap-3 text-slate-300">
                                        <CheckCircle2 size={20} className="shrink-0 text-cyan-400 mt-0.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href="/dashboard"
                                className={`w-full inline-flex items-center justify-center rounded-xl px-6 py-4 text-sm font-bold transition-all duration-300 ${plan.popular
                                    ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 hover:shadow-[0_0_20px_-5px_rgba(34,211,238,0.5)]"
                                    : "bg-slate-800 text-white hover:bg-slate-700"
                                    }`}
                            >
                                {t("landing.pricing.get_started")}
                            </Link>
                        </motion.article>
                    ))}
                </div>
            </div>
        </section>
    );
}
