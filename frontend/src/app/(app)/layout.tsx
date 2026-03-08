"use client";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import BackendDiagnostic from "@/components/BackendDiagnostic";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="app-layout">
            <div className="premium-bg" />
            <Sidebar />
            <main className="main-content" style={{ overflowY: "auto" }}>
                <TopBar />
                <BackendDiagnostic />
                {children}
            </main>
        </div>
    );
}
