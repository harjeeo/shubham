import { NavLink } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  ChartLineData01Icon,
  StarIcon,
  Search01Icon,
  Notification01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";

const navItems = [
  { to: "/", label: "Dashboard", icon: DashboardSquare01Icon },
  { to: "/markets", label: "Markets", icon: ChartLineData01Icon },
  { to: "/watchlist", label: "Watchlist", icon: StarIcon },
  { to: "/coin", label: "Coin Detail", icon: Search01Icon },
  { to: "/alerts", label: "Alerts", icon: Notification01Icon },
  { to: "/settings", label: "Settings", icon: Settings01Icon },
];

export default function Sidebar() {
  return (
    <aside className="h-screen w-60 shrink-0 bg-neutral-950 text-neutral-200 flex flex-col border-r border-neutral-800">
      <div className="px-5 py-5 text-lg font-semibold text-white">
        Crypto Screener
      </div>
      <nav className="flex-1 px-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-neutral-800 text-white"
                  : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
              }`
            }
          >
            <HugeiconsIcon icon={item.icon} size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
