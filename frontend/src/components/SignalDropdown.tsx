import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";

interface Option<K extends string> {
  key: K;
  label: string;
}

interface SignalDropdownProps<K extends string> {
  title: string;
  icon: Parameters<typeof HugeiconsIcon>[0]["icon"];
  accent: "emerald" | "red";
  options: Option<K>[];
  selected: Set<K>;
  onChange: (next: Set<K>) => void;
}

const ACCENT_CLASSES = {
  emerald: {
    text: "text-emerald-400",
    border: "border-emerald-800",
    ring: "focus:ring-emerald-700",
    check: "accent-emerald-500",
  },
  red: {
    text: "text-red-400",
    border: "border-red-900",
    ring: "focus:ring-red-800",
    check: "accent-red-500",
  },
};

export default function SignalDropdown<K extends string>({
  title,
  icon,
  accent,
  options,
  selected,
  onChange,
}: SignalDropdownProps<K>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const classes = ACCENT_CLASSES[accent];

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function toggle(key: K) {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(next);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-full border ${classes.border} bg-neutral-900 px-3 py-1.5 text-sm font-medium ${classes.text}`}
      >
        <HugeiconsIcon icon={icon} size={16} />
        {title}
        {selected.size > 0 && (
          <span className="rounded-full bg-neutral-800 px-1.5 text-xs text-neutral-200">{selected.size}</span>
        )}
        <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
      </button>

      {open && (
        <div className="absolute z-10 mt-2 w-56 rounded-lg border border-neutral-800 bg-neutral-900 py-2 shadow-lg">
          <div className={`px-3 py-1 text-sm font-semibold ${classes.text}`}>{title}</div>
          {options.map((opt) => (
            <label
              key={opt.key}
              className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-800"
            >
              <input
                type="checkbox"
                className={classes.check}
                checked={selected.has(opt.key)}
                onChange={() => toggle(opt.key)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
