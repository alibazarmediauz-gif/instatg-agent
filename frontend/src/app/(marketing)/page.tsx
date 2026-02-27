"use client";

import { useEffect, useRef } from "react";
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

/* ─── Scroll Reveal Hook ──────────────────────────────────── */
function useScrollReveal() {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const revealTarget = (t: Element) => {
            t.classList.add("revealed");
            t.querySelectorAll(".sales-reveal").forEach((c) => c.classList.add("revealed"));
        };

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) revealTarget(e.target);
                });
            },
            { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
        );

        const targets = el.querySelectorAll(".sales-reveal");
        targets.forEach((t) => observer.observe(t));
        if (el.classList.contains("sales-reveal")) observer.observe(el);

        // Failsafe: reveal all after 1.5s in case IntersectionObserver misses
        const timer = setTimeout(() => {
            targets.forEach((t) => revealTarget(t));
            if (el.classList.contains("sales-reveal")) revealTarget(el);
        }, 1500);

        return () => {
            observer.disconnect();
            clearTimeout(timer);
        };
    }, []);
    return ref;
}

export default function LandingPage() {
    const { t, locale, setLocale } = useLanguage();
    const revealRef = useScrollReveal();

    const switchLang = () => {
        const next: Record<string, "en" | "ru" | "uz"> = { uz: "ru", ru: "en", en: "uz" };
        setLocale(next[locale]);
    };

    const solutions = [
        { icon: <MessageSquareText size={20} />, title: t("landing.solution.f1"), desc: t("landing.solution.f1_d") },
        { icon: <Headphones size={20} />, title: t("landing.solution.f2"), desc: t("landing.solution.f2_d") },
        { icon: <Layers3 size={20} />, title: t("landing.solution.f3"), desc: t("landing.solution.f3_d") },
        { icon: <Database size={20} />, title: t("landing.solution.f4"), desc: t("landing.solution.f4_d") },
    ];

    const techFeatures = [
        { icon: <Database size={18} />, title: t("landing.features.f1_t"), desc: t("landing.features.f1_d") },
        { icon: <Globe size={18} />, title: t("landing.features.f2_t"), desc: t("landing.features.f2_d") },
        { icon: <Radio size={18} />, title: t("landing.features.f3_t"), desc: t("landing.features.f3_d") },
        { icon: <ShieldCheck size={18} />, title: t("landing.features.f4_t"), desc: t("landing.features.f4_d") },
        { icon: <Cpu size={18} />, title: t("landing.features.f5_t"), desc: t("landing.features.f5_d") },
        { icon: <Layout size={18} />, title: t("landing.features.f6_t"), desc: t("landing.features.f6_d") },
    ];

    const steps = [
        t("landing.how_it_works.s1"), t("landing.how_it_works.s2"), t("landing.how_it_works.s3"),
        t("landing.how_it_works.s4"), t("landing.how_it_works.s5"), t("landing.how_it_works.s6"),
    ];

    const plans = [
        {
            name: t("landing.pricing.basic_name"), price: "$49", per: t("landing.dashboard.per_month"),
            items: [t("landing.pricing.f_1_agent"), t("landing.pricing.f_1k_chats"), t("landing.pricing.f_crm_sync"), t("landing.pricing.f_tg_channel")],
        },
        {
            name: t("landing.pricing.pro_name"), price: "$199", per: t("landing.dashboard.per_month"), popular: true,
            items: [t("landing.pricing.f_5_agents"), t("landing.pricing.f_10k_chats"), t("landing.pricing.f_voice_ai"), t("landing.pricing.f_sip"), t("landing.pricing.f_analytics")],
        },
        {
            name: t("landing.pricing.ent_name"), price: t("landing.pricing.custom"), per: "",
            items: [t("landing.pricing.f_unlimited_agents"), t("landing.pricing.f_unlimited_usage"), t("landing.pricing.f_finetuning"), t("landing.pricing.f_dedicated"), t("landing.pricing.f_sla")],
        },
    ];

    return (
        <div className="sales-landing min-h-screen" ref={revealRef}>
            {/* ─── Animated Background Orbs ─── */}
            <div className="sales-orb sales-orb-1" />
            <div className="sales-orb sales-orb-2" />
            <div className="sales-orb sales-orb-3" />

            {/* ─── Nav ─── */}
            <header className="sales-nav sticky top-0 z-50">
                <div className="mx-auto flex h-[4.25rem] w-full max-w-7xl items-center justify-between px-5 sm:px-8">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#1ec8ff,#3359ff)] text-[#050a14] shadow-[0_0_20px_rgba(30,200,255,0.3)]">
                            <Zap size={17} className="fill-current" />
                        </div>
                        <span className="sales-title text-[1.35rem] font-bold text-white">Sales<span className="text-[#67ddff]">AI</span></span>
                    </Link>

                    <nav className="hidden items-center gap-8 text-[0.82rem] font-semibold text-[#8899b7] md:flex">
                        <a href="#features" className="transition-colors duration-300 hover:text-white">{t("landing.header.features")}</a>
                        <a href="#how" className="transition-colors duration-300 hover:text-white">{t("landing.header.integrations")}</a>
                        <a href="#pricing" className="transition-colors duration-300 hover:text-white">{t("landing.header.pricing")}</a>
                    </nav>

                    <div className="flex items-center gap-3">
                        <button onClick={switchLang} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-[#8899b7] transition-all hover:border-white/20 hover:text-white">
                            <Globe size={11} /> {locale}
                        </button>
                        <ThemeToggle />
                        <Link href="/dashboard" className="sales-btn-primary hidden !px-4 !py-2 !text-[0.8rem] sm:inline-flex">
                            {t("nav.control_center")}
                        </Link>
                    </div>
                </div>
            </header>

            <main>
                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                {/* HERO                                                  */}
                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <section className="sales-section sales-grid-bg relative mx-auto w-full max-w-7xl px-5 sm:px-8">
                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
                        {/* Copy */}
                        <div className="lg:col-span-7">
                            <div className="sales-chip sales-reveal mb-6 inline-flex items-center gap-2">
                                <span className="sales-pulse-dot" />
                                {t("landing.hero.badge")}
                            </div>

                            <h1 className="sales-title sales-reveal sales-reveal-delay-1 text-[2.75rem] font-extrabold leading-[1.08] sm:text-[3.5rem] lg:text-[4.2rem]">
                                <span className="sales-gradient-text">{t("landing.hero.title")}</span>
                            </h1>

                            <p className="sales-reveal sales-reveal-delay-2 mt-7 max-w-xl text-[1.05rem] leading-[1.7] text-[#8899b7]">
                                {t("landing.hero.subtitle")}
                            </p>

                            <div className="sales-reveal sales-reveal-delay-3 mt-9 flex flex-col gap-3.5 sm:flex-row">
                                <Link href="/dashboard" className="sales-btn-primary">
                                    {t("landing.hero.cta_primary")} <ArrowRight size={17} />
                                </Link>
                                <Link href="/dashboard" className="sales-btn-ghost">
                                    {t("landing.hero.cta_secondary")}
                                </Link>
                            </div>

                            {/* Social Proof */}
                            <div className="sales-reveal sales-reveal-delay-4 mt-14 flex flex-wrap gap-10 border-t border-white/[0.06] pt-10">
                                <div>
                                    <div className="sales-title text-[2rem] font-extrabold text-white">1,200+</div>
                                    <div className="mt-1 text-[0.68rem] uppercase tracking-[0.12em] text-[#6b7fa0]">{t("landing.stats.active_agents")}</div>
                                </div>
                                <div>
                                    <div className="sales-title text-[2rem] font-extrabold text-white">98.7%</div>
                                    <div className="mt-1 text-[0.68rem] uppercase tracking-[0.12em] text-[#6b7fa0]">Uptime SLA</div>
                                </div>
                                <div>
                                    <div className="sales-title text-[2rem] font-extrabold text-[#67ddff]">&lt;42s</div>
                                    <div className="mt-1 text-[0.68rem] uppercase tracking-[0.12em] text-[#6b7fa0]">{t("landing.stats.first_response")}</div>
                                </div>
                            </div>
                        </div>

                        {/* Dashboard Mock */}
                        <div className="sales-reveal sales-reveal-delay-3 lg:col-span-5">
                            <div className="sales-panel p-6">
                                <div className="mb-5 flex items-center justify-between">
                                    <span className="text-[0.68rem] uppercase tracking-[0.12em] text-[#6b7fa0]">{t("landing.dashboard.weekly")}</span>
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-emerald-300">
                                        <span className="sales-pulse-dot" /> Live
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { label: t("landing.dashboard.new_leads"), value: "1,248", color: "text-white" },
                                        { label: t("landing.dashboard.conversion"), value: "+34%", color: "text-emerald-300", icon: <TrendingUp size={13} /> },
                                        { label: t("landing.dashboard.response_time"), value: "42 sec", color: "text-white", icon: <Clock3 size={12} /> },
                                    ].map((row) => (
                                        <div key={row.label} className="sales-soft-box flex items-center justify-between">
                                            <span className="text-sm text-[#8899b7]">{row.label}</span>
                                            <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${row.color}`}>
                                                {row.icon} {row.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-5 grid grid-cols-3 gap-2">
                                    {["amoCRM", "Telegram", "Instagram"].map((n) => (
                                        <div key={n} className="rounded-lg border border-white/[0.06] bg-white/[0.02] py-2 text-center text-[0.7rem] text-[#6b7fa0]">{n}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="sales-divider mx-auto max-w-5xl" />

                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                {/* INTEGRATIONS BANNER                                   */}
                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <section className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8">
                    <div className="sales-reveal text-center">
                        <p className="mb-4 text-[0.65rem] uppercase tracking-[0.25em] text-[#6b7fa0]">
                            {t("landing.integrations_section.title")}
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            {["amoCRM", "Telegram", "Instagram", "Zadarma", "Excel/Sheets"].map((item) => (
                                <span key={item} className="rounded-full border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-[0.82rem] font-semibold text-[#8899b7] transition-all hover:border-[#67ddff]/20 hover:text-white">
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="sales-divider mx-auto max-w-5xl" />

                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                {/* PROBLEM / SOLUTION                                    */}
                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <section className="sales-section mx-auto w-full max-w-7xl px-5 sm:px-8">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Problem */}
                        <div className="sales-reveal sales-panel p-8 sm:p-10">
                            <h2 className="sales-title text-[1.75rem] font-extrabold text-white sm:text-[2.25rem]">
                                {t("landing.problem.title")}
                            </h2>
                            <div className="mt-7 space-y-3">
                                {[t("landing.problem.p1"), t("landing.problem.p2"), t("landing.problem.p3"), t("landing.problem.p4"), t("landing.problem.p5")].map((p, i) => (
                                    <div key={i} className="flex items-center gap-3 rounded-xl border border-red-300/15 bg-red-300/[0.06] px-4 py-3 text-sm text-[#ffb8b8]">
                                        <ShieldCheck size={14} className="shrink-0 text-red-300/70" />
                                        <span>{p}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Solution */}
                        <div className="sales-reveal sales-reveal-delay-2 sales-panel p-8 sm:p-10">
                            <h2 className="sales-title text-[1.75rem] font-extrabold text-white sm:text-[2.25rem]">
                                {t("landing.solution.title")}
                            </h2>
                            <p className="mt-4 text-[0.92rem] leading-relaxed text-[#8899b7]">{t("landing.solution.desc")}</p>
                            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {solutions.map((s, i) => (
                                    <div key={s.title} className={`sales-soft-box sales-reveal sales-reveal-delay-${i + 1}`}>
                                        <div className="sales-icon-box mb-3">{s.icon}</div>
                                        <h3 className="text-[0.95rem] font-bold text-white">{s.title}</h3>
                                        <p className="mt-1.5 text-[0.82rem] leading-relaxed text-[#8899b7]">{s.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                {/* FEATURES GRID                                         */}
                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <section id="features" className="sales-section mx-auto w-full max-w-7xl px-5 sm:px-8">
                    <div className="sales-reveal mb-14 text-center">
                        <h2 className="sales-title text-[2rem] font-extrabold sm:text-[3rem]">
                            <span className="sales-gradient-text-warm">{t("landing.features.title")}</span>
                        </h2>
                        <p className="mt-4 text-[1rem] text-[#8899b7]">{t("landing.features.desc")}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {techFeatures.map((f, i) => (
                            <div key={f.title} className={`sales-reveal sales-reveal-delay-${i + 1} sales-panel p-7`}>
                                <div className="sales-icon-box mb-4">{f.icon}</div>
                                <h3 className="sales-title text-[1.05rem] font-bold text-white">{f.title}</h3>
                                <p className="mt-2 text-[0.85rem] leading-[1.65] text-[#8899b7]">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="sales-divider mx-auto max-w-5xl" />

                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                {/* HOW IT WORKS                                          */}
                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <section id="how" className="sales-section mx-auto w-full max-w-7xl px-5 sm:px-8">
                    <div className="sales-reveal sales-panel p-8 sm:p-12">
                        <h2 className="sales-title text-[1.75rem] font-extrabold text-white sm:text-[2.5rem]">{t("landing.how_it_works.title")}</h2>
                        <p className="mt-3 max-w-2xl text-[0.95rem] text-[#8899b7]">{t("landing.how_it_works.desc")}</p>
                        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {steps.map((step, idx) => (
                                <div key={idx} className={`sales-reveal sales-reveal-delay-${idx + 1} sales-soft-box flex items-start gap-3.5`}>
                                    <span className="sales-title inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#67ddff]/20 bg-[#67ddff]/[0.06] text-xs font-bold text-[#67ddff]">
                                        {idx + 1}
                                    </span>
                                    <span className="text-[0.9rem] text-[#aabbd6]">{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                {/* SECURITY / INFRASTRUCTURE                             */}
                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <section className="sales-section mx-auto w-full max-w-7xl px-5 sm:px-8">
                    <div className="sales-reveal sales-panel overflow-hidden p-8 sm:p-12">
                        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
                            <div>
                                <h2 className="sales-title text-[1.75rem] font-extrabold text-white sm:text-[2.5rem]">
                                    {t("landing.security.title")}
                                </h2>
                                <p className="mt-4 max-w-lg text-[0.95rem] leading-relaxed text-[#8899b7]">{t("landing.security.desc")}</p>
                                <div className="mt-8 space-y-4">
                                    {[
                                        { icon: <Server size={16} />, t: t("landing.security.f1_t"), d: t("landing.security.f1_d") },
                                        { icon: <Shield size={16} />, t: t("landing.security.f2_t"), d: t("landing.security.f2_d") },
                                        { icon: <Lock size={16} />, t: t("landing.security.f3_t"), d: t("landing.security.f3_d") },
                                    ].map((f, i) => (
                                        <div key={i} className={`sales-reveal sales-reveal-delay-${i + 1} sales-soft-box flex items-start gap-4`}>
                                            <div className="sales-icon-box !h-10 !w-10 shrink-0">{f.icon}</div>
                                            <div>
                                                <h4 className="text-[0.92rem] font-bold text-white">{f.t}</h4>
                                                <p className="mt-0.5 text-[0.82rem] text-[#8899b7]">{f.d}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* System Health Panel */}
                            <div className="sales-reveal sales-reveal-delay-2">
                                <div className="rounded-2xl border border-white/[0.06] bg-[#060e1c] p-7">
                                    <div className="mb-7 flex items-center justify-between">
                                        <span className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#6b7fa0]">System Health</span>
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-wider text-emerald-300">
                                            <span className="sales-pulse-dot" />
                                            {t("landing.dashboard.all_ok")}
                                        </span>
                                    </div>
                                    <div className="space-y-4">
                                        {["API Gateway", "AI Engine", "CRM Sync", "Voice Service", "Queue Workers"].map((name, i) => (
                                            <div key={name} className="flex items-center gap-3">
                                                <span className="w-24 text-[0.72rem] text-[#6b7fa0]">{name}</span>
                                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
                                                    <div className="h-full rounded-full bg-[linear-gradient(90deg,#1ec8ff,#3359ff)]" style={{ width: `${88 + (i * 2.5) % 12}%` }} />
                                                </div>
                                                <span className="w-10 text-right text-[0.62rem] font-bold tabular-nums text-[#6b7fa0]">{12 + i * 3}ms</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-7 grid grid-cols-2 gap-3">
                                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
                                            <div className="sales-title text-[1.5rem] font-extrabold text-white">99.9%</div>
                                            <div className="mt-1 text-[0.58rem] uppercase tracking-[0.1em] text-[#6b7fa0]">Uptime</div>
                                        </div>
                                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
                                            <div className="sales-title text-[1.5rem] font-extrabold text-[#67ddff]">&lt;50ms</div>
                                            <div className="mt-1 text-[0.58rem] uppercase tracking-[0.1em] text-[#6b7fa0]">Avg Latency</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="sales-divider mx-auto max-w-5xl" />

                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                {/* PRICING                                               */}
                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <section id="pricing" className="sales-section mx-auto w-full max-w-7xl px-5 sm:px-8">
                    <div className="sales-reveal mb-14 text-center">
                        <h2 className="sales-title text-[2rem] font-extrabold sm:text-[3rem]">
                            <span className="sales-gradient-text">{t("landing.pricing.title")}</span>
                        </h2>
                        <p className="mt-4 text-[1rem] text-[#8899b7]">{t("landing.pricing.desc")}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                        {plans.map((plan, i) => (
                            <article key={plan.name} className={`sales-reveal sales-reveal-delay-${i + 1} sales-panel relative flex flex-col p-8 ${plan.popular ? "ring-1 ring-[#67ddff]/30 shadow-[0_0_60px_rgba(30,200,255,0.08)]" : ""}`}>
                                {plan.popular && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[linear-gradient(135deg,#1ec8ff,#3359ff)] px-4 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#050a14]">
                                        {t("landing.pricing.popular")}
                                    </span>
                                )}
                                <h3 className="sales-title text-[1.25rem] font-bold text-white">{plan.name}</h3>
                                <div className="mt-3 flex items-baseline gap-1">
                                    <span className="sales-title text-[2.5rem] font-extrabold text-white">{plan.price}</span>
                                    {plan.per && <span className="text-sm text-[#6b7fa0]">{plan.per}</span>}
                                </div>
                                <ul className="mt-7 flex-1 space-y-3">
                                    {plan.items.map((item) => (
                                        <li key={item} className="flex gap-2.5 text-[0.88rem] text-[#aabbd6]">
                                            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#67ddff]/70" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link href="/dashboard" className={`mt-8 ${plan.popular ? "sales-btn-primary w-full" : "sales-btn-ghost w-full"}`}>
                                    {t("landing.pricing.get_started")}
                                </Link>
                            </article>
                        ))}
                    </div>
                </section>

                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                {/* FINAL CTA                                             */}
                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <section className="sales-section relative mx-auto w-full max-w-7xl px-5 sm:px-8">
                    <div className="sales-reveal relative overflow-hidden rounded-[1.5rem] border border-white/[0.08] bg-[#060e1c] px-8 py-16 text-center sm:px-16 sm:py-24">
                        {/* CTA gradient glow */}
                        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ background: "radial-gradient(600px 400px at 50% 20%, rgba(30,200,255,0.2), transparent 70%)" }} />
                        <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: "radial-gradient(400px 300px at 60% 80%, rgba(168,85,247,0.15), transparent 70%)" }} />

                        <h2 className="sales-title relative z-10 mx-auto max-w-3xl text-[1.75rem] font-extrabold text-white sm:text-[2.75rem]">
                            {t("landing.cta_final.title")}
                        </h2>
                        <div className="relative z-10 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <Link href="/dashboard" className="sales-btn-primary !px-10 !py-4 !text-base">
                                {t("landing.cta_final.book")} <ArrowRight size={17} />
                            </Link>
                            <Link href="/dashboard" className="sales-btn-ghost !px-10 !py-4 !text-base">
                                {t("landing.cta_final.start")}
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* ─── Footer ─── */}
            <footer className="border-t border-white/[0.06] px-5 py-10 sm:px-8">
                <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-5 md:flex-row">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#1ec8ff,#3359ff)] text-[#050a14]">
                            <Zap size={12} className="fill-current" />
                        </div>
                        <span className="sales-title text-sm font-bold text-white">Sales<span className="text-[#67ddff]">AI</span></span>
                    </div>
                    <div className="flex items-center gap-6 text-[0.75rem] text-[#6b7fa0]">
                        <a href="#" className="transition-colors hover:text-white">Privacy</a>
                        <a href="#" className="transition-colors hover:text-white">Terms</a>
                        <a href="#" className="transition-colors hover:text-white">Security</a>
                    </div>
                    <span className="text-[0.7rem] text-[#4b5c78]">© 2026 SalesAI</span>
                </div>
            </footer>
        </div>
    );
}
