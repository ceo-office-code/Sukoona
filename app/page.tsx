"use client";

import { useState } from "react";
import Image from "next/image";
import ProductStage from "@/components/ProductStage";
import Ingredients from "@/components/Ingredients";
import Faq from "@/components/Faq";
import { ArrowDown } from "@/components/Icons";
import type { StyleKey } from "@/lib/content";

export default function Home() {
  const [styleKey, setStyleKey] = useState<StyleKey>("balanced");

  return (
    <div data-style={styleKey} className="themed min-h-dvh bg-ground">
      <a
        href="#concept"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-[var(--accent)] focus:px-5 focus:py-2.5 focus:text-sm focus:font-bold focus:text-[var(--accent-ink)]"
      >
        Skip to the product concept
      </a>

      <div className="border-b border-line bg-surface-sunk">
        <p className="mx-auto max-w-[1180px] px-5 py-2.5 text-center text-xs leading-relaxed font-semibold tracking-wide text-ink-soft sm:px-8">
          Concept prototype · Packaging designs for review · Nothing for sale
        </p>
      </div>

      <header className="mx-auto max-w-[1180px] px-5 pt-6 sm:px-8">
        <p className="font-display text-[1.65rem] leading-none text-ink">sukoona</p>
      </header>

      <main className="mx-auto flex max-w-[1180px] flex-col gap-20 px-5 pt-10 pb-20 sm:gap-28 sm:px-8 sm:pt-14 sm:pb-28">
        {/* 1 — Introduction */}
        <section>
          <div className="max-w-2xl lg:max-w-lg">
            <p className="text-xs font-bold tracking-[0.16em] text-[var(--accent)] uppercase">
              A calm idea
            </p>
            <h1 className="mt-4 font-display text-[2.9rem] leading-[1.02] text-balance text-ink sm:text-[4rem] lg:text-[4.3rem]">
              A quiet moment, made simple.
            </h1>
            <p className="mt-6 max-w-xl text-[1.12rem] leading-relaxed text-ink-soft sm:text-[1.2rem]">
              Sukoona is a wellness brand concept. Three labels, one jar, and a
              page you can try for yourself.
            </p>
            <a
              href="#concept"
              className="mt-8 inline-flex cursor-pointer items-center gap-2.5 rounded-full bg-[var(--accent)] px-7 py-4 text-[1.02rem] font-bold text-[var(--accent-ink)] shadow-[var(--shadow-soft)] transition-all duration-200 hover:shadow-[var(--shadow-lift)] active:scale-[0.97]"
            >
              Explore
              <ArrowDown className="h-4.5 w-4.5" />
            </a>
          </div>

          <div className="mt-10 overflow-hidden rounded-[var(--radius-card)] border border-line lg:mt-12">
            <Image
              src="/product/collection-hero.png"
              alt="Three Sukoona Gummy Vati jars in forest green, coral and midnight blue on pale stone plinths"
              width={1672}
              height={941}
              priority
              sizes="(max-width: 1180px) 100vw, 1116px"
              className="h-auto w-full"
            />
          </div>
        </section>

        {/* 2 — Interactive product concept */}
        <ProductStage styleKey={styleKey} onStyleChange={setStyleKey} />

        {/* 3 — Ingredients */}
        <Ingredients />

        {/* 4 — FAQ */}
        <Faq />
      </main>

      {/* 5 — Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-6 px-5 py-12 sm:flex-row sm:items-end sm:justify-between sm:px-8">
          <div>
            <p className="font-display text-[1.65rem] leading-none text-ink">sukoona</p>
            <p className="mt-2 text-sm text-muted">sukoona.com</p>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            A concept prototype built for design review. Packaging designs only. No
            formulation, strength or health claim is shown, and nothing is for sale.
          </p>
        </div>
      </footer>
    </div>
  );
}
