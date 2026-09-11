"use client";

import { STYLES, type StyleKey } from "@/lib/content";
import { Info } from "./Icons";

type Props = {
  value: StyleKey;
  onChange: (next: StyleKey) => void;
};

/**
 * "Your Sukoona style" control.
 * Drag the bar or press a button — both set the same value.
 * The native range input gives pointer drag and arrow-key control for free.
 */
export default function StyleBar({ value, onChange }: Props) {
  const index = STYLES.findIndex((s) => s.key === value);
  const active = STYLES[index];

  return (
    <section
      aria-labelledby="style-heading"
      className="themed rounded-[var(--radius-card)] border border-[var(--stage-line)] bg-[var(--stage-chip)] p-5 sm:p-7"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3
          id="style-heading"
          className="font-display text-[1.55rem] leading-tight text-[var(--stage-ink)] sm:text-[1.8rem]"
        >
          Your Sukoona style
        </h3>
        <p className="text-sm font-semibold text-[var(--stage-accent)]">{active.label}</p>
      </div>

      <p className="mt-1.5 flex items-start gap-2 text-sm leading-relaxed text-[var(--stage-muted)]">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Changes colours and the illustration only. Product details stay the same.</span>
      </p>

      <div className="mt-6">
        <label htmlFor="style-range" className="sr-only">
          Visual style: Soft, Balanced or Bold
        </label>
        <input
          id="style-range"
          className="style-range"
          type="range"
          min={0}
          max={STYLES.length - 1}
          step={1}
          value={index}
          onChange={(e) => onChange(STYLES[Number(e.target.value)].key)}
          aria-valuetext={active.label}
        />
        <div className="-mt-1 flex justify-between" aria-hidden="true">
          {STYLES.map((s) => (
            <span
              key={s.key}
              className={
                s.key === value
                  ? "text-xs font-semibold tracking-wide text-[var(--stage-accent)] transition-colors"
                  : "text-xs font-semibold tracking-wide text-[var(--stage-muted)] transition-colors"
              }
            >
              {s.label}
            </span>
          ))}
        </div>
      </div>

      <div role="radiogroup" aria-label="Visual style" className="mt-5 grid grid-cols-3 gap-2">
        {STYLES.map((s) => {
          const selected = s.key === value;
          return (
            <button
              key={s.key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(s.key)}
              className={
                "cursor-pointer rounded-2xl border px-3 py-3 text-center transition-all duration-200 active:scale-[0.97] " +
                (selected
                  ? "border-transparent bg-[var(--stage-accent)] text-[var(--stage-accent-ink)] shadow-[var(--shadow-soft)]"
                  : "border-[var(--stage-line)] bg-transparent text-[var(--stage-ink)] hover:border-[var(--stage-accent)] hover:bg-[var(--stage-accent-soft)]")
              }
            >
              <span className="block text-sm font-bold">{s.label}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-sm text-[var(--stage-muted)]">{active.blurb}</p>
    </section>
  );
}
