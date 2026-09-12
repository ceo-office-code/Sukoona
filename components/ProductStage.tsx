"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PACKS } from "@/lib/content";
import PieceRow from "./PieceRow";

export default function ProductStage() {
  const [pack, setPack] = useState<number>(10);
  const packInfo = PACKS.find((p) => p.size === pack) ?? PACKS[1];
  return (
    <section id="concept" aria-labelledby="concept-heading" className="product-detail stage-scope">
      <div className="product-photo">
        <Image src="/product/forest.png" alt="Sukoona Gummy Vati with a forest green botanical label and gold lid" width={1254} height={1254} sizes="(max-width: 800px) 90vw, 520px" />
        <span className="photo-caption">THE SUKOONA JAR</span>
      </div>
      <div className="product-copy">
        <p className="eyebrow">A SMALL RITUAL</p>
        <h2 id="concept-heading">Your moment.<br /><em>Your Sukoona.</em></h2>
        <p className="product-lead">Gummy Vati, in our signature forest jar. A gold crescent, delicate botanicals, and a little space for you.</p>
        <div className="product-facts"><span>Forest botanical label</span><span>Gold screw lid</span><span>10-gummy jar pictured</span></div>
        <fieldset className="pack-fieldset">
          <legend>Explore pack sizes</legend>
          <div className="pack-options">
            {PACKS.map((p) => (
              <label key={p.size} className={pack === p.size ? "pack-option selected" : "pack-option"}>
                <input type="radio" name="pack-size" value={p.size} checked={pack === p.size} onChange={() => setPack(p.size)} />
                <span>{p.size} <small>pieces</small></span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="pack-summary">
          <PieceRow pack={pack} />
          <p aria-live="polite"><strong>{packInfo.label}</strong> · {packInfo.blurb}</p>
        </div>
        <Link className="button button-primary" href={`/contact?via=product&pack=${pack}`}>Enquire about this jar <span aria-hidden="true">↗</span></Link>
        <p className="product-note">Pack preview only. The pictured label reads 10 gummies. Product details are being finalised; this preview has no checkout.</p>
      </div>
    </section>
  );
}
