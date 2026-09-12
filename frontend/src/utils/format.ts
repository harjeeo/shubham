export function toNumber(value: unknown): number {
  const n = typeof value === "string" ? parseFloat(value) : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatPrice(value: unknown): string {
  const n = toNumber(value);
  if (n === 0) return "-";
  const decimals = n < 1 ? 6 : n < 100 ? 4 : 2;
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatCompact(value: unknown): string {
  const n = toNumber(value);
  return n.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 2 });
}

export function getChangePercent(close: unknown, open: unknown): number | null {
  const c = toNumber(close);
  const o = toNumber(open);
  if (!o) return null;
  return ((c - o) / o) * 100;
}

export function formatPercent(value: number | null): string {
  if (value === null) return "-";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}
