"use client";

/* ──────────────────────────────────────────────────────────────────────────
   NexElite Media, landing page

   Signature visual: SignalCorridor, a Three.js scroll journey where the
   camera flies along a spline through a field of static that resolves into
   structure. Nothing morphs into a logo. The transformation is noise into
   signal, which is what the headline promises.

   Progress: JourneyHUD, fused with the corridor. It reads the same live
   state the renderer writes, so the rail, the caption, and the ring in 3D
   all move on one clock.

   Journey animations: per stage GSAP choreography (split, grid, cards,
   center).

   The corridor reads document scroll itself, in frame. It is not driven
   from here. Pushing progress in from the ScrollTrigger below meant a bad
   end measurement would silently park the camera at zero while the scene
   still rendered.
   ────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { ArrowUpRight } from "lucide-react";
import { PhoneProof } from "@/components/PhoneProof";
import { StatsProof } from "@/components/StatsProof";
import { StickyCTA } from "@/components/StickyCTA";
import { ChannelGrid } from "@/components/ChannelGrid";
import { JourneyHUD } from "@/components/JourneyHUD";
import { ServicePanel } from "@/components/ServicePanel";
import { SignalRings } from "@/components/SignalRings";
import { SignalCorridor } from "@/components/SignalCorridor";
import { SERVICES, type Service } from "@/lib/services";

gsap.registerPlugin(ScrollTrigger);

function Stage({
  align = "left",
  kicker,
  title,
  children,
  innerRef,
  motion = "rise",
}: {
  align?: "left" | "right" | "center";
  kicker?: string;
  title: React.ReactNode;
  children?: React.ReactNode;
  innerRef?: React.Ref<HTMLDivElement>;
  motion?: string;
}) {
  const alignCls =
    align === "center"
      ? "items-center text-center"
      : align === "right"
        ? "items-start text-left sm:items-end sm:text-right sm:ml-auto"
        : "items-start text-left";
  return (
    <section
      className="relative min-h-[100svh] flex items-center px-5 sm:px-6 py-24 sm:py-20"
      style={{ zIndex: 2 }}
    >
      <div
        ref={innerRef}
        data-motion={motion}
        className={`stage-copy max-w-6xl mx-auto w-full flex flex-col ${alignCls}`}
      >
        <div className="max-w-md w-full">
          {kicker && (
            <p
              className="font-tech text-xs font-bold uppercase tracking-[0.22em] mb-4"
              style={{ color: "#2F5D7C" }}
            >
              {kicker}
            </p>
          )}
          <h2
            className="font-disp font-extrabold mb-5"
            style={{
              fontSize: "clamp(28px, 8vw, 52px)",
              letterSpacing: "-0.025em",
              lineHeight: 1.08,
              color: "#2F5D7C",
            }}
          >
            {title}
          </h2>
          {children}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const mainRef = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState<boolean | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [ringIndex, setRingIndex] = useState(-1);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (reduced !== false) return;
    const lenis = new Lenis({ lerp: 0.1 });
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    const id = requestAnimationFrame(raf);
    lenis.on("scroll", ScrollTrigger.update);

    ScrollTrigger.config({ ignoreMobileResize: true });

    const st = ScrollTrigger.create({
      start: 0,
      end: () => document.documentElement.scrollHeight - window.innerHeight,
      scrub: true,
      onUpdate: (self) => {
        setRingIndex(
          Math.min(SERVICES.length - 1, Math.floor(self.progress * SERVICES.length))
        );
      },
    });
    ScrollTrigger.refresh();

    const copies = gsap.utils.toArray<HTMLElement>(".stage-copy");
    const copyTriggers = copies.map((el) => {
      const motionType = el.dataset.motion || "rise";
      const commonTrigger = {
        trigger: el,
        start: "top 80%",
        end: "top 42%",
        scrub: true,
      };

      if (motionType === "cards") {
        const cards = el.querySelectorAll<HTMLElement>(".motion-card");
        return gsap.fromTo(
          cards,
          { opacity: 0, y: 34, scale: 0.92 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            stagger: 0.08,
            ease: "back.out(1.4)",
            scrollTrigger: commonTrigger,
          }
        );
      }

      if (motionType === "split") {
        const left = el.querySelector<HTMLElement>(".motion-left");
        const right = el.querySelector<HTMLElement>(".motion-right");
        const tl = gsap.timeline({ scrollTrigger: commonTrigger });
        if (left) tl.fromTo(left, { opacity: 0, x: -46 }, { opacity: 1, x: 0, ease: "power3.out" }, 0);
        if (right) tl.fromTo(right, { opacity: 0, x: 46, scale: 0.92 }, { opacity: 1, x: 0, scale: 1, ease: "power3.out" }, 0.05);
        return tl;
      }

      if (motionType === "grid") {
        const tiles = el.querySelectorAll<HTMLElement>(".motion-tile");
        return gsap.fromTo(
          tiles,
          { opacity: 0, y: 26 },
          {
            opacity: 1,
            y: 0,
            stagger: { each: 0.05, from: "start", grid: "auto" },
            ease: "power2.out",
            scrollTrigger: commonTrigger,
          }
        );
      }

      if (motionType === "center") {
        return gsap.fromTo(
          el,
          { opacity: 0, y: 30, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, ease: "power2.out", scrollTrigger: commonTrigger }
        );
      }

      return gsap.fromTo(
        el,
        { opacity: 0, y: 42 },
        { opacity: 1, y: 0, ease: "power2.out", scrollTrigger: commonTrigger }
      );
    });

    return () => {
      cancelAnimationFrame(id);
      lenis.destroy();
      st.kill();
      copyTriggers.forEach((t) => {
        t.scrollTrigger?.kill();
        t.kill();
      });
    };
  }, [reduced]);

  if (reduced === null) {
    return <div className="min-h-[100svh]" style={{ background: "#ffffff" }} />;
  }

  return (
    <div
      ref={mainRef}
      className="relative"
      style={{ background: "#ffffff", color: "#2F5D7C", paddingBottom: "112px" }}
    >
      <SignalCorridor />
      <JourneyHUD />
      <StickyCTA />
      <ServicePanel service={selectedService} onClose={() => setSelectedService(null)} />

      <header className="fixed top-0 inset-x-0 px-3 sm:px-6 py-3 sm:py-4" style={{ zIndex: 10 }}>
        <div
          className="max-w-6xl mx-auto flex items-center justify-between rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3"
          style={{
            background: "rgba(9,18,28,0.68)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(126,200,227,0.3)",
            boxShadow: "0 8px 32px -12px rgba(47,93,124,0.35)",
          }}
        >
          <span className="font-tech text-sm font-bold tracking-tight whitespace-nowrap" style={{ color: "#EAF6FF" }}>
            NEX<span style={{ color: "#7EC8E3" }}>ELITE</span>
          </span>
          <a
            href="mailto:nexelitemedia@gmail.com"
            className="text-xs sm:text-sm font-bold px-4 py-2 sm:py-1.5 rounded-lg transition-all duration-200 hover:-translate-y-px whitespace-nowrap"
            style={{ background: "#7EC8E3", color: "#09121c", boxShadow: "0 0 20px -4px #7EC8E3" }}
          >
            Get in touch
          </a>
        </div>
      </header>

      <section className="relative min-h-[100svh] flex items-center px-5 sm:px-6 pt-28 sm:pt-32" style={{ zIndex: 2 }}>
        <div data-motion="split" className="stage-copy max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="max-w-xl motion-left">
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium mb-7 sm:mb-9"
              style={{
                background: "rgba(255,255,255,0.7)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(126,200,227,0.5)",
                color: "#2F5D7C",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#7EC8E3" }} />
              <span className="font-tech tracking-wider whitespace-nowrap">Test transmission</span>
            </div>
            <h1
              className="font-disp font-extrabold leading-[0.95] mb-6 sm:mb-7"
              style={{ fontSize: "clamp(40px, 9vw, 86px)", letterSpacing: "-0.035em", color: "#2F5D7C" }}
            >
              Every channel
              <br />
              starts as{" "}
              <span
                style={{
                  background: "linear-gradient(100deg, #2F5D7C 5%, #7EC8E3 60%, #D9B98A 95%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                noise.
              </span>
            </h1>
            <p className="text-lg sm:text-xl mb-9 sm:mb-11 leading-relaxed" style={{ color: "#4d6577", maxWidth: "480px" }}>
              We tune it into signal. Reels, campaigns, and brand content that
              people actually stop to watch.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <a
                href="#work"
                className="flex items-center justify-center gap-1.5 text-sm font-bold px-7 py-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap"
                style={{ background: "#2F5D7C", color: "#ffffff", boxShadow: "0 12px 28px -10px rgba(47,93,124,0.7)" }}
              >
                See the work <ArrowUpRight className="w-4 h-4 flex-shrink-0" />
              </a>
              <a
                href="mailto:nexelitemedia@gmail.com"
                className="text-sm font-semibold text-center px-7 py-3.5 rounded-xl transition-all duration-150 whitespace-nowrap"
                style={{
                  color: "#2F5D7C",
                  background: "rgba(255,255,255,0.6)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(47,93,124,0.22)",
                }}
              >
                Start a project
              </a>
            </div>
          </div>
          <div className="hidden lg:flex items-center justify-center motion-right">
            <SignalRings activeIndex={reduced ? -1 : ringIndex} />
          </div>
        </div>
        <div
          className="absolute bottom-24 left-1/2 -translate-x-1/2 hidden min-[400px]:flex flex-col items-center gap-2"
          style={{ color: "rgba(47,93,124,0.45)" }}
        >
          <span className="font-tech text-[10px] uppercase tracking-[0.25em] font-bold whitespace-nowrap">Scroll to tune</span>
          <div className="w-px h-9 animate-pulse" style={{ background: "linear-gradient(180deg, rgba(47,93,124,0.45), transparent)" }} />
        </div>
      </section>

      <section id="work" className="relative min-h-[100svh] flex flex-col items-center justify-center px-5 sm:px-6 py-24 sm:py-20" style={{ zIndex: 2 }}>
        <div data-motion="center" className="stage-copy max-w-6xl mx-auto w-full text-center mb-12 sm:mb-16">
          <p className="font-tech text-xs font-bold uppercase tracking-[0.22em] mb-4" style={{ color: "#2F5D7C" }}>
            Signal acquired
          </p>
          <h2
            className="font-disp font-extrabold mb-5"
            style={{ fontSize: "clamp(30px, 7vw, 58px)", letterSpacing: "-0.03em", lineHeight: 1.05, color: "#2F5D7C" }}
          >
            Eight channels.
            <br />
            One frequency.
          </h2>
          <p className="text-base sm:text-lg max-w-md mx-auto" style={{ color: "#4d6577" }}>
            Tap a channel, or use the bar at the bottom, to see what it delivers.
          </p>
        </div>
        <div data-motion="grid" className="stage-copy w-full">
          <ChannelGrid onSelect={setSelectedService} />
        </div>
      </section>

      <section className="relative min-h-[100svh] flex items-center px-5 sm:px-6 py-24 sm:py-20" style={{ zIndex: 2 }}>
        <div data-motion="split" className="stage-copy max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-10 items-center">
          <div className="max-w-md order-2 lg:order-1 motion-left">
            <p className="font-tech text-xs font-bold uppercase tracking-[0.22em] mb-4" style={{ color: "#2F5D7C" }}>
              In focus
            </p>
            <h2
              className="font-disp font-extrabold mb-5"
              style={{ fontSize: "clamp(30px, 7vw, 54px)", letterSpacing: "-0.03em", lineHeight: 1.05, color: "#2F5D7C" }}
            >
              Shot with intent.
              <br />
              Edited with taste.
            </h2>
            <p className="text-base sm:text-lg leading-relaxed mb-7" style={{ color: "#4d6577" }}>
              Not a stock template dressed up as a brand. Every frame is composed for what your audience actually stops scrolling for.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Location scouted", "Lit properly", "Graded to brand"].map((chip) => (
                <span
                  key={chip}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
                  style={{
                    background: "rgba(255,255,255,0.65)",
                    backdropFilter: "blur(6px)",
                    border: "1px solid rgba(126,200,227,0.5)",
                    color: "#2F5D7C",
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
          <div className="order-1 lg:order-2 motion-right flex items-center justify-center">
            <PhoneProof />
          </div>
        </div>
      </section>

      <Stage motion="cards" align="left" kicker="On the record" title={<>Numbers,<br />not adjectives.</>}>
        <p className="text-base sm:text-lg leading-relaxed mb-3" style={{ color: "#4d6577" }}>
          We&apos;d rather show you than tell you.
        </p>
        <div className="motion-card">
          <StatsProof />
        </div>
      </Stage>

      <Stage motion="rise" align="right" kicker="Found the rhythm" title={<>Paced for attention.<br />Built to retain.</>}>
        <p className="text-base sm:text-lg leading-relaxed mb-7" style={{ color: "#4d6577" }}>
          Cuts land on the beat. Captions arrive on time. Nothing overstays its welcome.
        </p>
        <div
          className="inline-flex flex-col gap-1 px-6 py-5 rounded-2xl text-left"
          style={{
            background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(126,200,227,0.45)",
            boxShadow: "0 16px 40px -20px rgba(47,93,124,0.5)",
          }}
        >
          <p className="font-disp text-xl font-extrabold" style={{ color: "#2F5D7C" }}>Retention-first editing</p>
          <p className="text-sm" style={{ color: "#4d6577" }}>Every cut earns the next three seconds</p>
        </div>
      </Stage>

      <section
        className="relative min-h-[100svh] flex items-center justify-center px-5 sm:px-6 text-center"
        style={{ zIndex: 2 }}
      >
        <div data-motion="center" className="stage-copy max-w-xl mx-auto">
          <h2
            className="font-disp font-extrabold mb-5"
            style={{ fontSize: "clamp(34px, 8vw, 62px)", letterSpacing: "-0.03em", lineHeight: 1.05, color: "#2F5D7C" }}
          >
            Ready to go on air?
          </h2>
          <p className="mb-11 text-lg sm:text-xl" style={{ color: "#4d6577" }}>
            Tell us what you&apos;re building. We&apos;ll tell you how it looks in motion.
          </p>
          <a
            href="mailto:nexelitemedia@gmail.com"
            className="inline-flex items-center gap-2 font-bold px-10 py-4 rounded-xl text-sm sm:text-base transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap"
            style={{ background: "#2F5D7C", color: "#ffffff", boxShadow: "0 16px 36px -12px rgba(47,93,124,0.75)" }}
          >
            nexelitemedia@gmail.com <ArrowUpRight className="w-4 h-4 flex-shrink-0" />
          </a>
        </div>
      </section>

      <footer
        className="relative px-6 py-12"
        style={{
          zIndex: 2,
          background: "rgba(234,246,255,0.75)",
          borderTop: "1px solid rgba(47,93,124,0.12)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center md:justify-between gap-4">
          <span className="font-tech text-sm font-bold" style={{ color: "#2F5D7C" }}>
            NEX<span style={{ color: "#7EC8E3" }}>ELITE</span>
          </span>
          <p className="text-sm text-center" style={{ color: "#4d6577" }}>© 2026 NexElite Media</p>
        </div>
      </footer>
    </div>
  );
}
