"use client";

import { useState } from "react";
import { INGREDIENTS } from "@/lib/content";
import { Leaf, Plus } from "./Icons";

/**
 * Clickable ingredient cards. Selecting one opens its detail below.
 * Pressing the open card again closes it.
 */
export default function Ingredients() {
  const [openKey, setOpenKey] = useState<string | null>("chamomile");

  return (
    <section id="ingredients" aria-labelledby="ingredients-heading" className="scroll-mt-6">
      <header className="max-w-xl">
        <p className="text-xs font-bold tracking-[0.16em] text-[var(--accent)] uppercase">
          What goes in
        </p>
        <h2
          id="ingredients-heading"
          className="mt-3 font-display text-[2.1rem] leading-[1.08] text-ink sm:text-[2.7rem]"
        >
          Six simple things
        </h2>
        <p className="mt-3 text-[1.02rem] leading-relaxed text-muted">
          Tap a card to read more. These are placeholder entries for layout review, not
          the product formulation.
        </p>
      </header>

      <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {INGREDIENTS.map((ing) => {
          const open = ing.key === openKey;
          return (
            <li key={ing.key}>
              <button
                type="button"
                onClick={() => setOpenKey(open ? null : ing.key)}
                aria-expanded={open}
                aria-controls={`ing-panel-${ing.key}`}
                className={
                  "flex h-full w-full cursor-pointer flex-col items-start rounded-[22px] border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] sm:p-5 " +
                  (open
                    ? "border-[var(--accent)] bg-accent-soft shadow-[var(--shadow-soft)]"
                    : "border-line bg-surface hover:border-[var(--accent)] hover:shadow-[var(--shadow-soft)]")
                }
              >
                <span
                  aria-hidden="true"
                  className={
                    "flex h-9 w-9 items-center justify-center rounded-full transition-colors " +
                    (open ? "bg-[var(--accent)] text-[var(--accent-ink)]" : "bg-surface-sunk text-[var(--accent)]")
                  }
                >
                  {open ? <Leaf className="h-4.5 w-4.5" /> : <Plus className="h-4.5 w-4.5" />}
                </span>
                <span className="mt-3 text-[1.02rem] leading-snug font-bold text-ink">
                  {ing.name}
                </span>
                <span className="mt-0.5 text-sm text-muted">{ing.short}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {INGREDIENTS.map((ing) => (
        <div
          key={ing.key}
          id={`ing-panel-${ing.key}`}
          role="region"
          aria-label={`${ing.name} detail`}
          hidden={ing.key !== openKey}
          className="mt-4 rounded-[var(--radius-card)] border border-line bg-surface p-5 sm:p-7"
        >
          <h3 className="font-display text-[1.6rem] leading-tight text-ink">{ing.name}</h3>
          <p className="mt-2 max-w-2xl leading-relaxed text-ink-soft">{ing.detail}</p>
          <p className="mt-3 text-xs font-semibold tracking-[0.12em] text-muted uppercase">
            Placeholder entry
          </p>
        </div>
      ))}
    </section>
  );
}
