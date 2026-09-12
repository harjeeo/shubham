import { useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUp01Icon,
  ArrowDown01Icon,
  ChartIncreaseIcon,
  ChartDecreaseIcon,
  Coins01Icon,
} from "@hugeicons/core-free-icons";
import { useLiveTickers } from "../hooks/useLiveTickers";
import { formatCompact, formatPercent, formatPrice, getChangePercent, toNumber } from "../utils/format";
import type { Ticker } from "../types/market";

const TOP_N = 5;

export default function Dashboard() {
  const { tickers, loading, error } = useLiveTickers();

  const { gainers, losers, gainersCount, losersCount, totalVolume } = useMemo(() => {
    const withChange = tickers.map((t) => ({
      ticker: t,
      change: getChangePercent(t.close, t.open),
    }));

    const ranked = withChange.filter((r) => r.change !== null) as { ticker: Ticker; change: number }[];

    const gainersRanked = ranked.filter((r) => r.change > 0).sort((a, b) => b.change - a.change);
    const losersRanked = ranked.filter((r) => r.change < 0).sort((a, b) => a.change - b.change);

    const volume = tickers.reduce((sum, t) => sum + toNumber(t.turnover_usd || t.volume), 0);

    return {
      gainers: gainersRanked.slice(0, TOP_N),
      losers: losersRanked.slice(0, TOP_N),
      gainersCount: gainersRanked.length,
      losersCount: losersRanked.length,
      totalVolume: volume,
    };
  }, [tickers]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <span className="text-xs text-neutral-500">
          {loading ? "Connecting…" : `${tickers.length} pairs tracked · live`}
        </span>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-900 bg-red-950/50 px-4 py-2 text-sm text-red-300 light:border-red-200 light:bg-red-50 light:text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={Coins01Icon} label="Pairs Tracked" value={String(tickers.length)} />
        <StatCard
          icon={ChartIncreaseIcon}
          label="Gainers"
          value={String(gainersCount)}
          accent="text-emerald-400 light:text-emerald-600"
        />
        <StatCard
          icon={ChartDecreaseIcon}
          label="Losers"
          value={String(losersCount)}
          accent="text-red-400 light:text-red-600"
        />
      </div>

      <div className="mb-4 text-xs text-neutral-500 light:text-neutral-500">
        Total 24h Turnover:{" "}
        <span className="text-neutral-300 light:text-neutral-700">${formatCompact(totalVolume)}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MoversPanel
          title="Top Gainers"
          icon={ArrowUp01Icon}
          accent="text-emerald-400 light:text-emerald-600"
          rows={gainers}
          emptyLabel="No gainers right now."
        />
        <MoversPanel
          title="Top Losers"
          icon={ArrowDown01Icon}
          accent="text-red-400 light:text-red-600"
          rows={losers}
          emptyLabel="No losers right now."
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent = "text-neutral-100 light:text-neutral-900",
}: {
  icon: typeof Coins01Icon;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4 flex items-center gap-3 light:border-neutral-200 light:bg-white">
      <div className="rounded-lg bg-neutral-800 p-2 light:bg-neutral-100">
        <HugeiconsIcon icon={icon} size={20} className={accent} />
      </div>
      <div>
        <div className="text-xs text-neutral-500">{label}</div>
        <div className={`text-xl font-semibold ${accent}`}>{value}</div>
      </div>
    </div>
  );
}

function MoversPanel({
  title,
  icon,
  accent,
  rows,
  emptyLabel,
}: {
  title: string;
  icon: typeof ArrowUp01Icon;
  accent: string;
  rows: { ticker: Ticker; change: number }[];
  emptyLabel: string;
}) {
  return (
    <div className="rounded-lg border border-neutral-800 overflow-hidden light:border-neutral-200">
      <div className="flex items-center gap-2 bg-neutral-900 px-4 py-3 light:bg-neutral-50">
        <HugeiconsIcon icon={icon} size={18} className={accent} />
        <h2 className="text-sm font-medium">{title}</h2>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map(({ ticker, change }) => (
            <tr
              key={ticker.symbol}
              className="border-t border-neutral-800 hover:bg-neutral-900/60 light:border-neutral-200 light:hover:bg-neutral-50"
            >
              <td className="px-4 py-3 font-medium text-neutral-100 light:text-neutral-900">{ticker.symbol}</td>
              <td className="px-4 py-3 text-right tabular-nums text-neutral-300 light:text-neutral-600">
                {formatPrice(ticker.close)}
              </td>
              <td className={`px-4 py-3 text-right tabular-nums font-medium ${accent}`}>
                {formatPercent(change)}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-neutral-500">
                {emptyLabel}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
