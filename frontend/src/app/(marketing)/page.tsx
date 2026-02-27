"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Globe, MessageSquareText, PhoneCall, Settings2, Zap } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useLanguage } from "@/lib/LanguageContext";

export default function LandingPage() {
    const { t, locale, setLocale } = useLanguage();

    const switchLang = () => {
        const next: Record<string, "en" | "ru" | "uz"> = { uz: "ru", ru: "en", en: "uz" };
        setLocale(next[locale]);
    };

    const pains = [
        t("landing.problem.p1"),
        t("landing.problem.p2"),
        t("landing.problem.p3"),
        t("landing.problem.p4"),
        t("landing.problem.p5"),
    ];

    const features = [
        { icon: <MessageSquareText size={18} />, title: t("landing.solution.f1"), desc: t("landing.solution.f1_d") },
        { icon: <PhoneCall size={18} />, title: t("landing.solution.f2"), desc: t("landing.solution.f2_d") },
        { icon: <Settings2 size={18} />, title: t("landing.solution.f3"), desc: t("landing.solution.f3_d") },
        { icon: <CheckCircle2 size={18} />, title: t("landing.solution.f4"), desc: t("landing.solution.f4_d") },
    ];

    const plans = [
        {
            name: t("landing.pricing.basic_name"),
            price: "$49",
            items: [t("landing.pricing.f_1_agent"), t("landing.pricing.f_1k_chats"), t("landing.pricing.f_crm_sync"), t("landing.pricing.f_tg_channel")],
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
        },
    ];

    return (
        <div className="min-h-screen bg-[radial-gradient(1200px_550px_at_10%_-10%,rgba(56,189,248,0.18),transparent),radial-gradient(1100px_500px_at_95%_-5%,rgba(59,130,246,0.14),transparent),#030712] text-slate-100">
            <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/20 text-cyan-300">
                            <Zap size={18} className="fill-current" />
                        </div>
                        <div className="text-2xl font-black tracking-tight">
                            Sales<span className="text-cyan-300">AI</span>
                        </div>
                    </Link>

                    <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-300 md:flex">
                        <a href="#solution" className="hover:text-white">{t("landing.header.features")}</a>
                        <a href="#pricing" className="hover:text-white">{t("landing.header.pricing")}</a>
                    </nav>

                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={switchLang}
                            className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1.5 text-xs font-bold uppercase text-slate-200"
                        >
                            <Globe size={12} /> {locale}
                        </button>
                        <ThemeToggle />
                        <Link href="/dashboard" className="hidden rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 sm:inline-flex">
                            {t("nav.control_center")}
                        </Link>
                    </div>
                </div>
            </header>

            <main>
                <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-4 pb-14 pt-12 sm:px-6 lg:grid-cols-2 lg:items-center">
                    <div>
                        <div className="mb-4 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-cyan-200">
                            {t("landing.hero.badge")}
                        </div>
                        <h1 className="text-4xl font-black leading-[1.05] sm:text-5xl lg:text-6xl">{t("landing.hero.title")}</h1>
                        <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300">{t("landing.hero.subtitle")}</p>
                        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                            <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-3 text-base font-bold text-slate-950">
                                {t("landing.hero.cta_primary")} <ArrowRight size={16} />
                            </Link>
                            <Link href="/dashboard" className="inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/5 px-6 py-3 text-base font-bold text-white">
                                {t("landing.hero.cta_secondary")}
                            </Link>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/15 bg-slate-900/70 p-5">
                        <div className="mb-4 text-xs font-bold uppercase tracking-[0.1em] text-slate-400">Performance Snapshot</div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3.5 py-3">
                                <span className="text-slate-300">Yangi lidlar</span><span className="font-bold text-white">1,248</span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3.5 py-3">
                                <span className="text-slate-300">Sotuvga aylangan</span><span className="font-bold text-emerald-300">+34%</span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3.5 py-3">
                                <span className="text-slate-300">Javob vaqti</span><span className="font-bold text-white">42 sec</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 px-4 pb-14 sm:px-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-rose-300/25 bg-rose-300/10 p-6">
                        <h2 className="text-3xl font-black leading-tight">{t("landing.problem.title")}</h2>
                        <div className="mt-5 space-y-2.5">
                            {pains.map((item) => (
                                <div key={item} className="rounded-lg border border-rose-300/25 bg-slate-900/30 px-3.5 py-2.5 text-rose-100">
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div id="solution" className="rounded-2xl border border-white/15 bg-slate-900/70 p-6">
                        <h2 className="text-3xl font-black leading-tight">{t("landing.solution.title")}</h2>
                        <p className="mt-4 text-slate-300">{t("landing.solution.desc")}</p>
                        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {features.map((item) => (
                                <div key={item.title} className="rounded-xl border border-white/10 bg-white/5 p-4">
                                    <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400/20 text-cyan-300">
                                        {item.icon}
                                    </div>
                                    <h3 className="font-bold text-white">{item.title}</h3>
                                    <p className="mt-1 text-sm leading-relaxed text-slate-300">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="pricing" className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
                    <div className="mb-7 text-center">
                        <h2 className="text-4xl font-black">{t("landing.pricing.title")}</h2>
                        <p className="mt-2 text-slate-300">{t("landing.pricing.desc")}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        {plans.map((plan) => (
                            <article
                                key={plan.name}
                                className={`rounded-2xl border p-6 ${plan.popular ? "border-cyan-300/60 bg-cyan-300/10" : "border-white/15 bg-slate-900/70"}`}
                            >
                                <h3 className="text-2xl font-black">{plan.name}</h3>
                                <div className="mt-2 text-4xl font-black text-cyan-300">{plan.price}</div>
                                <ul className="mt-5 space-y-2.5">
                                    {plan.items.map((item) => (
                                        <li key={item} className="flex items-start gap-2 text-slate-200">
                                            <CheckCircle2 size={15} className="mt-1 shrink-0 text-cyan-300" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href="/dashboard"
                                    className={`mt-6 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-bold ${plan.popular ? "bg-cyan-400 text-slate-950" : "border border-white/25 bg-white/5 text-white"}`}
                                >
                                    {t("landing.pricing.get_started")}
                                </Link>
                            </article>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
