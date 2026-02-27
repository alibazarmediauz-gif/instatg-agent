"use client";

import Link from "next/link";
import {
    ArrowRight,
    CheckCircle2,
    Clock3,
    Cpu,
    Database,
    Globe,
    Headphones,
    Layers3,
    Layout,
    Lock,
    MessageSquareText,
    PhoneCall,
    Radio,
    Server,
    Shield,
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

    const techFeatures = [
        { icon: <Database size={18} />, title: t("landing.features.f1_t"), desc: t("landing.features.f1_d") },
        { icon: <Globe size={18} />, title: t("landing.features.f2_t"), desc: t("landing.features.f2_d") },
        { icon: <Radio size={18} />, title: t("landing.features.f3_t"), desc: t("landing.features.f3_d") },
        { icon: <ShieldCheck size={18} />, title: t("landing.features.f4_t"), desc: t("landing.features.f4_d") },
        { icon: <Cpu size={18} />, title: t("landing.features.f5_t"), desc: t("landing.features.f5_d") },
        { icon: <Layout size={18} />, title: t("landing.features.f6_t"), desc: t("landing.features.f6_d") },
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
            {/* ─── Header ─────────────────────────────────────────── */}
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
                        <a href="#solution" className="transition-colors hover:text-white">{t("landing.header.features")}</a>
                        <a href="#flow" className="transition-colors hover:text-white">{t("landing.header.integrations")}</a>
                        <a href="#pricing" className="transition-colors hover:text-white">{t("landing.header.pricing")}</a>
                    </nav>

                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={switchLang}
                            className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#bfd0ec] transition-colors hover:border-white/30 hover:text-white"
                        >
                            <Globe size={12} />
                            {locale}
                        </button>
                        <ThemeToggle />
                        <Link
                            href="/dashboard"
                            className="hidden rounded-xl bg-[linear-gradient(135deg,#1ec8ff,#3359ff)] px-4 py-2 text-sm font-bold text-[#061226] transition-all hover:shadow-[0_10px_24px_rgba(30,200,255,0.35)] sm:inline-flex"
                        >
                            {t("nav.control_center")}
                        </Link>
                    </div>
                </div>
            </header>

            <main>
                {/* ─── Hero ────────────────────────────────────────── */}
                <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-12 lg:items-center lg:pb-20 lg:pt-16">
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
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#1ec8ff,#3359ff)] px-6 py-3.5 text-base font-bold text-[#061226] shadow-[0_14px_30px_rgba(34,135,255,0.35)] transition-all hover:shadow-[0_18px_40px_rgba(34,135,255,0.5)]"
                            >
                                {t("landing.hero.cta_primary")}
                                <ArrowRight size={17} />
                            </Link>
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-base font-bold text-white transition-all hover:bg-white/10"
                            >
                                {t("landing.hero.cta_secondary")}
                            </Link>
                        </div>

                        {/* Social Proof Stats */}
                        <div className="mt-10 flex flex-wrap gap-8 border-t border-white/10 pt-8">
                            <div>
                                <div className="sales-title text-3xl font-bold text-white">1,200+</div>
                                <div className="mt-1 text-xs uppercase tracking-[0.1em] text-[#90a3c4]">{locale === "uz" ? "Faol agentlar" : locale === "ru" ? "Активных агентов" : "Active Agents"}</div>
                            </div>
                            <div>
                                <div className="sales-title text-3xl font-bold text-white">98.7%</div>
                                <div className="mt-1 text-xs uppercase tracking-[0.1em] text-[#90a3c4]">Uptime SLA</div>
                            </div>
                            <div>
                                <div className="sales-title text-3xl font-bold text-[#67ddff]">+34%</div>
                                <div className="mt-1 text-xs uppercase tracking-[0.1em] text-[#90a3c4]">{locale === "uz" ? "O'rtacha konversiya" : locale === "ru" ? "Средняя конверсия" : "Avg. Conversion"}</div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-5">
                        <div className="sales-panel p-5 sm:p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <span className="text-xs uppercase tracking-[0.1em] text-[#a6b6d3]">
                                    {locale === "uz" ? "Haftalik ko'rsatkich" : locale === "ru" ? "Недельный отчёт" : "Weekly Snapshot"}
                                </span>
                                <span className="rounded-full border border-emerald-300/30 bg-emerald-300/15 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-200">
                                    Live
                                </span>
                            </div>
                            <div className="space-y-3">
                                <div className="sales-soft-box flex items-center justify-between">
                                    <span className="text-[#cad6ea]">{locale === "uz" ? "Yangi lidlar" : locale === "ru" ? "Новые лиды" : "New Leads"}</span>
                                    <span className="font-bold text-white">1,248</span>
                                </div>
                                <div className="sales-soft-box flex items-center justify-between">
                                    <span className="text-[#cad6ea]">{locale === "uz" ? "Sotuvga aylangan" : locale === "ru" ? "Конверсия" : "Converted"}</span>
                                    <span className="inline-flex items-center gap-1 font-bold text-emerald-300"><TrendingUp size={14} /> +34%</span>
                                </div>
                                <div className="sales-soft-box flex items-center justify-between">
                                    <span className="text-[#cad6ea]">{locale === "uz" ? "Birinchi javob vaqti" : locale === "ru" ? "Время первого ответа" : "First Response"}</span>
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

                {/* ─── Integrations Banner ─────────────────────────── */}
                <section className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 sm:px-5">
                        <p className="mb-3 text-center text-xs uppercase tracking-[0.2em] text-[#90a3c4]">
                            {t("landing.integrations_section.title")}
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2.5">
                            {integrations.map((item) => (
                                <span key={item} className="rounded-full border border-white/[0.12] bg-white/[0.06] px-4 py-2 text-sm font-semibold text-[#d5e1f3] transition-colors hover:border-[#67ddff]/30 hover:text-white">
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── Problem / Solution ──────────────────────────── */}
                <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-5 px-4 pb-16 sm:px-6 lg:grid-cols-2">
                    <div className="sales-panel p-6">
                        <h2 className="sales-title text-3xl font-bold text-white sm:text-4xl">
                            {t("landing.problem.title")}
                        </h2>
                        <div className="mt-5 space-y-2.5">
                            {pains.map((item) => (
                                <div key={item} className="flex items-center gap-3 rounded-lg border border-red-300/20 bg-red-300/10 px-3.5 py-2.5 text-[#ffd3d3]">
                                    <ShieldCheck size={14} className="shrink-0 text-red-300" />
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
                                <div key={item.title} className="sales-soft-box transition-all hover:border-[#67ddff]/25">
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

                {/* ─── Key Benefits (3 cards) ──────────────────────── */}
                <section id="solution" className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="sales-panel p-5 transition-all hover:border-[#67ddff]/25">
                            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#67ddff]/20 text-[#9cefff]">
                                <PhoneCall size={18} />
                            </div>
                            <h3 className="sales-title text-xl font-bold text-white">
                                {locale === "uz" ? "24/7 Qo'ng'iroq" : locale === "ru" ? "24/7 Звонки" : "24/7 Call Coverage"}
                            </h3>
                            <p className="mt-2 text-sm text-[#b9c6de]">
                                {locale === "uz" ? "Har bir lidga bir xil sifatda qo'ng'iroq va follow-up." : locale === "ru" ? "Каждый лид получает звонок и follow-up одинакового качества." : "Every lead gets the same quality call and follow-up."}
                            </p>
                        </div>
                        <div className="sales-panel p-5 transition-all hover:border-[#67ddff]/25">
                            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#67ddff]/20 text-[#9cefff]">
                                <Database size={18} />
                            </div>
                            <h3 className="sales-title text-xl font-bold text-white">
                                {locale === "uz" ? "CRM Avto-yozish" : locale === "ru" ? "CRM Авто-запись" : "CRM Auto Logging"}
                            </h3>
                            <p className="mt-2 text-sm text-[#b9c6de]">
                                {locale === "uz" ? "Muloqotlar, status va keyingi tasklar avtomatik yoziladi." : locale === "ru" ? "Разговоры, статусы и следующие задачи записываются автоматически." : "Conversations, statuses and next tasks are logged automatically."}
                            </p>
                        </div>
                        <div className="sales-panel p-5 transition-all hover:border-[#67ddff]/25">
                            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#67ddff]/20 text-[#9cefff]">
                                <CheckCircle2 size={18} />
                            </div>
                            <h3 className="sales-title text-xl font-bold text-white">
                                {locale === "uz" ? "Barqaror Pipeline" : locale === "ru" ? "Стабильный Pipeline" : "Predictable Pipeline"}
                            </h3>
                            <p className="mt-2 text-sm text-[#b9c6de]">
                                {locale === "uz" ? "Har hafta barqaror lid qayta ishlash va konversiya o'sishi." : locale === "ru" ? "Еженедельный стабильный рост обработки лидов и конверсии." : "Weekly stable lead processing and conversion growth."}
                            </p>
                        </div>
                    </div>
                </section>

                {/* ─── How It Works ────────────────────────────────── */}
                <section id="flow" className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
                    <div className="sales-panel p-6 sm:p-8">
                        <h2 className="sales-title text-3xl font-bold text-white sm:text-4xl">{t("landing.how_it_works.title")}</h2>
                        <p className="mt-3 text-[#becbe3]">{t("landing.how_it_works.desc")}</p>
                        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {steps.map((step, idx) => (
                                <div key={step} className="sales-soft-box flex items-start gap-3 transition-all hover:border-[#67ddff]/25">
                                    <span className="sales-title inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 text-xs font-bold text-[#a2f0ff]">
                                        {idx + 1}
                                    </span>
                                    <span className="text-[#d5e0f2]">{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ─── Tech Features Grid ──────────────────────────── */}
                <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
                    <div className="mb-8 text-center">
                        <h2 className="sales-title text-3xl font-bold text-white sm:text-5xl">{t("landing.features.title")}</h2>
                        <p className="mt-3 text-[#b7c5de]">{t("landing.features.desc")}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {techFeatures.map((f) => (
                            <div key={f.title} className="sales-panel p-5 transition-all hover:border-[#67ddff]/25">
                                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#67ddff]/20 text-[#9cefff]">
                                    {f.icon}
                                </div>
                                <h3 className="sales-title text-lg font-bold text-white">{f.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-[#b9c6de]">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ─── Security / Infrastructure ──────────────────── */}
                <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
                    <div className="sales-panel overflow-hidden p-6 sm:p-8">
                        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
                            <div>
                                <h2 className="sales-title text-3xl font-bold text-white sm:text-4xl">
                                    {t("landing.security.title")}
                                </h2>
                                <p className="mt-4 text-[#becbe3]">{t("landing.security.desc")}</p>
                                <div className="mt-6 space-y-3">
                                    <div className="sales-soft-box flex items-start gap-3.5 transition-all hover:border-[#67ddff]/25">
                                        <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#67ddff]/20 text-[#8be7ff]">
                                            <Server size={16} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white">{t("landing.security.f1_t")}</h4>
                                            <p className="mt-0.5 text-sm text-[#b9c6de]">{t("landing.security.f1_d")}</p>
                                        </div>
                                    </div>
                                    <div className="sales-soft-box flex items-start gap-3.5 transition-all hover:border-[#67ddff]/25">
                                        <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#67ddff]/20 text-[#8be7ff]">
                                            <Shield size={16} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white">{t("landing.security.f2_t")}</h4>
                                            <p className="mt-0.5 text-sm text-[#b9c6de]">{t("landing.security.f2_d")}</p>
                                        </div>
                                    </div>
                                    <div className="sales-soft-box flex items-start gap-3.5 transition-all hover:border-[#67ddff]/25">
                                        <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#67ddff]/20 text-[#8be7ff]">
                                            <Lock size={16} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white">{t("landing.security.f3_t")}</h4>
                                            <p className="mt-0.5 text-sm text-[#b9c6de]">{t("landing.security.f3_d")}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
                                    <div className="mb-6 flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-[0.1em] text-[#a6b6d3]">System Health</span>
                                        <span className="rounded-full border border-emerald-300/30 bg-emerald-300/15 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-200">
                                            {locale === "uz" ? "Barchasi ishlayapti" : locale === "ru" ? "Все системы работают" : "All Systems Operational"}
                                        </span>
                                    </div>
                                    <div className="space-y-4">
                                        {["API Gateway", "AI Engine", "CRM Sync", "Voice Service", "Queue Workers"].map((name, i) => (
                                            <div key={name} className="flex items-center gap-3">
                                                <span className="w-24 truncate text-xs text-[#90a3c4]">{name}</span>
                                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                                                    <div
                                                        className="h-full rounded-full bg-[linear-gradient(90deg,#1ec8ff,#3359ff)] shadow-[0_0_8px_rgba(30,200,255,0.4)]"
                                                        style={{ width: `${85 + (i * 3) % 15}%` }}
                                                    />
                                                </div>
                                                <span className="w-10 text-right text-[10px] font-bold tabular-nums text-[#90a3c4]">{12 + i * 3}ms</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-6 grid grid-cols-2 gap-3">
                                        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-center">
                                            <div className="sales-title text-2xl font-bold text-white">99.9%</div>
                                            <div className="mt-1 text-[10px] uppercase tracking-[0.1em] text-[#90a3c4]">Uptime</div>
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-center">
                                            <div className="sales-title text-2xl font-bold text-[#67ddff]">&lt;50ms</div>
                                            <div className="mt-1 text-[10px] uppercase tracking-[0.1em] text-[#90a3c4]">Avg Latency</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── Pricing ─────────────────────────────────────── */}
                <section id="pricing" className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6">
                    <div className="mb-8 text-center">
                        <h2 className="sales-title text-3xl font-bold text-white sm:text-5xl">{t("landing.pricing.title")}</h2>
                        <p className="mt-3 text-[#b7c5de]">{t("landing.pricing.desc")}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        {plans.map((plan) => (
                            <article
                                key={plan.name}
                                className={`sales-panel relative flex flex-col p-6 transition-all hover:border-[#67ddff]/25 ${plan.popular ? "ring-1 ring-[#67ddff]/60 shadow-[0_16px_36px_rgba(40,154,255,0.25)]" : ""}`}
                            >
                                {plan.popular && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[linear-gradient(135deg,#1ec8ff,#3359ff)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.09em] text-[#071226]">
                                        {t("landing.pricing.popular")}
                                    </span>
                                )}
                                <h3 className="sales-title text-2xl font-bold text-white">{plan.name}</h3>
                                <p className="mt-2 text-4xl font-black text-[#75e3ff]">{plan.price}</p>
                                <ul className="mt-5 flex-1 space-y-2.5">
                                    {plan.items.map((item) => (
                                        <li key={item} className="flex gap-2 text-[#c4d2ea]">
                                            <CheckCircle2 size={15} className="mt-1 shrink-0 text-[#9beeff]" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    href="/dashboard"
                                    className={`mt-6 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-bold transition-all ${plan.popular
                                        ? "bg-[linear-gradient(135deg,#1ec8ff,#3359ff)] text-[#061226] hover:shadow-[0_10px_24px_rgba(30,200,255,0.35)]"
                                        : "border border-white/20 bg-white/5 text-white hover:bg-white/10"
                                        }`}
                                >
                                    {t("landing.pricing.get_started")}
                                </Link>
                            </article>
                        ))}
                    </div>
                </section>

                {/* ─── Final CTA ───────────────────────────────────── */}
                <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6">
                    <div className="sales-panel overflow-hidden p-8 text-center sm:p-12">
                        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(600px 400px at 50% 30%, rgba(30,200,255,0.3), transparent 70%)" }} />
                        <h2 className="sales-title relative z-10 mx-auto max-w-3xl text-3xl font-bold text-white sm:text-5xl">
                            {t("landing.cta_final.title")}
                        </h2>
                        <div className="relative z-10 mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#1ec8ff,#3359ff)] px-8 py-4 text-base font-bold text-[#061226] shadow-[0_14px_30px_rgba(34,135,255,0.35)] transition-all hover:shadow-[0_18px_40px_rgba(34,135,255,0.5)]"
                            >
                                {t("landing.cta_final.book")}
                                <ArrowRight size={17} />
                            </Link>
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-base font-bold text-white transition-all hover:bg-white/10"
                            >
                                {t("landing.cta_final.start")}
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* ─── Footer ──────────────────────────────────────── */}
            <footer className="border-t border-white/10 px-4 py-8 sm:px-6">
                <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 text-sm text-[#9db0cf] md:flex-row">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#1ec8ff,#3359ff)] text-[#051224]">
                            <Zap size={13} className="fill-current" />
                        </div>
                        <span className="sales-title font-bold text-white">Sales<span className="text-[#67ddff]">AI</span></span>
                    </div>
                    <div className="flex items-center gap-5 text-xs">
                        <a href="#" className="transition-colors hover:text-white">Privacy</a>
                        <a href="#" className="transition-colors hover:text-white">Terms</a>
                        <a href="#" className="transition-colors hover:text-white">Security</a>
                    </div>
                    <span className="text-xs text-[#6b7fa0]">© 2026 SalesAI Enterprise</span>
                </div>
            </footer>
        </div>
    );
}
