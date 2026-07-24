"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ArrowDown } from "lucide-react";

const BOOT_LINES = [
  "> NEXELITE BROADCAST SYSTEM v2.0",
  "> LOADING PHOSPHOR DRIVERS… OK",
  "> SYNCING COLOR BARS… OK",
  "> LOCKING FREQUENCY 88.1 MHZ… OK",
  "> SIGNAL ACQUIRED",
];

function scramble(el: HTMLElement, final: string, dur: number) {
  const glyphs = "█▓▒░<>/\\|NEXELITE#*";
  const start = performance.now();
  function step(now: number) {
    if (now - start > dur) {
      el.textContent = final;
      return;
    }
    el.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

export function Hero() {
  const [booted, setBooted] = useState(false);
  const markRef = useRef<HTMLHeadingElement>(null);
  const tagRef = useRef<HTMLParagraphElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduced) {
      setBooted(true);
      return;
    }

    const t = setTimeout(() => setBooted(true), 2600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!booted) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduced || !markRef.current || !tagRef.current) return;

    const mark = markRef.current;
    mark.querySelectorAll("span.word").forEach((sp) => {
      sp.innerHTML = [...(sp.textContent || "")]
        .map((c) => `<span class="ch inline-block">${c}</span>`)
        .join("");
    });
    const chars = [...mark.querySelectorAll<HTMLElement>(".ch")];

    const tag = tagRef.current;
    tag.innerHTML = (tag.textContent || "")
      .split(/(\s+)/)
      .map((w) => (/\S/.test(w) ? `<span class="w inline-block">${w}</span>` : w))
      .join("");
    const words = [...tag.querySelectorAll<HTMLElement>(".w")];

    const barSpans = barsRef.current
      ? [...barsRef.current.querySelectorAll<HTMLElement>("span")]
      : [];

    gsap.set(chars, { opacity: 0, yPercent: 110, rotateX: -80 });
    gsap.set(words, { opacity: 0, y: 14 });
    gsap.set(barSpans, { scaleY: 0 });
    gsap.set("#hero-eyebrow, #hero-hint", { opacity: 0, y: -8 });

    const tl = gsap.timeline();
    tl.fromTo(
      frameRef.current,
      { scaleY: 0.004, scaleX: 1.15, filter: "brightness(4)" },
      { scaleY: 1, scaleX: 1, filter: "brightness(1)", duration: 0.7, ease: "expo.out" }
    )
      .to("#hero-eyebrow", { opacity: 1, y: 0, duration: 0.4 }, "-=0.3")
      .to(
        chars,
        {
          opacity: 1,
          yPercent: 0,
          rotateX: 0,
          duration: 0.9,
          stagger: { each: 0.05, from: "random" },
          ease: "back.out(1.6)",
          onStart() {
            chars.forEach((c) => scramble(c, c.textContent || "", 600));
          },
        },
        "-=0.2"
      )
      .to(words, { opacity: 1, y: 0, duration: 0.5, stagger: 0.02, ease: "power2.out" }, "-=0.4")
      .to(barSpans, { scaleY: 1, duration: 0.6, stagger: 0.05, ease: "elastic.out(1,0.5)" }, "-=0.4")
      .to("#hero-hint", { opacity: 0.6, y: 0, duration: 0.5 }, "-=0.2");

    barSpans.forEach((b, i) => {
      gsap.to(b, {
        scaleY: "random(0.25,1)",
        duration: "random(0.4,0.9)",
        repeat: -1,
        yoyo: true,
        repeatRefresh: true,
        ease: "sine.inOut",
        delay: 2 + i * 0.1,
      });
    });

    gsap.to(mark, { y: -8, duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 2.5 });

    function onMove(e: PointerEvent) {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      gsap.to(mark, { rotateY: x * 14, rotateX: -y * 10, x: x * 30, duration: 0.6, ease: "power2.out" });
    }
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [booted]);

  return (
    <section className="relative min-h-screen flex flex-col" style={{ zIndex: 2 }}>
      {!booted && (
        <div
          className="fixed inset-0 flex flex-col items-start justify-center gap-3 px-[8vw] text-xs tracking-[0.18em] uppercase"
          style={{ background: "var(--ink)", color: "var(--dim)", zIndex: 50 }}
        >
          {BOOT_LINES.map((line, i) => (
            <BootLine key={line} text={line} delay={i * 0.45} />
          ))}
        </div>
      )}

      <header className="fixed top-0 inset-x-0 px-3 sm:px-6 py-3 sm:py-4" style={{ zIndex: 10 }}>
        <div
          className="max-w-6xl mx-auto flex items-center justify-between rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5"
          style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(14px)", border: "1px solid var(--line)" }}
        >
          <span className="text-xs tracking-[0.2em] uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full blink-dot" style={{ background: "var(--magenta)" }} />
            REC
          </span>
          <span className="text-[11px] tracking-[0.14em] uppercase hidden sm:inline" style={{ color: "var(--dim)" }}>
            CH·01 — NEXELITE MEDIA
          </span>
          <a
            href="mailto:nexelitemedia@gmail.com"
            className="text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 rounded-lg transition-transform hover:-translate-y-px"
            style={{ background: "var(--phosphor)", color: "var(--ink)" }}
          >
            Get in touch
          </a>
        </div>
      </header>

      <div ref={frameRef} className="flex-1 flex flex-col justify-center items-center text-center gap-8 sm:gap-11 px-5 sm:px-6 pt-24">
        <p id="hero-eyebrow" className="text-[11px] tracking-[0.4em] uppercase" style={{ color: "var(--dim)" }}>
          TEST TRANSMISSION — <b className="font-normal" style={{ color: "var(--cyan)" }}>BROADCAST LIVE</b>
        </p>

        <h1
          ref={markRef}
          className="font-disp font-extrabold leading-none"
          style={{ fontSize: "clamp(52px, 12vw, 170px)", letterSpacing: "-0.03em" }}
        >
          <span className="word">NEX</span>
          <span className="word font-light italic">ELITE</span>
        </h1>

        <p ref={tagRef} className="max-w-[52ch] text-sm sm:text-base leading-[1.8]" style={{ color: "var(--dim)" }}>
          A creative media agency tuning its own frequency. Influence. Create. Elevate.
        </p>

        <div ref={barsRef} className="flex w-[min(560px,80vw)] h-6 border" style={{ borderColor: "var(--line)" }}>
          {["#2F5D7C", "#7EC8E3", "#B6C7D6", "#EAF6FF", "#7EC8E3", "#2F5D7C", "#B6C7D6"].map((c, i) => (
            <span key={i} className="flex-1 origin-bottom border-r last:border-r-0" style={{ background: c, borderColor: "var(--line)" }} />
          ))}
        </div>

        <a
          href="#work"
          id="hero-hint"
          className="flex flex-col items-center gap-2 text-[10px] tracking-[0.3em] uppercase transition-colors hover:text-white"
          style={{ color: "var(--dim)" }}
        >
          See the work
          <ArrowDown className="w-4 h-4" />
        </a>
      </div>
    </section>
  );
}

function BootLine({ text, delay }: { text: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    gsap.set(ref.current, { opacity: 0 });
    gsap.to(ref.current, { opacity: 1, duration: 0.05, delay });
  }, [delay]);
  return <div ref={ref}>{text}</div>;
}
