"use client";

/* ──────────────────────────────────────────────────────────────────────────
   NexElite Media — landing page
   A single scroll journey. A fixed WebGL particle cloud morphs through:
   static → play → aperture → pulse → NEXELITE wordmark, while copy
   sections scroll over it. Sky blue + slate ink on white.
   Fallback: static layout for reduced-motion / no-WebGL / tiny screens.
   ────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { ArrowUpRight } from "lucide-react";
import { PhoneProof } from "@/components/PhoneProof";
import { StatsProof } from "@/components/StatsProof";
import { StickyCTA } from "@/components/StickyCTA";
import { ChannelGrid } from "@/components/ChannelGrid";
import { ChannelStrip } from "@/components/ChannelStrip";
import { ServicePanel } from "@/components/ServicePanel";
import type { Service } from "@/lib/services";

gsap.registerPlugin(ScrollTrigger);

function jitter(mag: number) {
  return (Math.random() - 0.5) * 2 * mag;
}

function chaosTarget(count: number): Float32Array {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = Math.pow(Math.random(), 0.42) * 1.35;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    arr[i * 3] = r * Math.sin(ph) * Math.cos(th);
    arr[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.8;
    arr[i * 3 + 2] = r * Math.cos(ph) * 0.55;
  }
  return arr;
}

function sampleCanvas(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  count: number,
  depth = 0.16
): Float32Array {
  const S = 320;
  const cv = document.createElement("canvas");
  cv.width = S;
  cv.height = S;
  const ctx = cv.getContext("2d")!;
  ctx.clearRect(0, 0, S, S);
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#fff";
  draw(ctx, S, S);
  const img = ctx.getImageData(0, 0, S, S).data;
  const pts = [];
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      if (img[(y * S + x) * 4 + 3] > 100) pts.push(x, y);
    }
  const arr = new Float32Array(count * 3);
  const n = pts.length / 2;
  for (let i = 0; i < count; i++) {
    const k = (Math.random() * n) | 0;
    const px = pts[k * 2];
    const py = pts[k * 2 + 1];
    arr[i * 3] = ((px / S) * 2 - 1) * 1.15 + jitter(0.012);
    arr[i * 3 + 1] = (1 - (py / S) * 2) * 1.15 + jitter(0.012);
    arr[i * 3 + 2] = jitter(depth);
  }
  return arr;
}

function playTarget(count: number): Float32Array {
  return sampleCanvas((ctx, w, h) => {
    ctx.beginPath();
    ctx.moveTo(w * 0.32, h * 0.2);
    ctx.lineTo(w * 0.32, h * 0.8);
    ctx.lineTo(w * 0.8, h * 0.5);
    ctx.closePath();
    ctx.fill();
  }, count);
}

function apertureTarget(count: number): Float32Array {
  return sampleCanvas((ctx, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    const blades = 7;
    const rOuter = h * 0.42;
    const rInner = h * 0.14;
    ctx.lineWidth = h * 0.045;
    for (let i = 0; i < blades; i++) {
      const a0 = (i / blades) * Math.PI * 2;
      const a1 = a0 + (Math.PI * 2) / blades / 1.7;
      ctx.beginPath();
      ctx.arc(cx, cy, rOuter, a0, a1);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
    ctx.lineWidth = h * 0.03;
    ctx.stroke();
  }, count);
}

function pulseTarget(count: number): Float32Array {
  return sampleCanvas((ctx, w, h) => {
    ctx.lineWidth = h * 0.045;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    const midY = h * 0.5;
    ctx.moveTo(w * 0.06, midY);
    ctx.lineTo(w * 0.24, midY);
    ctx.lineTo(w * 0.34, midY - h * 0.28);
    ctx.lineTo(w * 0.46, midY + h * 0.32);
    ctx.lineTo(w * 0.56, midY - h * 0.18);
    ctx.lineTo(w * 0.66, midY);
    ctx.lineTo(w * 0.94, midY);
    ctx.stroke();
  }, count);
}

function wordmarkTarget(count: number): Float32Array {
  return sampleCanvas((ctx, w, h) => {
    ctx.font = `900 ${h * 0.2}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("NEXELITE", w / 2, h / 2);
  }, count);
}

const VERT = `
  attribute vec3 t0; attribute vec3 t1; attribute vec3 t2; attribute vec3 t3; attribute vec3 t4;
  attribute float aSeed;
  uniform float uProgress;
  uniform float uTime;
  uniform vec2  uMouse;
  uniform float uMouseOn;
  uniform float uPixelRatio;
  uniform vec2  uShift;
  varying float vSeed;
  varying float vGlow;

  void main() {
    vSeed = aSeed;

    float p   = clamp(uProgress - aSeed * 0.22, 0.0, 4.0);
    float seg = floor(min(p, 3.999));
    float f   = p - seg;
    f = f * f * (3.0 - 2.0 * f);
    float q = seg + f;

    float w0 = max(0.0, 1.0 - abs(q - 0.0));
    float w1 = max(0.0, 1.0 - abs(q - 1.0));
    float w2 = max(0.0, 1.0 - abs(q - 2.0));
    float w3 = max(0.0, 1.0 - abs(q - 3.0));
    float w4 = max(0.0, 1.0 - abs(q - 4.0));
    vec3 pos = t0 * w0 + t1 * w1 + t2 * w2 + t3 * w3 + t4 * w4;

    float chaosAmp = mix(0.15, 0.02, clamp(q, 0.0, 1.0));
    float t = uTime * 0.6 + aSeed * 6.2831;
    pos += vec3(
      sin(t + pos.y * 3.1),
      cos(t * 1.3 + pos.x * 2.7),
      sin(t * 0.8 + pos.z * 4.0)
    ) * chaosAmp * (0.4 + aSeed * 0.6);

    pos *= 1.0 + sin(uTime * 0.5 + aSeed * 3.0) * 0.012;
    pos.xy += uShift;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vec4 clip = projectionMatrix * mv;
    vec2 ndc = clip.xy / max(clip.w, 0.0001);

    float d = distance(ndc, uMouse);
    float infl = (1.0 - smoothstep(0.0, 0.4, d)) * uMouseOn;
    vGlow = infl;
    vec2 dir = ndc - uMouse;
    float len = max(length(dir), 0.001);
    mv.xy += (dir / len) * infl * 0.24;

    gl_Position = projectionMatrix * mv;
    gl_PointSize = (2.4 + aSeed * 3.8) * uPixelRatio * (3.0 / max(-mv.z, 0.1)) * (1.0 + infl * 0.8);
  }
`;

const FRAG = `
  varying float vSeed;
  varying float vGlow;
  uniform float uTime;

  void main() {
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float rot = vSeed * 6.2831 + uTime * (0.15 + vSeed * 0.35);
    float cr = cos(rot), sr = sin(rot);
    p = mat2(cr, -sr, sr, cr) * p;
    float d = max(abs(p.x) * 0.866 + p.y * 0.5, -p.y * 0.9);
    float alpha = 1.0 - smoothstep(0.55, 0.78, d);
    if (alpha < 0.02) discard;

    vec3 slate = vec3(0.184, 0.365, 0.486);
    vec3 sky   = vec3(0.494, 0.784, 0.890);
    vec3 sand  = vec3(0.851, 0.725, 0.541);
    float band = fract(vSeed * 7.0 + uTime * 0.05);
    vec3 col = mix(slate, sky, smoothstep(0.2, 0.8, vSeed));
    col = mix(col, sand, step(0.88, band) * 0.85);
    col += vGlow * 0.35;

    gl_FragColor = vec4(col, alpha * (0.65 + vSeed * 0.35));
  }
`;

function ParticleField({
  progressRef,
}: {
  progressRef: React.MutableRefObject<number>;
}) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const COUNT = isMobile ? 3500 : 12000;
    const DPR = Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2);

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(DPR);
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      20
    );
    camera.position.z = 3.1;

    const geo = new THREE.BufferGeometry();
    const seeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) seeds[i] = Math.random();
    geo.setAttribute("position", new THREE.BufferAttribute(chaosTarget(COUNT), 3));
    geo.setAttribute("t0", new THREE.BufferAttribute(chaosTarget(COUNT), 3));
    geo.setAttribute("t1", new THREE.BufferAttribute(playTarget(COUNT), 3));
    geo.setAttribute("t2", new THREE.BufferAttribute(apertureTarget(COUNT), 3));
    geo.setAttribute("t3", new THREE.BufferAttribute(pulseTarget(COUNT), 3));
    geo.setAttribute("t4", new THREE.BufferAttribute(wordmarkTarget(COUNT), 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uProgress: { value: 0 },
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(10, 10) },
        uMouseOn: { value: isMobile ? 0 : 1 },
        uPixelRatio: { value: DPR },
        uShift: { value: new THREE.Vector2(0, 0) },
      },
    });

    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    scene.add(points);

    const mouse = new THREE.Vector2(10, 10);
    function onMove(e: PointerEvent) {
      mouse.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
    }
    if (!isMobile) window.addEventListener("pointermove", onMove, { passive: true });

    let lastW = window.innerWidth;
    function onResize() {
      if (isMobile && window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", onResize);

    const SHIFT_X = [0.85, -0.8, 0.8, -0.8, 0];
    const SHIFT_Y = [0, 0, 0, 0, 0.12];
    const narrow = window.matchMedia("(max-width: 1024px)").matches;
    const shiftScale = narrow ? 0.35 : 1;

    let raf = 0;
    const clock = new THREE.Clock();
    function tick() {
      mat.uniforms.uTime.value = clock.getElapsedTime();
      mat.uniforms.uProgress.value +=
        (progressRef.current - mat.uniforms.uProgress.value) * 0.08;
      mat.uniforms.uMouse.value.lerp(mouse, 0.12);

      const q = Math.max(0, Math.min(4, mat.uniforms.uProgress.value));
      let sx = 0;
      let sy = 0;
      for (let n = 0; n <= 4; n++) {
        const w = Math.max(0, 1 - Math.abs(q - n));
        sx += SHIFT_X[n] * w;
        sy += SHIFT_Y[n] * w;
      }
      mat.uniforms.uShift.value.set(sx * shiftScale, sy);

      points.rotation.y = Math.sin(clock.elapsedTime * 0.08) * 0.12;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      if (!isMobile) window.removeEventListener("pointermove", onMove);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [progressRef]);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 0,
        background:
          "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(126,200,227,0.10) 0%, transparent 65%), #ffffff",
      }}
    />
  );
}

const STAGE_LABELS = ["Static", "Signal", "Focus", "Rhythm", "On air"];

function StageRail({
  progressRef,
}: {
  progressRef: React.MutableRefObject<number>;
}) {
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    let raf = 0;
    function tick() {
      const p = progressRef.current;
      dotRefs.current.forEach((el, i) => {
        if (!el) return;
        const w = Math.max(0, 1 - Math.abs(p - i));
        el.style.opacity = String(0.25 + w * 0.75);
        el.style.transform = `scale(${1 + w * 0.6})`;
        const label = el.nextElementSibling as HTMLElement | null;
        if (label) label.style.opacity = String(w > 0.55 ? 0.85 : 0);
      });
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progressRef]);
  return (
    <div
      className="fixed right-6 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-end gap-5"
      style={{ zIndex: 9 }}
    >
      {STAGE_LABELS.map((l, i) => (
        <div key={l} className="flex items-center gap-2 flex-row-reverse">
          <div
            ref={(el) => {
              dotRefs.current[i] = el;
            }}
            className="w-2 h-2 rounded-full transition-transform duration-300"
            style={{ background: "#2F5D7C", opacity: 0.25 }}
          />
          <span
            className="text-[10px] uppercase tracking-widest font-semibold transition-opacity duration-300"
            style={{ color: "rgba(47,93,124,0.7)", opacity: 0 }}
          >
            {l}
          </span>
        </div>
      ))}
    </div>
  );
}

function DriftTriangles() {
  const [count, setCount] = useState(14);
  useEffect(() => {
    setCount(window.matchMedia("(max-width: 768px)").matches ? 7 : 14);
  }, []);
  const tris = useRef(
    Array.from({ length: 14 }, (_, i) => ({
      left: `${(i * 71) % 100}%`,
      top: `${(i * 37) % 100}%`,
      size: 10 + (i % 4) * 9,
      dur: 22 + (i % 5) * 8,
      delay: -(i * 3.7),
      sand: i % 5 === 0,
    }))
  ).current;
  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 1 }}
    >
      {tris.slice(0, count).map((t, i) => (
        <svg
          key={i}
          width={t.size}
          height={t.size}
          viewBox="0 0 24 24"
          className="absolute animate-drift"
          style={{
            left: t.left,
            top: t.top,
            animationDuration: `${t.dur}s`,
            animationDelay: `${t.delay}s`,
            opacity: 0.08,
          }}
        >
          <path
            d="M12 3 L21 20 L3 20 Z"
            fill="none"
            stroke={t.sand ? "#D9B98A" : "#7EC8E3"}
            strokeWidth="1.4"
          />
        </svg>
      ))}
    </div>
  );
}

function Stage({
  align = "left",
  kicker,
  title,
  children,
  innerRef,
}: {
  align?: "left" | "right" | "center";
  kicker?: string;
  title: React.ReactNode;
  children?: React.ReactNode;
  innerRef?: React.Ref<HTMLDivElement>;
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
        className={`stage-copy max-w-6xl mx-auto w-full flex flex-col ${alignCls}`}
      >
        <div className="max-w-md w-full">
          {kicker && (
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-4"
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
  const progressRef = useRef(0);
  const mainRef = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState<boolean | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

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
        progressRef.current = self.progress * 4;
      },
    });
    ScrollTrigger.refresh();

    const copies = gsap.utils.toArray<HTMLElement>(".stage-copy");
    const copyTriggers = copies.map((el) =>
      gsap.fromTo(
        el,
        { opacity: 0, y: 42 },
        {
          opacity: 1,
          y: 0,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 78%",
            end: "top 45%",
            scrub: true,
          },
        }
      )
    );

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
    <div ref={mainRef} className="relative" style={{ background: "#ffffff", color: "#2F5D7C" }}>
      {!reduced && <ParticleField progressRef={progressRef} />}
      {!reduced && <DriftTriangles />}
      {!reduced && <StageRail progressRef={progressRef} />}
      <ChannelStrip />
      <StickyCTA />
      <ServicePanel service={selectedService} onClose={() => setSelectedService(null)} />
      {reduced && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: 0,
            background:
              "radial-gradient(ellipse 70% 55% at 50% 35%, rgba(126,200,227,0.16) 0%, transparent 65%), #ffffff",
          }}
        />
      )}

      <header className="fixed top-0 inset-x-0 px-3 sm:px-6 py-3 sm:py-4" style={{ zIndex: 10 }}>
        <div
          className="max-w-6xl mx-auto flex items-center justify-between rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5"
          style={{
            background: "rgba(9,18,28,0.65)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(126,200,227,0.3)",
            boxShadow: "0 8px 32px -12px rgba(47,93,124,0.35)",
          }}
        >
          <span className="text-sm font-bold tracking-tight font-mono" style={{ color: "#EAF6FF" }}>
            NEX<span style={{ color: "#7EC8E3" }}>ELITE</span>
          </span>
          <a
            href="mailto:nexelitemedia@gmail.com"
            className="text-xs sm:text-sm font-bold px-3.5 sm:px-4 py-2 sm:py-1.5 rounded-lg transition-all duration-200 hover:-translate-y-px"
            style={{ background: "#7EC8E3", color: "#09121c", boxShadow: "0 0 20px -4px #7EC8E3" }}
          >
            Get in touch
          </a>
        </div>
      </header>

      <section className="relative min-h-[100svh] flex items-center px-5 sm:px-6" style={{ zIndex: 2 }}>
        <div className="stage-copy max-w-6xl mx-auto w-full">
          <div className="max-w-xl">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6 sm:mb-8"
              style={{
                background: "rgba(126,200,227,0.14)",
                border: "1px solid rgba(126,200,227,0.4)",
                color: "#2F5D7C",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#7EC8E3" }} />
              Test transmission
            </div>
            <h1
              className="font-disp font-extrabold leading-none mb-5 sm:mb-6"
              style={{ fontSize: "clamp(36px, 10vw, 80px)", letterSpacing: "-0.03em", color: "#2F5D7C" }}
            >
              Every channel
              <br />
              starts as{" "}
              <span
                style={{
                  background: "linear-gradient(100deg, #2F5D7C 10%, #7EC8E3 90%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                noise.
              </span>
            </h1>
            <p className="text-base sm:text-lg mb-8 sm:mb-10 leading-relaxed" style={{ color: "#6f8ca3", maxWidth: "420px" }}>
              NexElite tunes it into signal — reels, campaigns, and brand content that actually get watched.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <a
                href="#work"
                className="flex items-center justify-center gap-1.5 text-sm font-bold px-6 py-3 sm:py-2.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: "#2F5D7C", color: "#ffffff" }}
              >
                See the work <ArrowUpRight className="w-4 h-4" />
              </a>
              <a
                href="mailto:nexelitemedia@gmail.com"
                className="text-sm text-center px-6 py-3 sm:py-2.5 rounded-xl transition-all duration-150"
                style={{ color: "#2F5D7C", border: "1px solid rgba(47,93,124,0.2)" }}
              >
                Start a project
              </a>
            </div>
          </div>
        </div>
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden min-[400px]:flex flex-col items-center gap-2"
          style={{ color: "rgba(47,93,124,0.4)" }}
        >
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold">Scroll</span>
          <div className="w-px h-8 animate-pulse" style={{ background: "linear-gradient(180deg, rgba(47,93,124,0.4), transparent)" }} />
        </div>
      </section>

      <section className="relative min-h-[100svh] flex flex-col items-center justify-center px-5 sm:px-6 py-24 sm:py-20" style={{ zIndex: 2 }}>
        <div className="stage-copy max-w-6xl mx-auto w-full text-center mb-10 sm:mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#2F5D7C" }}>
            Signal acquired
          </p>
          <h2
            className="font-disp font-extrabold mb-4"
            style={{ fontSize: "clamp(28px, 8vw, 52px)", letterSpacing: "-0.025em", lineHeight: 1.08, color: "#2F5D7C" }}
          >
            Eight channels.
            <br />
            One frequency.
          </h2>
          <p className="text-base max-w-md mx-auto" style={{ color: "#6f8ca3" }}>
            Tap a channel to see what it delivers.
          </p>
        </div>
        <div className="stage-copy w-full">
          <ChannelGrid onSelect={setSelectedService} />
        </div>
      </section>

      <section className="relative min-h-[100svh] flex items-center px-5 sm:px-6 py-24 sm:py-20" style={{ zIndex: 2 }}>
        <div className="stage-copy max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-6 items-center">
          <div className="max-w-md order-2 lg:order-1">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#2F5D7C" }}>
              In focus
            </p>
            <h2
              className="font-disp font-extrabold mb-5"
              style={{ fontSize: "clamp(28px, 8vw, 52px)", letterSpacing: "-0.025em", lineHeight: 1.08, color: "#2F5D7C" }}
            >
              Shot with intent.
              <br />
              Edited with taste.
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: "#6f8ca3" }}>
              Not a stock template dressed up as a brand. Every frame is composed for what your audience actually stops scrolling for.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Location scouted", "Lit properly", "Graded to brand"].map((chip) => (
                <span
                  key={chip}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(126,200,227,0.14)", border: "1px solid rgba(126,200,227,0.4)", color: "#2F5D7C" }}
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <PhoneProof />
          </div>
        </div>
      </section>

      <Stage align="left" kicker="On the record" title={<>Numbers,<br />not adjectives.</>}>
        <p className="text-base leading-relaxed mb-2" style={{ color: "#6f8ca3" }}>
          We&apos;d rather show you than tell you.
        </p>
        <StatsProof />
      </Stage>

      <Stage align="right" kicker="Found the rhythm" title={<>Paced for attention.<br />Built to retain.</>}>
        <p className="text-base leading-relaxed mb-6" style={{ color: "#6f8ca3" }}>
          Cuts land on the beat. Captions arrive on time. Nothing overstays its welcome.
        </p>
        <div
          className="inline-flex flex-col gap-1 px-5 py-4 rounded-2xl text-left"
          style={{ background: "rgba(126,200,227,0.12)", border: "1px solid rgba(126,200,227,0.35)" }}
        >
          <p className="text-xl font-black" style={{ color: "#2F5D7C" }}>Retention-first editing</p>
          <p className="text-sm" style={{ color: "#5a7891" }}>Every cut earns the next three seconds</p>
        </div>
      </Stage>

      <section
        className="relative min-h-[100svh] flex items-center justify-center px-5 sm:px-6 text-center"
        style={{ zIndex: 2 }}
      >
        <div className="stage-copy max-w-xl mx-auto">
          <h2
            className="font-disp font-extrabold mb-4"
            style={{ fontSize: "clamp(30px, 8vw, 56px)", letterSpacing: "-0.025em", lineHeight: 1.1, color: "#2F5D7C" }}
          >
            Ready to go on air?
          </h2>
          <p className="mb-10 text-lg" style={{ color: "#6f8ca3" }}>
            Tell us what you&apos;re building. We&apos;ll tell you how it looks in motion.
          </p>
          <a
            href="mailto:nexelitemedia@gmail.com"
            className="inline-flex items-center gap-2 font-bold px-9 py-3.5 rounded-xl text-sm transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: "#2F5D7C", color: "#ffffff" }}
          >
            nexelitemedia@gmail.com <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <footer
        className="relative px-6 py-10"
        style={{ zIndex: 2, background: "rgba(234,246,255,0.7)", borderTop: "1px solid rgba(47,93,124,0.12)", backdropFilter: "blur(8px)" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center md:justify-between gap-4">
          <span className="text-sm" style={{ color: "#6f8ca3" }}>NexElite Media</span>
          <p className="text-sm text-center" style={{ color: "#6f8ca3" }}>© 2026 NexElite Media</p>
        </div>
      </footer>
    </div>
  );
}
