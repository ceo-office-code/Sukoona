"use client";

import { useState } from "react";
import { FAQS } from "@/lib/content";

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-6">
      <header className="max-w-xl">
        <p className="text-xs font-bold tracking-[0.16em] text-[var(--accent)] uppercase">
          Questions
        </p>
        <h2
          id="faq-heading"
          className="mt-3 font-display text-[2.1rem] leading-[1.08] text-ink sm:text-[2.7rem]"
        >
          Good to know
        </h2>
      </header>

      <ul className="mt-8 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
        {FAQS.map((item, i) => {
          const isOpen = i === open;
          return (
            <li key={item.q} className={i > 0 ? "border-t border-line" : undefined}>
              <h3>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-5 text-left transition-colors hover:bg-accent-soft sm:px-7"
                >
                  <span className="text-[1.02rem] leading-snug font-bold text-ink">
                    {item.q}
                  </span>
                  <span
                    aria-hidden="true"
                    className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-[var(--accent)]"
                  >
                    <span className="absolute h-[1.75px] w-3 rounded bg-current" />
                    <span
                      className={
                        "absolute h-3 w-[1.75px] rounded bg-current transition-transform duration-300 " +
                        (isOpen ? "scale-y-0" : "scale-y-100")
                      }
                    />
                  </span>
                </button>
              </h3>
              <div
                id={`faq-panel-${i}`}
                role="region"
                hidden={!isOpen}
                className="px-5 pb-6 sm:px-7"
              >
                <p className="max-w-2xl leading-relaxed text-ink-soft">{item.a}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
