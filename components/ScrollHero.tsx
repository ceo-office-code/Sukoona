"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";

const clamp = (value: number) => Math.min(1, Math.max(0, value));
export default function ScrollHero() {
  const story = useRef<HTMLElement>(null);
  useEffect(() => {
    const section = story.current;
    if (!section) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      frame = 0;
      const box = section.getBoundingClientRect();
      const stickyTop = window.innerWidth <= 700 ? 70 : 78;
      const travel = section.offsetHeight - window.innerHeight + stickyTop;
      const progress = motion.matches ? 1 : clamp((stickyTop - box.top) / Math.max(1, travel));
      const opening = clamp((progress - .08) / .7);
      section.style.setProperty("--open", String(opening));
      section.style.setProperty("--lid-drop", `${(1 - opening) * 38.4}%`);
      section.style.setProperty("--lid-turn", `${opening * -7}deg`);
      section.style.setProperty("--gummy-drop", `${(1 - opening) * 22}%`);
      section.style.setProperty("--energy-scale", String(.83 + opening * .17));
      section.style.setProperty("--progress", `${progress * 100}%`);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    observer.observe(section);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    motion.addEventListener("change", schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      motion.removeEventListener("change", schedule);
    };
  }, []);
  return (
    <section ref={story} className="scroll-story" aria-labelledby="hero-heading">
      <div className="scroll-scene">
        <Image className="energy-background" src="/product/scroll-energy.png" fill sizes="100vw" alt="" priority aria-hidden="true" />
        <div className="scene-shade" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow">SUKOONA / A MOMENT FOR YOU</p>
          <h1 id="hero-heading">A little pause.<br /><em>A world within.</em></h1>
          <p className="hero-description">Make a little room for yourself.<br />Meet Sukoona Gummy Vati.</p>
          <a className="button-primary" href="#concept">Discover the jar <span aria-hidden="true">↗</span></a>
        </div>
        <div className="product-animation" role="img" aria-label="Sukoona forest jar: the gold lid lifts and amber gummies rise as you scroll">
          <div className="sprite-layer jar-body"><Image src="/product/scroll-sprite.png" fill sizes="(max-width: 700px) 100vw, 55vw" alt="" priority /></div>
          <div className="sprite-layer jar-gummies"><Image src="/product/scroll-sprite.png" fill sizes="(max-width: 700px) 100vw, 55vw" alt="" priority /></div>
          <div className="sprite-layer jar-lid"><Image src="/product/scroll-sprite.png" fill sizes="(max-width: 700px) 100vw, 55vw" alt="" priority /></div>
        </div>
        <div className="scroll-caption"><span>01 / THE UNVEILING</span><a href="#concept">Scroll to discover <span aria-hidden="true">↓</span></a><span>GUMMY VATI · 10 GUMMIES</span></div>
        <div className="story-progress" aria-hidden="true"><span /></div>
      </div>
    </section>
  );
}
