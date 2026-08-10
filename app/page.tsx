"use client";

/* ──────────────────────────────────────────────────────────────────────────
   NexElite Media, landing page

   Set as an editorial spread. Warm paper, one ink, one accent, hairline
   rules, and a high-contrast serif doing the work a background effect used
   to do. Noise into signal is told by the typography now: the page opens
   loose and large and tightens into ruled, tabular proof.

   This replaces a glass theme, which replaced a Three.js corridor. Both of
   those put the interest behind the content. This one puts it in the
   content, which is the version that still works when the copy changes.

   Surfaces are requested by role (.surface, .surface-lead, .surface-quiet)
   and colour by token (var(--ink), var(--accent)). No component knows what
   the theme looks like, so the next change is app/globals.css alone.

   Progress: JourneyHUD, rendered inside the masthead as its bottom rule.

   Journey animations: per stage GSAP choreography (split, grid, cards,
   center).
   ────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { ArrowUpRight } from "lucide-react";
import { PhoneProof } from "@/components/PhoneProof";
import { StatsProof } from "@/components/StatsProof";
import { StickyCTA } from "@/components/StickyCTA";
import { ChannelGrid } from "@/components/ChannelGrid";
import { JourneyHUD } from "@/components/JourneyHUD";
import { PaperGround } from "@/components/PaperGround";
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
   * PaperGround rules the same twelve columns faintly behind the page, so
   * copy that sits on the grid lands on those rules instead of floating
   * between them. On the grid a left stage and a right stage are exact
   * mirrors, five columns each, and the middle two stay clear.
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
          {kicker && <p className="kicker mb-5">{kicker}</p>}
          <h2
            className="font-disp mb-5"
            style={{
              fontSize: "clamp(28px, 8vw, 52px)",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.06,
              color: "var(--ink)",
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
    // Lenis subscribes first so scroll is settled before the masthead rail,
    // which subscribes on mount, reads it in the same frame.
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

    return () => {
      offFrame();
      unregisterScroller();
      lenis.destroy();
      st.kill();
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
      style={{ background: "var(--paper)", color: "var(--ink)" }}
    >
      <PaperGround />
      <StickyCTA />
      <ServicePanel service={selectedService} onClose={() => setSelectedService(null)} />

      {/* Masthead. A newspaper does not float its nameplate in a card, it
          rules it off from the page. So: a full width paper band, and the
          hairline that closes it is the reading-position rail rendered by
          JourneyHUD. One object doing both jobs, which is why the page no
          longer carries chrome at two opposite edges. */}
      <header
        className="fixed top-0 inset-x-0 pb-px"
        style={{ zIndex: 10, background: "var(--paper)" }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 sm:px-6 py-3 sm:py-3.5">
          {/* Nameplate: the crowned N from the logo, then the set wordmark.
              The full lockup carries a tagline and a rule under it, neither
              of which survives at masthead height, so only the mark comes
              across and the serif keeps saying the name. */}
          <Link href="/" aria-label="NexElite Media, home" className="flex items-center gap-2.5">
            <Image
              src="/mark.png"
              alt=""
              width={186}
              height={256}
              priority
              className="h-7 sm:h-8 w-auto"
            />
            <span
              className="font-disp text-lg sm:text-xl whitespace-nowrap"
              style={{ color: "var(--ink)", fontWeight: 700, letterSpacing: "0.01em" }}
            >
              NexElite<span style={{ color: "var(--accent)" }}>.</span>
            </span>
          </Link>
          <a
            href="mailto:nexelitemedia@gmail.com"
            className="link-underline font-tech text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] whitespace-nowrap"
            style={{ color: "var(--ink)" }}
          >
            Get in touch
          </a>
        </div>
        <JourneyHUD />
      </header>

      <section className="relative min-h-[100svh] flex items-center px-5 sm:px-6 pt-28 sm:pt-32" style={{ zIndex: 2 }}>
        <div data-motion="split" data-side="left" className="stage-copy max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="max-w-xl motion-left">
            <div
              className="surface-quiet inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium mb-7 sm:mb-9"
              style={{ color: "var(--ink)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--accent)" }} />
              <span className="font-tech tracking-wider whitespace-nowrap">40M+ views delivered</span>
            </div>
            <h1
              className="font-disp mb-6 sm:mb-7"
              style={{
                fontSize: "clamp(40px, 9vw, 92px)",
                fontWeight: 700,
                letterSpacing: "-0.035em",
                lineHeight: 0.94,
                color: "var(--ink)",
              }}
            >
              Every channel
              <br />
              starts as{" "}
              {/* The one italic on the page. In a serif setting an italic is
                  a stronger emphasis than any colour or weight change, which
                  is why the accent is allowed to appear here and almost
                  nowhere else. */}
              <span style={{ fontStyle: "italic", fontWeight: 400, color: "var(--accent)" }}>
                noise.
              </span>
            </h1>
            <p className="text-lg sm:text-xl mb-9 sm:mb-11 leading-relaxed" style={{ color: "var(--body)", maxWidth: "var(--measure)" }}>
              We tune it into signal. Reels, campaigns, and brand content that
              people actually stop to watch.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <a
                href="#proof"
                className="flex items-center justify-center gap-1.5 text-sm font-bold px-7 py-3.5 transition-colors duration-[240ms] whitespace-nowrap"
                style={{ background: "var(--ink)", color: "var(--paper)" }}
              >
                See the numbers <ArrowUpRight className="w-4 h-4 flex-shrink-0" />
              </a>
              <a
                href="mailto:nexelitemedia@gmail.com"
                className="surface text-sm font-semibold text-center px-7 py-3.5 transition-all duration-[120ms] whitespace-nowrap"
                style={{ color: "var(--ink)" }}
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
          style={{ color: "rgba(23,20,15,0.25)" }}
        >
          <span className="font-tech text-[10px] uppercase tracking-[0.25em] font-bold whitespace-nowrap">Scroll to tune</span>
          <div className="w-px h-9 animate-pulse" style={{ background: "linear-gradient(180deg, rgba(23,20,15,0.25), transparent)" }} />
        </div>
      </section>

      <BrandMarquee />

      <section id="channels" className="relative min-h-[100svh] flex flex-col items-center justify-center px-5 sm:px-6 py-24 sm:py-20" style={{ zIndex: 2 }}>
        <div data-motion="center" data-side="center" className="stage-copy max-w-6xl mx-auto w-full text-center mb-12 sm:mb-16">
          <p className="kicker mb-5">Signal acquired</p>
          <h2
            className="font-disp mb-5"
            style={{ fontSize: "clamp(30px, 7vw, 62px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.02, color: "var(--ink)" }}
          >
            Eight channels.
            <br />
            One frequency.
          </h2>
          <p className="text-base sm:text-lg max-w-md mx-auto" style={{ color: "var(--body)" }}>
            Tap a channel, or use the rule under the masthead, to see what it delivers.
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
            <p className="kicker mb-5">Creators, tuned</p>
            <h2
              className="font-disp mb-5"
              style={{ fontSize: "clamp(30px, 7vw, 56px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.02, color: "var(--ink)" }}
            >
              We don&apos;t promise reach.
              <br />
              We log it.
            </h2>
            <p className="text-base sm:text-lg leading-relaxed" style={{ color: "var(--body)" }}>
              Three creators, three starting points, one method. Every bar below
              is on the same scale, so the distances are real.
            </p>
          </div>
          <div className="lg:col-span-7 motion-right">
            <div className="lift"><GrowthLedger /></div>
          </div>
        </div>
      </section>

      {/* Client impact: the five real engagements. */}
      <section id="impact" className="relative min-h-[100svh] flex flex-col items-center justify-center px-5 sm:px-6 py-24 sm:py-20" style={{ zIndex: 2 }}>
        <div data-motion="center" data-side="center" className="stage-copy max-w-6xl mx-auto w-full text-center mb-12 sm:mb-14">
          <p className="kicker mb-5">Our impact</p>
          <h2
            className="font-disp mb-5"
            style={{ fontSize: "clamp(30px, 7vw, 62px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.02, color: "var(--ink)" }}
          >
            Brands we&apos;ve
            <br />
            tuned to signal.
          </h2>
          <p className="text-base sm:text-lg max-w-md mx-auto" style={{ color: "var(--body)" }}>
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
            <p className="kicker mb-5">Receipts</p>
            <h2
              className="font-disp mb-5"
              style={{ fontSize: "clamp(30px, 7vw, 62px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.02, color: "var(--ink)" }}
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
            <p className="kicker mb-5">In focus</p>
            <h2
              className="font-disp mb-5"
              style={{ fontSize: "clamp(30px, 7vw, 56px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.02, color: "var(--ink)" }}
            >
              Shot with intent.
              <br />
              Edited with taste.
            </h2>
            <p className="text-base sm:text-lg leading-relaxed mb-7" style={{ color: "var(--body)" }}>
              Not a stock template dressed up as a brand. Every frame is composed for what your audience actually stops scrolling for.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Location scouted", "Lit properly", "Graded to brand"].map((chip) => (
                <span
                  key={chip}
                  className="surface-quiet px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap"
                  style={{ color: "var(--ink)" }}
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
          <p className="text-base sm:text-lg leading-relaxed" style={{ color: "var(--body)" }}>
            We&apos;d rather show you than tell you. Every figure here is
            counted, not estimated, and we will walk you through any of them.
          </p>
        </div>
      </Stage>

      <Stage motion="grid" align="center" width="wide" kicker="How it runs" title={<>Five steps.<br />No mystery.</>}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4 w-full">
          {PROCESS.map((step, i) => (
            <div key={step.name} className="surface motion-tile px-4 py-5 text-left">
              <p className="font-tech text-[10px] font-bold tracking-[0.22em] mb-2" style={{ color: "var(--accent)" }}>
                0{i + 1}
              </p>
              <p className="font-disp text-lg mb-1" style={{ color: "var(--ink)", fontWeight: 700 }}>
                {step.name}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--body)" }}>
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
        <p className="text-base sm:text-lg leading-relaxed mb-7 motion-left" style={{ color: "var(--body)" }}>
          Cuts land on the beat. Captions arrive on time. Nothing overstays its welcome.
        </p>
        <div className="surface surface-accent lift motion-left inline-flex flex-col gap-1 px-6 py-5 text-left">
          <p className="font-disp text-xl" style={{ color: "var(--ink)", fontWeight: 700 }}>Retention-first editing</p>
          <p className="text-sm" style={{ color: "var(--body)" }}>Every cut earns the next three seconds</p>
        </div>
      </Stage>

      <section
        className="relative min-h-[100svh] flex items-center justify-center px-5 sm:px-6 text-center"
        style={{ zIndex: 2 }}
      >
        <div data-motion="center" data-side="center" className="stage-copy max-w-xl mx-auto">
          <h2
            className="font-disp mb-5"
            style={{ fontSize: "clamp(34px, 8vw, 68px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.02, color: "var(--ink)" }}
          >
            Ready to go on air?
          </h2>
          <p className="mb-11 text-lg sm:text-xl" style={{ color: "var(--body)" }}>
            Tell us what you&apos;re building. We&apos;ll tell you how it looks in motion.
          </p>
          <a
            href="mailto:nexelitemedia@gmail.com"
            className="inline-flex items-center gap-2 font-bold px-10 py-4 text-sm sm:text-base transition-colors duration-[240ms] whitespace-nowrap"
            style={{ background: "var(--ink)", color: "var(--paper)" }}
          >
            nexelitemedia@gmail.com <ArrowUpRight className="w-4 h-4 flex-shrink-0" />
          </a>
        </div>
      </section>

      <footer
        className="relative px-5 sm:px-6 py-12"
        style={{
          zIndex: 2,
          background: "var(--paper)",
          borderTop: "2px solid var(--ink)",
        }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center md:justify-between gap-4">
          {/* The footer is the one place with room for the full lockup, so
              the tagline and the brush mark get to appear once. */}
          <Image
            src="/logo.png"
            alt="NexElite Media"
            width={700}
            height={563}
            className="h-14 sm:h-16 w-auto"
          />
          <p className="font-tech text-[11px] tracking-[0.16em] uppercase text-center" style={{ color: "var(--muted)" }}>
            © 2026 NexElite Media
          </p>
        </div>
      </footer>
    </div>
  );
}
