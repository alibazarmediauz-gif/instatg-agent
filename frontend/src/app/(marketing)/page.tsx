"use client";

import Link from "next/link";
import {
    ArrowRight,
    CheckCircle2,
    Clock3,
    Database,
    Globe,
    Headphones,
    Layers3,
    MessageSquareText,
    PhoneCall,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    Zap,
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import ThemeToggle from "@/components/ThemeToggle";

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

    const solutions = [
        { icon: <MessageSquareText size={20} />, title: t("landing.solution.f1"), desc: t("landing.solution.f1_d") },
        { icon: <Headphones size={20} />, title: t("landing.solution.f2"), desc: t("landing.solution.f2_d") },
        { icon: <Layers3 size={20} />, title: t("landing.solution.f3"), desc: t("landing.solution.f3_d") },
        { icon: <Database size={20} />, title: t("landing.solution.f4"), desc: t("landing.solution.f4_d") },
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

    const integrations = ["amoCRM", "Telegram", "Instagram", "Zadarma", "Excel/Sheets"];

    return (
        <div className="sales-landing min-h-screen">
            <header className="sales-nav sticky top-0 z-50">
                <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#1ec8ff,#3359ff)] text-[#051224] shadow-[0_10px_22px_rgba(30,200,255,0.35)]">
                            <Zap size={18} className="fill-current" />
                        </div>
                        <div className="sales-title text-2xl font-bold text-white">
                            Sales<span className="text-[#67ddff]">AI</span>
                        </div>
                    </div>

                    <nav className="hidden items-center gap-7 text-sm font-semibold text-[#9fb1cf] md:flex">
                        <a href="#solution" className="hover:text-white">{t("landing.header.features")}</a>
                        <a href="#flow" className="hover:text-white">{t("landing.header.integrations")}</a>
                        <a href="#pricing" className="hover:text-white">{t("landing.header.pricing")}</a>
                    </nav>

                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={switchLang}
                            className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#bfd0ec]"
                        >
                            <Globe size={12} />
                            {locale}
                        </button>
                        <ThemeToggle />
                        <Link
                            href="/dashboard"
                            className="hidden rounded-xl bg-[linear-gradient(135deg,#1ec8ff,#3359ff)] px-4 py-2 text-sm font-bold text-[#061226] sm:inline-flex"
                        >
                            {t("nav.control_center")}
                        </Link>
                    </div>
                </div>
            </header>

            <main>
                <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-12 lg:items-center">
                    <div className="lg:col-span-7">
                        <div className="sales-chip mb-4 inline-flex items-center gap-2">
                            <Sparkles size={13} />
                            {t("landing.hero.badge")}
                        </div>
                        <h1 className="sales-title text-4xl font-bold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
                            {t("landing.hero.title")}
                        </h1>
                        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#b9c7de] sm:text-lg">
                            {t("landing.hero.subtitle")}
                        </p>
                        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#1ec8ff,#3359ff)] px-6 py-3.5 text-base font-bold text-[#061226] shadow-[0_14px_30px_rgba(34,135,255,0.35)]"
                            >
                                {t("landing.hero.cta_primary")}
                                <ArrowRight size={17} />
                            </Link>
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-base font-bold text-white"
                            >
                                {t("landing.hero.cta_secondary")}
                            </Link>
                        </div>
                    </div>

                    <div className="lg:col-span-5">
                        <div className="sales-panel p-5 sm:p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <span className="text-xs uppercase tracking-[0.1em] text-[#a6b6d3]">Weekly Snapshot</span>
                                <span className="rounded-full border border-emerald-300/30 bg-emerald-300/15 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-200">
                                    Live
                                </span>
                            </div>
                            <div className="space-y-3">
                                <div className="sales-soft-box flex items-center justify-between">
                                    <span className="text-[#cad6ea]">Yangi lidlar</span>
                                    <span className="font-bold text-white">1,248</span>
                                </div>
                                <div className="sales-soft-box flex items-center justify-between">
                                    <span className="text-[#cad6ea]">Sotuvga aylangan</span>
                                    <span className="inline-flex items-center gap-1 font-bold text-emerald-300"><TrendingUp size={14} /> +34%</span>
                                </div>
                                <div className="sales-soft-box flex items-center justify-between">
                                    <span className="text-[#cad6ea]">Birinchi javob vaqti</span>
                                    <span className="inline-flex items-center gap-1 font-bold text-white"><Clock3 size={13} /> 42 sec</span>
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-2.5 text-xs">
                                <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-2 text-center text-[#d6e2f4]">amoCRM</div>
                                <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-2 text-center text-[#d6e2f4]">Telegram</div>
                                <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-2 text-center text-[#d6e2f4]">Instagram</div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6">
                    <div className="rounded-2xl border border-white/10 bg-white/3 px-4 py-4 sm:px-5">
                        <p className="mb-3 text-center text-xs uppercase tracking-[0.2em] text-[#90a3c4]">
                            {t("landing.integrations_section.title")}
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2.5">
                            {integrations.map((item) => (
                                <span key={item} className="rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-semibold text-[#d5e1f3]">
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-5 px-4 pb-16 sm:px-6 lg:grid-cols-2">
                    <div className="sales-panel p-6">
                        <h2 className="sales-title text-3xl font-bold text-white sm:text-4xl">
                            {t("landing.problem.title")}
                        </h2>
                        <div className="mt-5 space-y-2.5">
                            {pains.map((item) => (
                                <div key={item} className="flex items-center gap-3 rounded-lg border border-red-300/20 bg-red-300/10 px-3.5 py-2.5 text-[#ffd3d3]">
                                    <ShieldCheck size={14} className="text-red-300" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="sales-panel p-6">
                        <h2 className="sales-title text-3xl font-bold text-white sm:text-4xl">
                            {t("landing.solution.title")}
                        </h2>
                        <p className="mt-4 text-[#c2cee4]">{t("landing.solution.desc")}</p>
                        <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                            {solutions.map((item) => (
                                <div key={item.title} className="sales-soft-box">
                                    <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#67ddff]/20 text-[#8be7ff]">
                                        {item.icon}
                                    </div>
                                    <h3 className="text-lg font-bold text-white">{item.title}</h3>
                                    <p className="mt-1 text-sm leading-relaxed text-[#becbe3]">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="solution" className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="sales-panel p-5">
                            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#67ddff]/20 text-[#9cefff]">
                                <PhoneCall size={18} />
                            </div>
                            <h3 className="sales-title text-xl font-bold text-white">24/7 Call Coverage</h3>
                            <p className="mt-2 text-sm text-[#b9c6de]">Har bir lidga bir xil sifatda qo‘ng‘iroq va follow-up.</p>
                        </div>
                        <div className="sales-panel p-5">
                            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#67ddff]/20 text-[#9cefff]">
                                <Database size={18} />
                            </div>
                            <h3 className="sales-title text-xl font-bold text-white">CRM Auto Logging</h3>
                            <p className="mt-2 text-sm text-[#b9c6de]">Muloqotlar, status va keyingi tasklar avtomatik yoziladi.</p>
                        </div>
                        <div className="sales-panel p-5">
                            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#67ddff]/20 text-[#9cefff]">
                                <CheckCircle2 size={18} />
                            </div>
                            <h3 className="sales-title text-xl font-bold text-white">Predictable Pipeline</h3>
                            <p className="mt-2 text-sm text-[#b9c6de]">Har hafta barqaror lid qayta ishlash va konversiya o‘sishi.</p>
                        </div>
                    </div>
                </section>

                <section id="flow" className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
                    <div className="sales-panel p-6">
                        <h2 className="sales-title text-3xl font-bold text-white sm:text-4xl">{t("landing.how_it_works.title")}</h2>
                        <p className="mt-3 text-[#becbe3]">{t("landing.how_it_works.desc")}</p>
                        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {steps.map((step, idx) => (
                                <div key={step} className="sales-soft-box flex items-start gap-3">
                                    <span className="sales-title inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 text-xs font-bold text-[#a2f0ff]">
                                        {idx + 1}
                                    </span>
                                    <span className="text-[#d5e0f2]">{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="pricing" className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6">
                    <div className="mb-8 text-center">
                        <h2 className="sales-title text-3xl font-bold text-white sm:text-5xl">{t("landing.pricing.title")}</h2>
                        <p className="mt-3 text-[#b7c5de]">{t("landing.pricing.desc")}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        {plans.map((plan) => (
                            <article
                                key={plan.name}
                                className={`sales-panel relative p-6 ${plan.popular ? "ring-1 ring-[#67ddff]/60 shadow-[0_16px_36px_rgba(40,154,255,0.25)]" : ""}`}
                            >
                                {plan.popular && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[linear-gradient(135deg,#1ec8ff,#3359ff)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.09em] text-[#071226]">
                                        {t("landing.pricing.popular")}
                                    </span>
                                )}
                                <h3 className="sales-title text-2xl font-bold text-white">{plan.name}</h3>
                                <p className="mt-2 text-4xl font-black text-[#75e3ff]">{plan.price}</p>
                                <ul className="mt-5 space-y-2.5">
                                    {plan.items.map((item) => (
                                        <li key={item} className="flex gap-2 text-[#c4d2ea]">
                                            <CheckCircle2 size={15} className="mt-1 shrink-0 text-[#9beeff]" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href="/dashboard"
                                    className={`mt-6 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-bold ${plan.popular
                                        ? "bg-[linear-gradient(135deg,#1ec8ff,#3359ff)] text-[#061226]"
                                        : "border border-white/20 bg-white/5 text-white"
                                        }`}
                                >
                                    {t("landing.pricing.get_started")}
                                </Link>
                            </article>
                        ))}
                    </div>
                </section>
            </main>

            <footer className="border-t border-white/10 px-4 py-8 sm:px-6">
                <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 text-sm text-[#9db0cf] md:flex-row">
                    <span>© 2026 SalesAI</span>
                    <div className="flex items-center gap-4">
                        <a href="#" className="hover:text-white">Privacy</a>
                        <a href="#" className="hover:text-white">Terms</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
