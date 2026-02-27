"use client";

import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeProvider";

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="icon-btn theme-toggle"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            aria-label="Toggle Theme"
        >
            {theme === "light" ? (
                <Moon size={18} strokeWidth={2.5} />
            ) : (
                <Sun size={18} strokeWidth={2.5} />
            )}
        </button>
    );
};

export default ThemeToggle;
