"use client";

import { useState } from "react";
import Image from "next/image";
import { EDITIONS, PACKS, type EditionKey, type StyleKey } from "@/lib/content";
import PieceRow from "./PieceRow";
import StyleBar from "./StyleBar";
import { Check } from "./Icons";

type Props = {
  styleKey: StyleKey;
  onStyleChange: (next: StyleKey) => void;
};

export default function ProductStage({ styleKey, onStyleChange }: Props) {
  const [editionKey, setEditionKey] = useState<EditionKey>("forest");
  const [pack, setPack] = useState<number>(10);

  const edition = EDITIONS.find((e) => e.key === editionKey) ?? EDITIONS[0];
  const packInfo = PACKS.find((p) => p.size === pack) ?? PACKS[0];

  return (
    <section
      id="concept"
      aria-labelledby="concept-heading"
      className="stage-scope themed scroll-mt-6 rounded-[var(--radius-card)] bg-[var(--stage)] p-5 sm:p-8 lg:p-10"
    >
      <header className="max-w-xl">
        <p className="text-xs font-bold tracking-[0.16em] text-[var(--stage-accent)] uppercase">
          Concept product
        </p>
        <h2
          id="concept-heading"
          className="mt-3 font-display text-[2.1rem] leading-[1.08] text-[var(--stage-ink)] sm:text-[2.7rem]"
        >
          Sukoona Gummy
        </h2>
        <p className="mt-3 text-[1.02rem] leading-relaxed text-[var(--stage-muted)]">
          Pick a label and a pack size. The jar and the count update as you choose.
        </p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
        <div className="flex flex-col gap-5">
          <div className="themed overflow-hidden rounded-[var(--radius-card)] border border-[var(--stage-line)] bg-[var(--stage-chip)]">
            <div className="relative aspect-square">
              {EDITIONS.map((e) => (
                <Image
                  key={e.key}
                  src={e.image}
                  alt={`Sukoona Gummy Vati jar with a ${e.note.toLowerCase()} label and a gold lid`}
                  fill
                  sizes="(max-width: 1024px) 92vw, 520px"
                  priority={e.key === "forest"}
                  className="object-cover transition-opacity duration-500"
                  style={{ opacity: e.key === editionKey ? 1 : 0 }}
                />
              ))}
            </div>
          </div>

          <div className="themed rounded-[var(--radius-card)] border border-[var(--stage-line)] bg-[var(--stage-chip)] px-5 py-5">
            <p className="text-xs font-bold tracking-[0.14em] text-[var(--stage-muted)] uppercase">
              In the jar
            </p>
            <div className="mt-3">
              <PieceRow pack={pack} styleKey={styleKey} />
            </div>
            <p aria-live="polite" className="mt-3 text-sm text-[var(--stage-muted)]">
              <span className="font-semibold text-[var(--stage-ink)]">
                {edition.name} · {packInfo.label}
              </span>
              {" — "}
              {packInfo.blurb}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div
            role="group"
            aria-labelledby="edition-heading"
            className="themed rounded-[var(--radius-card)] border border-[var(--stage-line)] bg-[var(--stage-chip)] p-5 sm:p-7"
          >
            <h3
              id="edition-heading"
              className="font-display text-[1.55rem] leading-tight text-[var(--stage-ink)] sm:text-[1.8rem]"
            >
              Label
            </h3>
            <p className="mt-1.5 text-sm text-[var(--stage-muted)]">
              Three colourways of the same jar.
            </p>

            <div role="radiogroup" aria-label="Label colourway" className="mt-4 grid gap-2.5">
              {EDITIONS.map((e) => {
                const selected = e.key === editionKey;
                return (
                  <button
                    key={e.key}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setEditionKey(e.key)}
                    className={
                      "flex cursor-pointer items-center gap-3.5 rounded-2xl border p-3.5 text-left transition-all duration-200 active:scale-[0.98] " +
                      (selected
                        ? "border-[var(--stage-accent)] bg-[var(--stage-accent-soft)]"
                        : "border-[var(--stage-line)] hover:border-[var(--stage-accent)]")
                    }
                  >
                    <span
                      aria-hidden="true"
                      className="h-9 w-9 shrink-0 rounded-full border border-black/10"
                      style={{ background: e.swatch }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[1.02rem] font-bold text-[var(--stage-ink)]">
                        {e.name}
                      </span>
                      <span className="block text-sm text-[var(--stage-muted)]">{e.note}</span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors " +
                        (selected
                          ? "border-[var(--stage-accent)] bg-[var(--stage-accent)] text-[var(--stage-accent-ink)]"
                          : "border-[var(--stage-line)]")
                      }
                    >
                      {selected ? <Check className="h-3 w-3" /> : null}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-sm leading-relaxed text-[var(--stage-muted)]">
              {edition.description}
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {edition.motifs.map((m) => (
                <li
                  key={m}
                  className="rounded-full border border-[var(--stage-line)] px-3 py-1 text-xs font-semibold text-[var(--stage-ink)]"
                >
                  {m}
                </li>
              ))}
            </ul>
          </div>

          <div
            role="group"
            aria-labelledby="pack-heading"
            className="themed rounded-[var(--radius-card)] border border-[var(--stage-line)] bg-[var(--stage-chip)] p-5 sm:p-7"
          >
            <h3
              id="pack-heading"
              className="font-display text-[1.55rem] leading-tight text-[var(--stage-ink)] sm:text-[1.8rem]"
            >
              Pack size
            </h3>
            <div role="radiogroup" aria-label="Pack size" className="mt-4 grid grid-cols-2 gap-2.5">
              {PACKS.map((p) => {
                const selected = p.size === pack;
                return (
                  <button
                    key={p.size}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setPack(p.size)}
                    className={
                      "cursor-pointer rounded-2xl border px-4 py-4 text-center transition-all duration-200 active:scale-[0.98] " +
                      (selected
                        ? "border-transparent bg-[var(--stage-accent)] text-[var(--stage-accent-ink)] shadow-[var(--shadow-soft)]"
                        : "border-[var(--stage-line)] text-[var(--stage-ink)] hover:border-[var(--stage-accent)] hover:bg-[var(--stage-accent-soft)]")
                    }
                  >
                    <span className="block font-display text-[1.9rem] leading-none tabular-nums">
                      {p.size}
                    </span>
                    <span className="mt-1.5 block text-xs font-semibold tracking-wider uppercase opacity-80">
                      pieces
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-sm text-[var(--stage-muted)]">
              {packInfo.blurb} The jar shown carries the 10 piece label.
            </p>
          </div>

          <StyleBar value={styleKey} onChange={onStyleChange} />
        </div>
      </div>

      <p className="mt-7 max-w-2xl text-sm leading-relaxed text-[var(--stage-muted)]">
        Packaging concepts for design review. No formulation, strength, dosage or health
        claim is shown, and nothing here is for sale.
      </p>
    </section>
  );
}
