"use client";

/* ──────────────────────────────────────────────────────────────────────────
   NexElite Media, landing page

   Signature visual: GlassField, a drifting field of coloured light behind
   every surface on the page, with the surfaces themselves rendered as
   glass. The transformation is still noise into signal, now told in the
   material rather than in a 3D scene: the field is diffuse, the panels
   that sit on it are sharp and structured.

   The Three.js corridor that used to live here is gone. It carried roughly
   700kb for one effect, and it fought the copy for the centre of the
   viewport at every stage. The glass reads on a mid range phone, which the
   corridor never really did.

   Progress: JourneyHUD, driven by document scroll.

   Journey animations: per stage GSAP choreography (split, grid, cards,
   center).
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
import { GlassField } from "@/components/GlassField";
import { ServicePanel } from "@/components/ServicePanel";
import { SignalRings } from "@/components/SignalRings";

import { SERVICES, type Service } from "@/lib/services";
import { CASE_STUDIES } from "@/lib/work";
import { WorkTeasers } from "@/components/WorkTeasers";
import { GrowthLedger } from "@/components/GrowthLedger";
import { BrandMarquee } from "@/components/BrandMarquee";
import { ClientImpact } from "@/components/ClientImpact";
import { CutCadence } from "@/components/CutCadence";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { onFrame } from "@/lib/frame";
import { registerScroller } from "@/lib/scroll";
import { EASE, RISE, STAGGER, REVEAL_TRIGGER } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

/** The method beat. Straight from the brief, no embellishment. */
const PROCESS = [
  { name: "Discover", note: "We learn the business before we touch a camera." },
  { name: "Strategy", note: "Pick the channels that suit you, drop the ones that do not." },
  { name: "Create", note: "Shoot, edit, grade, caption. Made for where it lands." },
  { name: "Launch", note: "Ship on schedule, watch the first 48 hours closely." },
  { name: "Scale", note: "Double down on what performed, cut what did not." },
];

function Stage({
  id,
  align = "left",
  kicker,
  title,
  children,
  aside,
  innerRef,
  motion = "rise",
  width = "prose",
}: {
  align?: "left" | "right" | "center";
  kicker?: string;
  title: React.ReactNode;
  children?: React.ReactNode;
  /**
   * Content for the columns the copy does not occupy.
   *
   * Putting copy in five of twelve columns left the other seven genuinely
   * empty, which reads as an unfinished layout rather than as restraint.
   * A stage either fills the counter columns with something worth looking
   * at or it should not be a two column stage at all.
   */
  aside?: React.ReactNode;
  innerRef?: React.Ref<HTMLDivElement>;
  motion?: string;
  id?: string;
  /**
   * Body measure. "prose" keeps text at a readable line length, which is
   * right for every stage that is a paragraph. "wide" releases that cap for
   * stages whose body is a multi column layout rather than prose.
   *
   * The process beat is five columns and was inheriting the prose cap, so
   * five cards were being squeezed into 448px and every line broke after a
   * single word.
   */
  width?: "prose" | "wide";
}) {
  /**
   * Copy sits on a shared twelve column grid rather than being pushed to
   * whichever edge of a flex row. Two reasons.
   *
   * The field behind the page is brightest through the middle of the
   * viewport, so copy flushed to the outer edge of the container sat in the
   * dimmest part of it. On the grid a left stage and a right stage are
   * exact mirrors, five columns each, and the middle two stay clear.
   *
   * Text stays left aligned in a right hand column. Right aligned body copy
   * gives a ragged left edge, which is measurably harder to read, and the
   * column position already carries the asymmetry.
   */
  const colCls =
    width === "wide"
      ? "col-span-12"
      : align === "center"
        ? "col-span-12 lg:col-span-8 lg:col-start-3 text-center"
        : align === "right"
          ? "col-span-12 md:col-span-6 md:col-start-7 lg:col-span-5 lg:col-start-8 text-left"
          : "col-span-12 md:col-span-6 lg:col-span-5 text-left";

  // The aside takes the mirror of the copy column, with a column of gutter
  // between them so the two never collide at the middle.
  const asideCls =
    align === "right"
      ? "col-span-12 lg:col-span-6 lg:col-start-1 lg:row-start-1 mt-10 lg:mt-0"
      : "col-span-12 lg:col-span-6 lg:col-start-7 mt-10 lg:mt-0";

  return (
    <section
      id={id}
      className="relative min-h-[100svh] flex items-center px-5 sm:px-6 py-24 sm:py-20"
      style={{ zIndex: 2 }}
    >
      <div
        ref={innerRef}
        data-motion={motion}
        data-side={width === "wide" ? "center" : align}
        className="stage-copy max-w-6xl mx-auto w-full grid grid-cols-12 gap-x-6 items-center"
      >
        <div className={colCls}>
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
        {aside && <div className={`${asideCls} motion-right`}>{aside}</div>}
      </div>
    </section>
  );
}

