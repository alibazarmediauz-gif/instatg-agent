import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import BentoFeatures from "@/components/landing/BentoFeatures";
import HowItWorks from "@/components/landing/HowItWorks";
import Pricing from "@/components/landing/Pricing";
import CallToAction from "@/components/landing/CallToAction";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-slate-950 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
            <Header />

            <main>
                <Hero />
                <BentoFeatures />
                <HowItWorks />
                <Pricing />
                <CallToAction />
            </main>

            <footer className="border-t border-white/10 bg-slate-950/50 py-12 text-center text-slate-500 text-sm mt-32">
                <div className="mx-auto max-w-7xl px-4">
                    <p>© {new Date().getFullYear()} InstaTG Agent. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
