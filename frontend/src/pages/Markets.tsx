import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, ArrowUp01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { useLiveTickers } from "../hooks/useLiveTickers";
import { useLevels } from "../hooks/useLevels";
import { formatCompact, formatPercent, formatPrice, getChangePercent, toNumber } from "../utils/format";
import {
  BULLISH_OPTIONS,
  BEARISH_OPTIONS,
  evaluateSignals,
  type BullishSignalKey,
  type BearishSignalKey,
} from "../utils/signals";
import SignalDropdown from "../components/SignalDropdown";
import type { Ticker } from "../types/market";

type SortKey = "symbol" | "close" | "change" | "volume" | "oi";
type SortDir = "asc" | "desc";
type SignalGroup = "bullish" | "bearish";
type SignalColumn = { key: BullishSignalKey | BearishSignalKey; label: string; group: SignalGroup };

export default function Markets() {
  const { tickers, loading, error } = useLiveTickers();
  const levels = useLevels();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("volume");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [bullishFilter, setBullishFilter] = useState<Set<BullishSignalKey>>(new Set());
  const [bearishFilter, setBearishFilter] = useState<Set<BearishSignalKey>>(new Set());

  const activeBadges: SignalColumn[] = useMemo(
    () => [
      ...BULLISH_OPTIONS.filter((o) => bullishFilter.has(o.key)).map((o) => ({ ...o, group: "bullish" as const })),
      ...BEARISH_OPTIONS.filter((o) => bearishFilter.has(o.key)).map((o) => ({ ...o, group: "bearish" as const })),
    ],
    [bullishFilter, bearishFilter]
  );

  const rows = useMemo(() => {
    const filtered = tickers.filter((t) =>
      t.symbol.toLowerCase().includes(query.trim().toLowerCase())
    );

    const withSignals = filtered.map((t) => ({
      ticker: t,
      change: getChangePercent(t.close, t.open),
      signals: evaluateSignals(t, levels[t.symbol]),
    }));

    const hasActiveFilter = bullishFilter.size > 0 || bearishFilter.size > 0;
    const signalFiltered = hasActiveFilter
      ? withSignals.filter(
          ({ signals }) =>
            [...bullishFilter].some((k) => signals.bullish[k]) ||
            [...bearishFilter].some((k) => signals.bearish[k])
        )
      : withSignals;

    signalFiltered.sort((a, b) => {
      let diff = 0;
      switch (sortKey) {
        case "symbol":
          diff = a.ticker.symbol.localeCompare(b.ticker.symbol);
          break;
        case "close":
          diff = toNumber(a.ticker.close) - toNumber(b.ticker.close);
          break;
        case "change":
          diff = (a.change ?? 0) - (b.change ?? 0);
          break;
        case "volume":
          diff =
            toNumber(a.ticker.turnover_usd ?? a.ticker.volume) - toNumber(b.ticker.turnover_usd ?? b.ticker.volume);
          break;
        case "oi":
          diff = toNumber(a.ticker.oi_value_usd ?? a.ticker.oi) - toNumber(b.ticker.oi_value_usd ?? b.ticker.oi);
          break;
      }
      return sortDir === "asc" ? diff : -diff;
    });

    return signalFiltered;
  }, [tickers, levels, query, sortKey, sortDir, bullishFilter, bearishFilter]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Markets</h1>
        <span className="text-xs text-neutral-500">
          {loading ? "Connecting…" : `${rows.length} pairs · live`}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative max-w-xs flex-1 min-w-[200px]">
          <HugeiconsIcon
            icon={Search01Icon}
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symbol..."
            className="w-full rounded-lg bg-neutral-800 border border-neutral-700 py-2 pl-9 pr-3 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
          />
        </div>

        <SignalDropdown
          title="Bullish Signal"
          icon={ArrowUp01Icon}
          accent="emerald"
          options={BULLISH_OPTIONS}
          selected={bullishFilter}
          onChange={setBullishFilter}
        />
        <SignalDropdown
          title="Bearish Signal"
          icon={ArrowDown01Icon}
          accent="red"
          options={BEARISH_OPTIONS}
          selected={bearishFilter}
          onChange={setBearishFilter}
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-900 bg-red-950/50 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-neutral-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-900 text-left text-neutral-400">
              <Th label="Symbol" onClick={() => toggleSort("symbol")} active={sortKey === "symbol"} dir={sortDir} />
              <Th label="Last Price" onClick={() => toggleSort("close")} active={sortKey === "close"} dir={sortDir} align="right" />
              <Th label="24h Change" onClick={() => toggleSort("change")} active={sortKey === "change"} dir={sortDir} align="right" />
              <Th label="24h Volume" onClick={() => toggleSort("volume")} active={sortKey === "volume"} dir={sortDir} align="right" />
              <Th label="Open Interest" onClick={() => toggleSort("oi")} active={sortKey === "oi"} dir={sortDir} align="right" />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ ticker, change, signals }) => (
              <Row key={ticker.symbol} ticker={ticker} change={change} signals={signals} badges={activeBadges} />
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-neutral-500">
                  No pairs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({
  ticker,
  change,
  signals,
  badges,
}: {
  ticker: Ticker;
  change: number | null;
  signals: ReturnType<typeof evaluateSignals>;
  badges: SignalColumn[];
}) {
  const changeColor =
    change === null ? "text-neutral-400" : change > 0 ? "text-emerald-400" : change < 0 ? "text-red-400" : "text-neutral-400";

  const matchedBadges = badges.filter((b) =>
    b.group === "bullish" ? signals.bullish[b.key as BullishSignalKey] : signals.bearish[b.key as BearishSignalKey]
  );

  return (
    <tr className="border-t border-neutral-800 hover:bg-neutral-900/60">
      <td className="px-4 py-3 font-medium text-neutral-100">
        <div className="flex flex-wrap items-center gap-1.5">
          <span>{ticker.symbol}</span>
          {matchedBadges.map((b) => (
            <span
              key={b.key}
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none whitespace-nowrap ${
                b.group === "bullish"
                  ? "bg-emerald-900/40 text-emerald-400"
                  : "bg-red-900/40 text-red-400"
              }`}
            >
              {b.label}
            </span>
          ))}
        </div>
      </td>
      <td className="px-4 py-3 text-right tabular-nums">{formatPrice(ticker.close)}</td>
      <td className={`px-4 py-3 text-right tabular-nums ${changeColor}`}>{formatPercent(change)}</td>
      <td className="px-4 py-3 text-right tabular-nums text-neutral-300">
        {formatCompact(ticker.turnover_usd ?? ticker.volume)}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-neutral-300">
        {formatCompact(ticker.oi_value_usd ?? ticker.oi)}
      </td>
    </tr>
  );
}

function Th({
  label,
  onClick,
  active,
  dir,
  align = "left",
}: {
  label: string;
  onClick: () => void;
  active: boolean;
  dir: SortDir;
  align?: "left" | "right";
}) {
  return (
    <th
      onClick={onClick}
      className={`px-4 py-3 font-medium cursor-pointer select-none whitespace-nowrap ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {label}
      {active && <span className="ml-1 text-neutral-500">{dir === "asc" ? "▲" : "▼"}</span>}
    </th>
  );
}
