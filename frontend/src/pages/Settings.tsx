import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PaintBoardIcon, Sun01Icon, Moon02Icon } from "@hugeicons/core-free-icons";
import { useTheme, type Theme } from "../context/ThemeContext";

const TABS = [{ key: "appearance", label: "Appearance", icon: PaintBoardIcon }] as const;

export default function Settings() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["key"]>("appearance");

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      <div className="flex flex-col sm:flex-row gap-6">
        <nav className="flex sm:flex-col gap-1 sm:w-48 shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-neutral-800 text-neutral-100 light:bg-neutral-100 light:text-neutral-900"
                  : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 light:text-neutral-500 light:hover:bg-neutral-100 light:hover:text-neutral-900"
              }`}
            >
              <HugeiconsIcon icon={tab.icon} size={18} />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex-1">{activeTab === "appearance" && <AppearanceTab />}</div>
      </div>
    </div>
  );
}

function AppearanceTab() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <h2 className="text-sm font-medium text-neutral-300 light:text-neutral-600 mb-3">Theme</h2>
      <div className="flex gap-4">
        <ThemeOption
          label="Dark Mode"
          icon={Moon02Icon}
          value="dark"
          active={theme === "dark"}
          onSelect={setTheme}
        />
        <ThemeOption
          label="Light Mode"
          icon={Sun01Icon}
          value="light"
          active={theme === "light"}
          onSelect={setTheme}
        />
      </div>
    </div>
  );
}

function ThemeOption({
  label,
  icon,
  value,
  active,
  onSelect,
}: {
  label: string;
  icon: typeof Moon02Icon;
  value: Theme;
  active: boolean;
  onSelect: (theme: Theme) => void;
}) {
  return (
    <button
      onClick={() => onSelect(value)}
      className={`flex flex-col items-center gap-2 rounded-lg border px-8 py-5 text-sm font-medium transition-colors ${
        active
          ? "border-emerald-600 bg-emerald-900/10 text-emerald-400 light:border-emerald-400 light:bg-emerald-50 light:text-emerald-600"
          : "border-neutral-800 text-neutral-300 hover:border-neutral-700 light:border-neutral-200 light:text-neutral-600 light:hover:border-neutral-300"
      }`}
    >
      <HugeiconsIcon icon={icon} size={24} />
      {label}
    </button>
  );
}
