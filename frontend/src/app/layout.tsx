import type { Metadata } from "next";
import "./globals.css";
import { TenantProvider } from "@/lib/TenantContext";
import { LanguageProvider } from "@/lib/LanguageContext";
import { ThemeProvider } from "@/context/ThemeProvider";

export const metadata: Metadata = {
    title: "SalesAI — AI Sales Automation",
    description: "AI-powered sales automation platform for Telegram and Instagram",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                <ThemeProvider>
                    <TenantProvider>
                        <LanguageProvider>
                            {children}
                        </LanguageProvider>
                    </TenantProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
