"use client";

import Link from "next/link";
import {
    ArrowRight,
    CheckCircle2,
    Database,
    Globe,
    Headphones,
    Layers3,
    Shield,
    Sparkles,
    TrendingUp,
    Zap,
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";

export default function LandingPage() {
    const { t, locale, setLocale } = useLanguage();

    const integrations = ["amoCRM", "Telegram", "Instagram", "Zadarma", "Excel/Sheets"];

    const pains = [
        t("landing.problem.p1"),
        t("landing.problem.p2"),
        t("landing.problem.p3"),
        t("landing.problem.p4"),
        t("landing.problem.p5"),
    ];

    const solutions = [
        {
            icon: <Headphones size={20} />,
            title: t("landing.solution.f2"),
            desc: t("landing.solution.f2_d"),
        },
        {
            icon: <Layers3 size={20} />,
            title: t("landing.solution.f3"),
            desc: t("landing.solution.f3_d"),
        },
        {
            icon: <Database size={20} />,
            title: t("landing.solution.f4"),
            desc: t("landing.solution.f4_d"),
        },
        {
            icon: <Sparkles size={20} />,
            title: t("landing.solution.f1"),
            desc: t("landing.solution.f1_d"),
        },
    ];

    const steps = [
        t("landing.how_it_works.s1"),
        t("landing.how_it_works.s2"),
        t("landing.how_it_works.s3"),
        t("landing.how_it_works.s4"),
        t("landing.how_it_works.s5"),
        t("landing.how_it_works.s6"),
    ];

    const plans = [
        {
            name: t("landing.pricing.basic_name"),
            price: "$49",
            items: [
                t("landing.pricing.f_1_agent"),
                t("landing.pricing.f_1k_chats"),
                t("landing.pricing.f_crm_sync"),
                t("landing.pricing.f_tg_channel"),
            ],
        },
        {
            name: t("landing.pricing.pro_name"),
            price: "$199",
            popular: true,
            items: [
                t("landing.pricing.f_5_agents"),
                t("landing.pricing.f_10k_chats"),
                t("landing.pricing.f_voice_ai"),
                t("landing.pricing.f_sip"),
                t("landing.pricing.f_analytics"),
            ],
        },
        {
            name: t("landing.pricing.ent_name"),
            price: t("landing.pricing.custom"),
            items: [
                t("landing.pricing.f_unlimited_agents"),
                t("landing.pricing.f_unlimited_usage"),
                t("landing.pricing.f_finetuning"),
                t("landing.pricing.f_dedicated"),
                t("landing.pricing.f_sla"),
            ],
        },
    ];

    const switchLang = () => {
        const next: Record<string, "en" | "ru" | "uz"> = { uz: "ru", ru: "en", en: "uz" };
        setLocale(next[locale]);
    };

    return (
        <div className="sales-landing min-h-screen">
            <header className="sales-nav sticky top-0 z-50">
                <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-3 md:px-8">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(145deg,#26d9ff,#2f5dff)] text-[#021322] shadow-[0_12px_28px_rgba(38,217,255,0.35)]">
                            <Zap size={20} className="fill-current" />
                        </div>
                        <div className="sales-title text-2xl font-bold tracking-tight text-white">
                            Sales<span className="text-[#26d9ff]">AI</span>
                        </div>
                    </div>

                    <nav className="hidden items-center gap-8 text-sm font-semibold text-[#a8b8d7] lg:flex">
                        <a href="#value" className="hover:text-white">Imkoniyatlar</a>
                        <a href="#flow" className="hover:text-white">Jarayon</a>
                        <a href="#pricing" className="hover:text-white">Tariflar</a>
                    </nav>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={switchLang}
                            className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#c9d5eb] hover:border-white/30"
                        >
                            <span className="mr-1 inline-block align-middle"><Globe size={13} /></span>
                            {locale}
                        </button>
                        <ThemeToggle />
                        <Link
                            href="/dashboard"
                            className="hidden rounded-xl bg-[linear-gradient(145deg,#26d9ff,#2f5dff)] px-5 py-2 text-sm font-bold text-[#061126] shadow-[0_14px_30px_rgba(39,130,255,0.35)] transition hover:-translate-y-0.5 sm:inline-flex"
                        >
                            {t("nav.control_center")}
                        </Link>
                    </div>
                </div>
            </header>

            <main>
                <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-5 pb-16 pt-14 md:px-8 lg:grid-cols-12 lg:items-center">
                    <div className="lg:col-span-7">
                        <div className="sales-chip mb-5 inline-flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[#26d9ff]" />
                            {t("landing.hero.badge")}
                        </div>
                        <h1 className="sales-title sales-rise text-4xl font-bold leading-[1.02] text-white sm:text-5xl lg:text-7xl">
                            {t("landing.hero.title")}
                        </h1>
                        <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#b6c3da] sm:text-lg">
                            {t("landing.hero.subtitle")}
                        </p>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(145deg,#26d9ff,#2f5dff)] px-7 py-4 text-base font-bold text-[#061126] shadow-[0_18px_36px_rgba(39,130,255,0.35)] transition hover:-translate-y-0.5"
                            >
                                {t("landing.hero.cta_primary")} <ArrowRight size={18} />
                            </Link>
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-7 py-4 text-base font-bold text-white transition hover:border-white/35"
                            >
                                {t("landing.hero.cta_secondary")}
                            </Link>
                        </div>
                        <div className="mt-8 grid grid-cols-2 gap-3 text-sm text-[#c2cee5] sm:grid-cols-4">
                            <div className="sales-soft-box">{t("landing.hero.check1")}</div>
                            <div className="sales-soft-box">{t("landing.hero.check2")}</div>
                            <div className="sales-soft-box">{t("landing.hero.check3")}</div>
                            <div className="sales-soft-box">{t("landing.hero.check4")}</div>
                        </div>
                    </div>

                    <div className="lg:col-span-5">
                        <div className="sales-panel p-6 sm:p-7">
                            <div className="mb-5 flex items-center justify-between">
                                <span className="text-xs uppercase tracking-[0.12em] text-[#9aa9c5]">Revenue Pulse</span>
                                <span className="rounded-full border border-emerald-300/35 bg-emerald-300/12 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-200">
                                    Live
                                </span>
                            </div>
                            <div className="space-y-3">
                                <div className="sales-soft-box flex items-center justify-between">
                                    <span className="text-[#c4d0e7]">Leads qayta ishlangan</span>
                                    <span className="font-bold text-white">4,812</span>
                                </div>
                                <div className="sales-soft-box flex items-center justify-between">
                                    <span className="text-[#c4d0e7]">Konversiya o‘sishi</span>
                                    <span className="inline-flex items-center gap-1 font-bold text-emerald-300"><TrendingUp size={14} /> +34%</span>
                                </div>
                                <div className="sales-soft-box flex items-center justify-between">
                                    <span className="text-[#c4d0e7]">Qo‘ng‘iroq SLA</span>
                                    <span className="font-bold text-white">99.2%</span>
                                </div>
                            </div>
                            <div className="mt-5 grid grid-cols-3 gap-3">
                                {integrations.slice(0, 3).map((name) => (
                                    <div key={name} className="rounded-xl border border-white/10 bg-black/20 px-2 py-3 text-center text-xs font-semibold text-[#d4def0]">
                                        {name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto w-full max-w-7xl px-5 pb-16 md:px-8">
                    <div className="mb-4 text-center text-xs uppercase tracking-[0.2em] text-[#7f90b2]">
                        {t("landing.integrations_section.title")}
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                        {integrations.map((item) => (
                            <div key={item} className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold text-[#cfdbf1]">
                                {item}
                            </div>
                        ))}
                    </div>
                </section>

                <section id="value" className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-5 pb-20 md:px-8 lg:grid-cols-12">
                    <div className="sales-panel p-7 lg:col-span-5">
                        <h2 className="sales-title text-3xl font-bold text-white md:text-4xl">
                            {t("landing.problem.title")}
                        </h2>
                        <div className="mt-6 space-y-3">
                            {pains.map((pain) => (
                                <div key={pain} className="flex items-center gap-3 rounded-xl border border-red-300/20 bg-red-300/8 px-4 py-3 text-[#f6c6c6]">
                                    <Shield size={16} className="text-red-300" />
                                    <span>{pain}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-7">
                        <div className="sales-panel h-full p-7">
                            <h3 className="sales-title text-3xl font-bold text-white md:text-4xl">
                                {t("landing.solution.title")}
                            </h3>
                            <p className="mt-4 max-w-3xl text-[#bac8e2]">{t("landing.solution.desc")}</p>
                            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {solutions.map((item) => (
                                    <div key={item.title} className="sales-soft-box">
                                        <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#26d9ff]/18 text-[#8fe9ff]">
                                            {item.icon}
                                        </div>
                                        <h4 className="text-lg font-semibold text-white">{item.title}</h4>
                                        <p className="mt-1 text-sm leading-relaxed text-[#b8c5de]">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section id="flow" className="mx-auto w-full max-w-7xl px-5 pb-20 md:px-8">
                    <div className="sales-panel p-7">
                        <h3 className="sales-title text-3xl font-bold text-white md:text-4xl">
                            {t("landing.how_it_works.title")}
                        </h3>
                        <p className="mt-3 text-[#b7c4dd]">{t("landing.how_it_works.desc")}</p>
                        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {steps.map((step, idx) => (
                                <div key={step} className="sales-soft-box flex items-start gap-4">
                                    <div className="sales-title flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5 text-sm font-bold text-[#9beeff]">
                                        {idx + 1}
                                    </div>
                                    <div className="pt-1 text-[#d6e1f3]">{step}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="pricing" className="mx-auto w-full max-w-7xl px-5 pb-24 md:px-8">
                    <div className="mb-8 text-center">
                        <h3 className="sales-title text-3xl font-bold text-white md:text-5xl">{t("landing.pricing.title")}</h3>
                        <p className="mt-3 text-[#b6c3dc]">{t("landing.pricing.desc")}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                        {plans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`sales-panel relative p-7 ${plan.popular ? "ring-1 ring-[#26d9ff]/60 shadow-[0_22px_44px_rgba(38,217,255,0.18)]" : ""}`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[linear-gradient(145deg,#26d9ff,#2f5dff)] px-4 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#041226]">
                                        {t("landing.pricing.popular")}
                                    </div>
                                )}
                                <div className="sales-title text-2xl font-bold text-white">{plan.name}</div>
                                <div className="mt-2 text-4xl font-black text-[#26d9ff]">{plan.price}</div>
                                <ul className="mt-5 space-y-3">
                                    {plan.items.map((item) => (
                                        <li key={item} className="flex items-start gap-2 text-[#c5d2ea]">
                                            <CheckCircle2 size={16} className="mt-1 shrink-0 text-[#7be4ff]" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href="/dashboard"
                                    className={`mt-7 inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition ${plan.popular
                                        ? "bg-[linear-gradient(145deg,#26d9ff,#2f5dff)] text-[#051124]"
                                        : "border border-white/20 bg-white/5 text-white hover:border-white/35"
                                        }`}
                                >
                                    {t("landing.pricing.get_started")}
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <footer className="border-t border-white/10 px-5 py-10 md:px-8">
                <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 text-sm text-[#9eb0cf] md:flex-row">
                    <div>© 2026 SalesAI. All rights reserved.</div>
                    <div className="flex items-center gap-5">
                        <a href="#" className="hover:text-white">Privacy</a>
                        <a href="#" className="hover:text-white">Terms</a>
                        <Link href="/dashboard" className="inline-flex items-center gap-1 text-[#90e9ff] hover:text-white">
                            Dashboard <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