export default function Home() {
  const mainRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [ringIndex, setRingIndex] = useState(-1);

  useEffect(() => {
    if (reduced) return;
    const lenis = new Lenis({ lerp: 0.1 });
    // Everything that scrolls programmatically goes through Lenis from here,
    // so nothing ever races it with a native smooth scroll.
    const unregisterScroller = registerScroller(lenis);
    // Lenis subscribes first so scroll is settled before the field and the
    // HUD, which subscribe on mount, read it in the same frame.
    const offFrame = onFrame((time) => lenis.raf(time));
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
      const commonTrigger = { trigger: el, ...REVEAL_TRIGGER };

      if (motionType === "cards") {
        const cards = el.querySelectorAll<HTMLElement>(".motion-card");
        return gsap.fromTo(
          cards,
          { opacity: 0, y: RISE, scale: 0.92 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            stagger: STAGGER,
            ease: EASE.settle,
            scrollTrigger: commonTrigger,
          }
        );
      }

      if (motionType === "split") {
        const left = el.querySelector<HTMLElement>(".motion-left");
        const right = el.querySelector<HTMLElement>(".motion-right");
        const tl = gsap.timeline({ scrollTrigger: commonTrigger });
        if (left) tl.fromTo(left, { opacity: 0, x: -46 }, { opacity: 1, x: 0, ease: EASE.out }, 0);
        if (right) tl.fromTo(right, { opacity: 0, x: 46, scale: 0.92 }, { opacity: 1, x: 0, scale: 1, ease: EASE.out }, STAGGER);
        return tl;
      }

      if (motionType === "grid") {
        const tiles = el.querySelectorAll<HTMLElement>(".motion-tile");
        return gsap.fromTo(
          tiles,
          { opacity: 0, y: RISE },
          {
            opacity: 1,
            y: 0,
            stagger: { each: STAGGER, from: "start", grid: "auto" },
            ease: EASE.out,
            scrollTrigger: commonTrigger,
          }
        );
      }

      if (motionType === "center") {
        return gsap.fromTo(
          el,
          { opacity: 0, y: RISE, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, ease: EASE.out, scrollTrigger: commonTrigger }
        );
      }

      return gsap.fromTo(
        el,
        { opacity: 0, y: RISE },
        { opacity: 1, y: 0, ease: EASE.out, scrollTrigger: commonTrigger }
      );
    });

    /**
     * Drives the field's directional light.
     *
     * GlassField's top layer is bright in the middle and clear at the edges.
     * Each stage declares which side its copy sits on, and the bright window
     * slides the other way as that stage comes into view, so the copy is
     * always sitting against the calmer half of the field.
     *
     * Written as a CSS variable rather than React state because it changes on
     * scroll and must never trigger a render. The .scrim class transitions
     * the resulting transform itself, so this is a single property write.
     */
    const SHIFT = { left: "15vw", right: "-15vw", center: "0px" } as const;
    function applySide(el: HTMLElement) {
      const side = (el.dataset.side || "center") as keyof typeof SHIFT;
      document.documentElement.style.setProperty(
        "--scrim-shift",
        SHIFT[side] ?? "0px"
      );
    }

    const sideTriggers = copies.map((el) =>
      ScrollTrigger.create({
        trigger: el,
        start: "top 65%",
        end: "bottom 35%",
        onEnter: () => applySide(el),
        onEnterBack: () => applySide(el),
      })
    );

    return () => {
      offFrame();
      unregisterScroller();
      lenis.destroy();
      st.kill();
      sideTriggers.forEach((t) => t.kill());
      document.documentElement.style.removeProperty("--scrim-shift");
      copyTriggers.forEach((t) => {
        t.scrollTrigger?.kill();
        t.kill();
      });
    };
  }, [reduced]);

  return (
    <div
      ref={mainRef}
      className="relative"
      style={{ background: "#ffffff", color: "#2F5D7C", paddingBottom: "112px" }}
    >
      <GlassField />
      <JourneyHUD />
      <StickyCTA />
      <ServicePanel service={selectedService} onClose={() => setSelectedService(null)} />

      <header className="fixed top-0 inset-x-0 px-3 sm:px-6 py-3 sm:py-4" style={{ zIndex: 10 }}>
        <div className="glass-thick glass-edge max-w-6xl mx-auto flex items-center justify-between rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3">
          <span className="font-tech text-sm font-bold tracking-tight whitespace-nowrap" style={{ color: "#2F5D7C" }}>
            NEX<span style={{ color: "#7EC8E3" }}>ELITE</span>
          </span>
          <a
            href="mailto:nexelitemedia@gmail.com"
            className="text-xs sm:text-sm font-bold px-4 py-2 sm:py-1.5 rounded-lg transition-all duration-[240ms] hover:-translate-y-px whitespace-nowrap"
            style={{ background: "#7EC8E3", color: "#09121c", boxShadow: "0 0 20px -4px #7EC8E3" }}
          >
            Get in touch
          </a>
        </div>
      </header>

      <section className="relative min-h-[100svh] flex items-center px-5 sm:px-6 pt-28 sm:pt-32" style={{ zIndex: 2 }}>
        <div data-motion="split" data-side="left" className="stage-copy max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="max-w-xl motion-left">
            <div
              className="glass-thin inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium mb-7 sm:mb-9"
              style={{ color: "#2F5D7C" }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#7EC8E3" }} />
              <span className="font-tech tracking-wider whitespace-nowrap">40M+ views delivered</span>
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
                href="#proof"
                className="flex items-center justify-center gap-1.5 text-sm font-bold px-7 py-3.5 rounded-xl transition-all duration-[240ms] hover:-translate-y-0.5 whitespace-nowrap"
                style={{ background: "#2F5D7C", color: "#ffffff", boxShadow: "0 12px 28px -10px rgba(47,93,124,0.7)" }}
              >
                See the numbers <ArrowUpRight className="w-4 h-4 flex-shrink-0" />
              </a>
              <a
                href="mailto:nexelitemedia@gmail.com"
                className="glass glass-edge text-sm font-semibold text-center px-7 py-3.5 rounded-xl transition-all duration-[120ms] whitespace-nowrap"
                style={{ color: "#2F5D7C" }}
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

      <BrandMarquee />

      <section id="channels" className="relative min-h-[100svh] flex flex-col items-center justify-center px-5 sm:px-6 py-24 sm:py-20" style={{ zIndex: 2 }}>
        <div data-motion="center" data-side="center" className="stage-copy max-w-6xl mx-auto w-full text-center mb-12 sm:mb-16">
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
        <div data-motion="grid" data-side="center" className="stage-copy w-full">
          <ChannelGrid onSelect={setSelectedService} />
        </div>
      </section>

      {/* Creator growth: the three real stories, one shared honest scale. */}
      <section id="growth" className="relative min-h-[100svh] flex items-center px-5 sm:px-6 py-24 sm:py-20" style={{ zIndex: 2 }}>
        <div data-motion="split" data-side="left" className="stage-copy max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="max-w-md lg:col-span-5 motion-left">
            <p className="font-tech text-xs font-bold uppercase tracking-[0.22em] mb-4" style={{ color: "#2F5D7C" }}>
              Creators, tuned
            </p>
            <h2
              className="font-disp font-extrabold mb-5"
              style={{ fontSize: "clamp(30px, 7vw, 54px)", letterSpacing: "-0.03em", lineHeight: 1.05, color: "#2F5D7C" }}
            >
              We don&apos;t promise reach.
              <br />
              We log it.
            </h2>
            <p className="text-base sm:text-lg leading-relaxed" style={{ color: "#4d6577" }}>
              Three creators, three starting points, one method. Every bar below
              is on the same scale, so the distances are real.
            </p>
          </div>
          <div className="lg:col-span-7 motion-right">
            <div className="lift rounded-2xl"><GrowthLedger /></div>
          </div>
        </div>
      </section>

      {/* Client impact: the five real engagements. */}
      <section id="impact" className="relative min-h-[100svh] flex flex-col items-center justify-center px-5 sm:px-6 py-24 sm:py-20" style={{ zIndex: 2 }}>
        <div data-motion="center" data-side="center" className="stage-copy max-w-6xl mx-auto w-full text-center mb-12 sm:mb-14">
          <p className="font-tech text-xs font-bold uppercase tracking-[0.22em] mb-4" style={{ color: "#2F5D7C" }}>
            Our impact
          </p>
          <h2
            className="font-disp font-extrabold mb-5"
            style={{ fontSize: "clamp(30px, 7vw, 58px)", letterSpacing: "-0.03em", lineHeight: 1.05, color: "#2F5D7C" }}
          >
            Brands we&apos;ve
            <br />
            tuned to signal.
          </h2>
          <p className="text-base sm:text-lg max-w-md mx-auto" style={{ color: "#4d6577" }}>
            Skincare, healthcare, and education. Different channels, same method.
          </p>
        </div>
        <div data-motion="grid" data-side="center" className="stage-copy w-full max-w-6xl mx-auto">
          <ClientImpact />
        </div>
      </section>

      {CASE_STUDIES.length > 0 && (
        <section id="work" className="relative min-h-[100svh] flex flex-col items-center justify-center px-5 sm:px-6 py-24 sm:py-20" style={{ zIndex: 2 }}>
          <div data-motion="center" data-side="center" className="stage-copy max-w-6xl mx-auto w-full text-center mb-12 sm:mb-16">
            <p className="font-tech text-xs font-bold uppercase tracking-[0.22em] mb-4" style={{ color: "#2F5D7C" }}>
              Receipts
            </p>
            <h2
              className="font-disp font-extrabold mb-5"
              style={{ fontSize: "clamp(30px, 7vw, 58px)", letterSpacing: "-0.03em", lineHeight: 1.05, color: "#2F5D7C" }}
            >
              The work behind
              <br />
              the numbers.
            </h2>
          </div>
          <div data-motion="grid" data-side="center" className="stage-copy w-full max-w-6xl mx-auto">
            <WorkTeasers />
          </div>
        </section>
      )}

      <section className="relative min-h-[100svh] flex items-center px-5 sm:px-6 py-24 sm:py-20" style={{ zIndex: 2 }}>
        <div data-motion="split" data-side="left" className="stage-copy max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-10 items-center">
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
                  className="glass-thin px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
                  style={{ color: "#2F5D7C" }}
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

      <Stage
        id="proof"
        motion="split"
        align="left"
        kicker="On the record"
        title={<>Numbers,<br />not adjectives.</>}
        aside={<StatsProof stacked />}
      >
        <div className="motion-left">
          <p className="text-base sm:text-lg leading-relaxed" style={{ color: "#4d6577" }}>
            We&apos;d rather show you than tell you. Every figure here is
            counted, not estimated, and we will walk you through any of them.
          </p>
        </div>
      </Stage>

      <Stage motion="grid" align="center" width="wide" kicker="How it runs" title={<>Five steps.<br />No mystery.</>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4 w-full">
          {PROCESS.map((step, i) => (
            <div
              key={step.name}
              className="glass glass-edge motion-tile rounded-2xl px-4 py-5 text-left"
            >
              <p className="font-tech text-[10px] font-bold tracking-[0.22em] mb-2" style={{ color: "#7EC8E3" }}>
                0{i + 1}
              </p>
              <p className="font-disp text-base font-extrabold mb-1" style={{ color: "#2F5D7C" }}>
                {step.name}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "#4d6577" }}>
                {step.note}
              </p>
            </div>
          ))}
        </div>
      </Stage>

      <Stage
        motion="split"
        align="right"
        kicker="Found the rhythm"
        title={<>Paced for attention.<br />Built to retain.</>}
        aside={<CutCadence />}
      >
        <p className="text-base sm:text-lg leading-relaxed mb-7 motion-left" style={{ color: "#4d6577" }}>
          Cuts land on the beat. Captions arrive on time. Nothing overstays its welcome.
        </p>
        <div className="glass glass-edge glass-cyan lift motion-left inline-flex flex-col gap-1 px-6 py-5 rounded-2xl text-left">
          <p className="font-disp text-xl font-extrabold" style={{ color: "#2F5D7C" }}>Retention-first editing</p>
          <p className="text-sm" style={{ color: "#4d6577" }}>Every cut earns the next three seconds</p>
        </div>
      </Stage>

      <section
        className="relative min-h-[100svh] flex items-center justify-center px-5 sm:px-6 text-center"
        style={{ zIndex: 2 }}
      >
        <div data-motion="center" data-side="center" className="stage-copy max-w-xl mx-auto">
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
            className="inline-flex items-center gap-2 font-bold px-10 py-4 rounded-xl text-sm sm:text-base transition-all duration-[240ms] hover:-translate-y-0.5 whitespace-nowrap"
            style={{ background: "#2F5D7C", color: "#ffffff", boxShadow: "0 16px 36px -12px rgba(47,93,124,0.75)" }}
          >
            nexelitemedia@gmail.com <ArrowUpRight className="w-4 h-4 flex-shrink-0" />
          </a>
        </div>
      </section>

      <footer
        className="glass-thick relative px-6 py-12"
        style={{
          zIndex: 2,
          border: "none",
          borderTop: "1px solid rgba(255,255,255,0.7)",
          borderRadius: 0,
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
