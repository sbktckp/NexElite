"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import * as THREE from "three";
import { SERVICES } from "@/lib/services";
import { onFrame } from "@/lib/frame";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * SignalCorridor, the journey layer.
 *
 * The page headline is the mechanic. You open inside a cloud of incoherent
 * static: roughly 1400 particles scattered through a fat cylinder, jittering
 * at random. As you scroll, each particle resolves, migrating from its chaos
 * position to an ordered position on a ring around the corridor axis, its
 * jitter damping to nothing and its colour shifting from dead grey to brand
 * sky and sand. By the end the static has become architecture, then collapses
 * onto a single axis of light.
 *
 * Nothing morphs into a logo and nothing spells a word. The transformation is
 * noise into structure, which is the one claim the agency actually makes.
 *
 * Construction
 * Every particle carries three positions as attributes, all precomputed:
 * chaos (where it starts, random in a cylinder), order (where it belongs, on
 * a Frenet framed ring around the spline), and centre (the spline point
 * itself, for the final collapse). The vertex shader mixes between them, so
 * there is no per frame CPU particle work at all.
 *
 * Crystallisation is local, not global. A particle knows where it lives along
 * the corridor and resolves when the camera reaches it, so the wavefront
 * travels with you: structure behind, static far ahead, and the band between
 * them is where the signal is actively locking in.
 *
 * Scroll velocity drives a camera FOV punch and particle scale, so fast
 * scrolling feels like acceleration rather than scrubbing. That one detail is
 * most of what separates 3D on a page from a ride.
 *
 * Art direction
 * This layer sits behind page copy at z index 0, so gates ignite on approach
 * and dissolve well before the pass through. Peaking opacity while the ring
 * engulfs the viewport parks a hard hoop behind the text.
 *
 * The corridor itself is a line armature, rails plus hoops, not a wireframed
 * tube. A wireframed tube draws every triangle hypotenuse, and that diagonal
 * cross hatch is what made the background read as noise in the wrong sense.
 *
 * A radial scrim sits between the canvas and the copy: clear where the
 * journey is, white where the text is. It is directional, sliding away from
 * whichever side the current stage puts its copy on.
 *
 * Diagnostics
 * Add ?debug=1 to the URL for status, canvas size, progress, camera depth,
 * resolve, speed and collapse.
 */

export const corridorProgress = { value: 0, live: false };

/**
 * Live journey state, written every frame by the corridor and read by the
 * HUD. A plain mutable object rather than React state on purpose: this
 * updates 60 times a second and must never trigger a re-render of the page.
 * The HUD samples it on its own throttled loop.
 */
export const corridorState = {
  /** True only while the WebGL journey is actually rendering frames. The
      HUD reads this to decide whether to trust the values below or fall
      back to plain document scroll, which is what happens under reduced
      motion or when WebGL is unavailable. */
  live: false,
  progress: 0,
  resolve: 0,
  collapse: 0,
  speed: 0,
  gate: 0,
  ignite: 0,
};

/** Gate positions along the path, so the HUD can scrub to an exact channel. */
export function gateFraction(index: number, total: number) {
  return (index + 1.2) / (total + 2) / 0.92;
}

type Status =
  | "booting"
  | "reduced-motion"
  | "webgl-unavailable"
  | "no-mount"
  | "running";

export function SignalCorridor() {
  const mountRef = useRef<HTMLDivElement>(null);
  const bootedRef = useRef(false);
  const [status, setStatus] = useState<Status>("booting");
  const [debugLine, setDebugLine] = useState("");
  const reducedMotion = useReducedMotion();
  const showDebug = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).has("debug"),
    () => false
  );

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      setStatus("no-mount");
      return;
    }
    if (bootedRef.current) return;
    bootedRef.current = true;

    if (reducedMotion) {
      bootedRef.current = false;
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
      });
    } catch {
      // Only fires when WebGL is unavailable, so this runs once on a dead
      // end path and cannot cascade. The rule does not model that.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("webgl-unavailable");
      bootedRef.current = false;
      return;
    }

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.75);
    renderer.setPixelRatio(DPR);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setClearColor(0x000000, 0);

    const canvas = renderer.domElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    mount.appendChild(canvas);
    setStatus("running");

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xffffff, 26, 125);

    const BASE_FOV = isMobile ? 78 : 66;
    const camera = new THREE.PerspectiveCamera(
      BASE_FOV,
      window.innerWidth / window.innerHeight,
      0.1,
      260
    );

    /* ---------- corridor path ---------- */
    const N = SERVICES.length;
    const SPAN = 22;
    const pathPts: THREE.Vector3[] = [];
    for (let i = 0; i <= N + 2; i++) {
      const t = i / (N + 2);
      pathPts.push(
        new THREE.Vector3(
          Math.sin(t * Math.PI * 1.9) * 6.5,
          Math.cos(t * Math.PI * 1.4) * 3.2,
          -i * SPAN
        )
      );
    }
    const path = new THREE.CatmullRomCurve3(pathPts);

    const SAMPLES = 600;
    const samples: THREE.Vector3[] = [];
    for (let i = 0; i <= SAMPLES; i++) samples.push(path.getPointAt(i / SAMPLES));

    function sampleAt(t: number, out: THREE.Vector3) {
      const x = Math.max(0, Math.min(1, t)) * SAMPLES;
      const i = Math.floor(x);
      const f = x - i;
      return out.copy(samples[i]).lerp(samples[Math.min(SAMPLES, i + 1)], f);
    }

    // Frenet frames give each ring a stable basis, so ordered particles sit
    // on a true perpendicular ring rather than a smeared ellipse.
    const FRAMES = 240;
    const frames = path.computeFrenetFrames(FRAMES, false);

    /* corridor armature
       Was a TubeGeometry in wireframe mode. Wireframing a triangulated tube
       draws every hypotenuse, so 200 by 9 segments produced a dense diagonal
       cross hatch that moired against the pixel grid and read as static
       rather than architecture, while costing 3600 triangles of line work.

       This draws the corridor the way a corridor actually reads: a set of
       longitudinal rails running to the vanishing point, plus evenly spaced
       hoops for distance rhythm. No diagonals, one draw call, and about a
       third of the vertices. */
    const TUBE_R = 9.5;
    const RAILS = 14;
    const HOOPS = 56;
    const RAIL_STEPS = 120;
    const HOOP_SEGS = 24;

    function ringPoint(t: number, ang: number, radius: number, out: THREE.Vector3) {
      const c = sampleAt(t, out);
      const fi = Math.min(FRAMES - 1, Math.floor(t * FRAMES));
      const n = frames.normals[fi];
      const b = frames.binormals[fi];
      const ca = Math.cos(ang);
      const sa = Math.sin(ang);
      c.x += (n.x * ca + b.x * sa) * radius;
      c.y += (n.y * ca + b.y * sa) * radius;
      c.z += (n.z * ca + b.z * sa) * radius;
      return c;
    }

    const armPts: number[] = [];
    const _a = new THREE.Vector3();
    const _b = new THREE.Vector3();

    for (let r = 0; r < RAILS; r++) {
      const ang = (r / RAILS) * Math.PI * 2;
      for (let i = 0; i < RAIL_STEPS; i++) {
        ringPoint(i / RAIL_STEPS, ang, TUBE_R, _a);
        ringPoint((i + 1) / RAIL_STEPS, ang, TUBE_R, _b);
        armPts.push(_a.x, _a.y, _a.z, _b.x, _b.y, _b.z);
      }
    }

    for (let h = 0; h <= HOOPS; h++) {
      const t = h / HOOPS;
      for (let k = 0; k < HOOP_SEGS; k++) {
        ringPoint(t, (k / HOOP_SEGS) * Math.PI * 2, TUBE_R, _a);
        ringPoint(t, ((k + 1) / HOOP_SEGS) * Math.PI * 2, TUBE_R, _b);
        armPts.push(_a.x, _a.y, _a.z, _b.x, _b.y, _b.z);
      }
    }

    const armGeo = new THREE.BufferGeometry();
    armGeo.setAttribute("position", new THREE.Float32BufferAttribute(armPts, 3));
    const armMat = new THREE.LineBasicMaterial({
      color: 0x2f5d7c,
      transparent: true,
      opacity: 0.05,
      depthWrite: false,
    });
    const armature = new THREE.LineSegments(armGeo, armMat);
    armature.frustumCulled = false;
    scene.add(armature);

    /* ---------- progress spine ----------
       The literal trail you have travelled, drawn down the corridor axis
       and revealed by draw range. This is what ties the flat progress rail
       at the bottom of the page to the space you are moving through: the
       rail and the spine fill at exactly the same rate. */
    const SPINE = 400;
    const spinePts = new Float32Array((SPINE + 1) * 3);
    for (let i = 0; i <= SPINE; i++) {
      const pt = path.getPointAt(i / SPINE);
      spinePts[i * 3] = pt.x;
      spinePts[i * 3 + 1] = pt.y;
      spinePts[i * 3 + 2] = pt.z;
    }
    const spineGeo = new THREE.BufferGeometry();
    spineGeo.setAttribute("position", new THREE.BufferAttribute(spinePts, 3));
    const spineMat = new THREE.LineBasicMaterial({
      color: 0x7ec8e3,
      transparent: true,
      opacity: 0.5,
    });
    const spine = new THREE.Line(spineGeo, spineMat);
    spine.frustumCulled = false;
    spineGeo.setDrawRange(0, 2);
    scene.add(spine);

    /* ---------- ring gates ---------- */
    type Gate = {
      rings: THREE.Mesh[];
      halo: THREE.Mesh;
      ticks: THREE.LineSegments;
      t: number;
    };
    const gates: Gate[] = [];
    const gateGroup = new THREE.Group();
    scene.add(gateGroup);

    /* Per channel gate signatures.
       Eight identical rings in eight colours meant colour was doing all the
       identifying work, and colour is the one channel a viewer cannot hold in
       memory between gates. Each gate now has its own ring count, radii and
       tick rhythm derived from its index, so a channel is recognisable by
       shape whether or not you remember its hue.

       Three shared torus geometries cover every radius, so this costs three
       buffers total rather than one per gate. */
    const RING_RADII = [4.6, 3.85, 5.35];
    const ringGeos = RING_RADII.map(
      (r) => new THREE.TorusGeometry(r, 0.05, 6, 96)
    );
    const haloGeo = new THREE.TorusGeometry(4.6, 0.28, 6, 48);
    const _v = new THREE.Vector3();

    SERVICES.forEach((svc, i) => {
      const t = (i + 1.2) / (N + 2);
      const pos = sampleAt(t, new THREE.Vector3());
      const tangent = path.getTangentAt(Math.min(0.999, t));
      // Pulled further toward slate. On a white page a pale cyan hoop has
      // almost no contrast, so it read as grey haze rather than a channel.
      const color = new THREE.Color(svc.tone).lerp(new THREE.Color(0x1d4460), 0.32);

      // One to three concentric rings, cycling by index.
      const ringCount = 1 + (i % 3);
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.18,
      });
      const rings: THREE.Mesh[] = [];
      for (let k = 0; k < ringCount; k++) {
        const m = new THREE.Mesh(ringGeos[k], ringMat);
        m.position.copy(pos);
        m.lookAt(pos.clone().add(tangent));
        rings.push(m);
      }
      const ring = rings[0];

      const halo = new THREE.Mesh(
        haloGeo,
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        })
      );
      halo.position.copy(pos);
      halo.quaternion.copy(ring.quaternion);
      halo.scale.setScalar(1.06);

      // Tick density and major-tick rhythm are both index derived, so the
      // outer collar of each gate has a distinct beat.
      const tickPts: number[] = [];
      const TICKS = 12 + i * 4;
      const majorEvery = 3 + (i % 3);
      for (let k = 0; k < TICKS; k++) {
        const a = (k / TICKS) * Math.PI * 2;
        const major = k % majorEvery === 0;
        const inner = major ? 4.95 : 4.78;
        const outer = major ? 5.6 : 5.15;
        tickPts.push(
          Math.cos(a) * inner, Math.sin(a) * inner, 0,
          Math.cos(a) * outer, Math.sin(a) * outer, 0
        );
      }
      const tickGeo = new THREE.BufferGeometry();
      tickGeo.setAttribute("position", new THREE.Float32BufferAttribute(tickPts, 3));
      const ticks = new THREE.LineSegments(
        tickGeo,
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.3 })
      );
      ticks.position.copy(pos);
      ticks.quaternion.copy(ring.quaternion);

      rings.forEach((m) => gateGroup.add(m));
      gateGroup.add(halo, ticks);
      gates.push({ rings, halo, ticks, t });
    });

    /* ---------- the field: noise into signal ---------- */
    const COUNT = isMobile ? 700 : 1400;
    const aChaos = new Float32Array(COUNT * 3);
    const aOrder = new Float32Array(COUNT * 3);
    const aCenter = new Float32Array(COUNT * 3);
    const aSeed = new Float32Array(COUNT);
    // Where along the corridor this particle belongs. Drives local resolve:
    // a particle crystallises when the camera reaches its station, not when
    // a global scroll ramp says so.
    const aT = new Float32Array(COUNT);

    const RINGS = 90;
    for (let i = 0; i < COUNT; i++) {
      const seed = Math.random();
      aSeed[i] = seed;

      // Ordered target: a ring around the axis, snapped to a discrete
      // station so the resolved state reads as structure, not a tube.
      const ringIdx = Math.floor((i / COUNT) * RINGS);
      const t = (ringIdx + 0.5) / RINGS;
      aT[i] = t;
      const center = sampleAt(t, _v.clone());
      const fi = Math.min(FRAMES - 1, Math.floor(t * FRAMES));
      const nrm = frames.normals[fi];
      const bnm = frames.binormals[fi];
      const ang = (i % 18) * ((Math.PI * 2) / 18) + ringIdx * 0.22;
      const rad = 6.4 + (seed - 0.5) * 1.1;

      aCenter[i * 3] = center.x;
      aCenter[i * 3 + 1] = center.y;
      aCenter[i * 3 + 2] = center.z;

      aOrder[i * 3] = center.x + (nrm.x * Math.cos(ang) + bnm.x * Math.sin(ang)) * rad;
      aOrder[i * 3 + 1] = center.y + (nrm.y * Math.cos(ang) + bnm.y * Math.sin(ang)) * rad;
      aOrder[i * 3 + 2] = center.z + (nrm.z * Math.cos(ang) + bnm.z * Math.sin(ang)) * rad;

      // Chaotic origin: same corridor, no structure whatsoever.
      const ct = Math.random();
      const cc = sampleAt(ct, _v.clone());
      const ca = Math.random() * Math.PI * 2;
      const cr = 2 + Math.random() * 13;
      aChaos[i * 3] = cc.x + Math.cos(ca) * cr;
      aChaos[i * 3 + 1] = cc.y + Math.sin(ca) * cr;
      aChaos[i * 3 + 2] = cc.z + (Math.random() - 0.5) * 26;
    }

    const fieldGeo = new THREE.BufferGeometry();
    // `position` must exist for bounds machinery; chaos is the authoritative
    // start, so alias it.
    fieldGeo.setAttribute("position", new THREE.BufferAttribute(aChaos, 3));
    fieldGeo.setAttribute("aOrder", new THREE.BufferAttribute(aOrder, 3));
    fieldGeo.setAttribute("aCenter", new THREE.BufferAttribute(aCenter, 3));
    fieldGeo.setAttribute("aSeed", new THREE.BufferAttribute(aSeed, 1));
    fieldGeo.setAttribute("aT", new THREE.BufferAttribute(aT, 1));

    const fieldMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: DPR },
        uProgress: { value: 0 },
        // Path position of the nearest gate and how lit it currently is, so
        // the slice of field around a gate ignites on the same frame the
        // ring does instead of the ring lighting up alone.
        uGateT: { value: 0 },
        uIgnite: { value: 0 },
        uCollapse: { value: 0 },
        uSpeed: { value: 0 },
      },
      vertexShader: `
        attribute vec3 aOrder;
        attribute vec3 aCenter;
        attribute float aSeed;
        attribute float aT;
        uniform float uTime;
        uniform float uPixelRatio;
        uniform float uProgress;
        uniform float uGateT;
        uniform float uIgnite;
        uniform float uCollapse;
        uniform float uSpeed;
        varying float vResolve;
        varying float vSeed;
        varying float vFog;
        varying float vPulse;

        void main() {
          vSeed = aSeed;

          // Local crystallisation.
          //
          // This used to be a single global ramp: the whole field resolved on
          // scroll position regardless of where a particle sat in the
          // corridor, so arriving at a gate did nothing to the space around
          // it. The wavefront now travels with the camera. Everything behind
          // you is structure, everything far ahead is still static, and the
          // band between the two is where the signal is actively locking in.
          //
          // LEAD puts the wavefront slightly ahead of the camera so you fly
          // into formed structure rather than watching it assemble on your
          // face. BAND is how long the transition takes in path units.
          float lead = 0.06;
          float band = 0.20;
          float local = clamp((uProgress + lead - aT) / band, 0.0, 1.0);

          // Seed stagger keeps the wavefront ragged rather than a clean
          // sweeping plane.
          float r = clamp((local - aSeed * 0.25) / 0.75, 0.0, 1.0);
          r = smoothstep(0.0, 1.0, r);
          vResolve = r;

          // Gate sympathy. Particles sitting in the same slice of corridor as
          // the active gate swell and warm with it, so passing a channel
          // ignites its own section of the field.
          float gd = abs(aT - uGateT);
          vPulse = uIgnite * (1.0 - smoothstep(0.0, 0.045, gd));

          vec3 p = mix(position, aOrder, r);

          // Jitter is the visual signature of noise. It damps to nothing
          // as the particle resolves.
          float j = (1.0 - r) * 1.5;
          p.x += sin(uTime * 1.9 + aSeed * 41.0) * j;
          p.y += cos(uTime * 2.3 + aSeed * 27.0) * j;
          p.z += sin(uTime * 1.4 + aSeed * 13.0) * j * 0.7;

          // Resolved particles keep a slow breathing drift so the ordered
          // state is calm, not frozen.
          p.x += sin(uTime * 0.3 + aSeed * 6.28) * 0.3 * r;
          p.y += cos(uTime * 0.25 + aSeed * 6.28) * 0.3 * r;

          // Endgame: the structure collapses onto its own axis.
          p = mix(p, aCenter, uCollapse);

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vFog = clamp((-mv.z - 20.0) / 105.0, 0.0, 1.0);
          gl_Position = projectionMatrix * mv;

          // Unclamped, this ran from sub-pixel in the distance to fat blobs
          // up close. Sub-pixel points alias into hard specks, which is why
          // the far field read as dirt on the screen rather than signal.
          float sz = 1.0 + aSeed * 1.6 + r * 1.4 + uSpeed * 3.0 + vPulse * 2.2;
          gl_PointSize = clamp(
            sz * uPixelRatio * (16.0 / max(-mv.z, 1.0)),
            1.0 * uPixelRatio,
            7.0 * uPixelRatio
          );
        }
      `,
      fragmentShader: `
        varying float vResolve;
        varying float vSeed;
        varying float vFog;
        varying float vPulse;

        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          if (d > 0.5) discard;

          // Dead static grey into brand colour as the signal locks in.
          vec3 noise = vec3(0.68, 0.71, 0.75);
          vec3 slate = vec3(0.184, 0.365, 0.486);
          vec3 sky   = vec3(0.494, 0.784, 0.890);
          vec3 sand  = vec3(0.851, 0.725, 0.541);

          vec3 tuned = mix(slate, sky, smoothstep(0.15, 0.85, vSeed));
          tuned = mix(tuned, sand, step(0.9, vSeed) * 0.85);
          vec3 col = mix(noise, tuned, vResolve);
          // Lift toward sand at the active gate so the ignited slice reads
          // warm against the surrounding cool field.
          col = mix(col, sand, vPulse * 0.45);

          // Softer falloff so a point is a glow rather than a disc with a
          // visible rim, and unresolved noise sits back further.
          float core = 1.0 - smoothstep(0.0, 0.5, d);
          float a = core * (1.0 - vFog) * (0.18 + vResolve * 0.62 + vPulse * 0.3);
          gl_FragColor = vec4(col, a);
        }
      `,
    });

    const field = new THREE.Points(fieldGeo, fieldMat);
    field.frustumCulled = false;
    scene.add(field);

    /* ---------- scroll driver: polled in-frame ---------- */
    function readProgress(): number {
      if (corridorProgress.live) {
        return Math.max(0, Math.min(1, corridorProgress.value));
      }
      const doc = document.scrollingElement || document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      if (max <= 0) return 0;
      return Math.max(0, Math.min(1, doc.scrollTop / max));
    }

    const scrollRef = { current: readProgress(), prev: readProgress() };
    let speed = 0;

    /* ---------- pointer parallax ---------- */
    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
    function onMove(e: PointerEvent) {
      ptr.tx = (e.clientX / window.innerWidth) * 2 - 1;
      ptr.ty = -(e.clientY / window.innerHeight) * 2 + 1;
    }
    if (!isMobile) window.addEventListener("pointermove", onMove, { passive: true });

    let resizeTimer = 0;
    function applySize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }
    function onResize() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(applySize, 120);
    }
    window.addEventListener("resize", onResize);

    /* ---------- context loss and restore ---------- */
    let contextLost = false;
    // The shared frame bus owns the loop now, so context loss simply gates
    // the tick rather than starting and stopping a private rAF.
    function onContextLost(e: Event) {
      e.preventDefault();
      contextLost = true;
    }
    function onContextRestored() {
      contextLost = false;
      fieldMat.uniforms.uPixelRatio.value = DPR;
      fieldMat.needsUpdate = true;
      applySize();
      clock.getDelta();
    }
    canvas.addEventListener("webglcontextlost", onContextLost, false);
    canvas.addEventListener("webglcontextrestored", onContextRestored, false);

    // The frame bus already stops the loop when the tab hides. All that is
    // left here is swallowing the delta that accumulated while away, so the
    // camera does not jump on return.
    function onVisibility() {
      if (!document.hidden) clock.getDelta();
    }
    document.addEventListener("visibilitychange", onVisibility);

    /* ---------- loop ---------- */

    /**
     * Frame rate independent damping.
     *
     * `x += (target - x) * k` moves a fixed fraction of the remaining
     * distance per frame, so on a 120Hz panel it converges twice as fast as
     * on 60Hz and on a loaded 30fps frame it crawls. The camera literally
     * had a different feel per display. This converts the per frame
     * coefficient into a per second one, so the curve is identical at any
     * refresh rate.
     */
    function damp(current: number, target: number, k: number, dt: number) {
      return current + (target - current) * (1 - Math.pow(1 - k, dt * 60));
    }

    const clock = new THREE.Clock();
    const lookTarget = new THREE.Vector3();
    const camPos = new THREE.Vector3();
    let frameCount = 0;

    // Widened reach and a much earlier cut out. A gate that is still drawing
    // at 0.018 from the camera is a hoop the width of the screen sitting on
    // top of the copy. It now fades out well before it engulfs the view.
    const REACH = 0.13;
    const PEAK = 0.06;
    const THROUGH = 0.032;

    function tick() {
      if (contextLost) return;
      const dt = Math.max(0.001, Math.min(0.05, clock.getDelta()));
      const time = clock.getElapsedTime();

      const target = readProgress();
      scrollRef.current = damp(scrollRef.current, target, 0.075, dt);
      const s = Math.max(0, Math.min(0.985, scrollRef.current * 0.92));

      // Scroll velocity into acceleration cues. Smoothed hard, because raw
      // per frame delta is far too spiky to drive optics with.
      const raw = Math.abs(scrollRef.current - scrollRef.prev) / dt;
      speed = damp(speed, Math.min(1, raw * 1.6), 0.12, dt);
      scrollRef.prev = scrollRef.current;

      // Resolve tracks progress slightly ahead of the camera so structure
      // has already formed by the time you arrive in it.
      const resolve = Math.min(1, Math.pow(Math.min(1, s * 1.25), 0.85));
      const collapse = Math.max(0, Math.min(1, (s - 0.82) / 0.16));

      fieldMat.uniforms.uTime.value = time;
      fieldMat.uniforms.uProgress.value = s;
      fieldMat.uniforms.uCollapse.value = collapse * collapse;
      fieldMat.uniforms.uSpeed.value = speed;

      armMat.opacity = 0.025 + resolve * 0.055;

      // Spine reveals in lockstep with the DOM progress rail.
      const revealed = Math.max(2, Math.floor(scrollRef.current * SPINE));
      spineGeo.setDrawRange(0, revealed);
      spineMat.opacity = 0.28 + speed * 0.4;

      ptr.x = damp(ptr.x, ptr.tx, 0.05, dt);
      ptr.y = damp(ptr.y, ptr.ty, 0.05, dt);

      sampleAt(s, camPos);
      camera.position.set(
        camPos.x + ptr.x * 1.6,
        camPos.y + ptr.y * 1.1,
        camPos.z
      );
      sampleAt(s + 0.035, lookTarget);
      camera.lookAt(lookTarget);
      camera.rotation.z =
        Math.sin(time * 0.12) * 0.03 + ptr.x * 0.04 + speed * 0.05;

      // FOV punch on fast scroll, the cheapest convincing sense of speed.
      const wantFov = BASE_FOV + speed * 11;
      if (Math.abs(camera.fov - wantFov) > 0.01) {
        camera.fov = damp(camera.fov, wantFov, 0.15, dt);
        camera.updateProjectionMatrix();
      }

      for (let i = 0; i < gates.length; i++) {
        const g = gates[i];
        const dist = Math.abs(g.t - s);
        const approach = 1 - Math.min(1, Math.max(0, dist - PEAK) / (REACH - PEAK));
        const passing = Math.min(1, Math.max(0, dist - THROUGH) / (PEAK - THROUGH));
        const ignite = approach * (dist < PEAK ? passing : 1);

        // Every ring in a gate shares one material, so this is a single
        // write regardless of how many concentric rings the channel has.
        (g.rings[0].material as THREE.MeshBasicMaterial).opacity =
          0.05 + ignite * 0.5;
        (g.halo.material as THREE.MeshBasicMaterial).opacity = ignite * ignite * 0.16;
        (g.ticks.material as THREE.LineBasicMaterial).opacity = 0.03 + ignite * 0.34;

        const sc = 1 + ignite * 0.06;
        for (let k = 0; k < g.rings.length; k++) {
          // Inner rings counter-rotate a touch, so an igniting gate reads as
          // an aperture opening rather than a decal fading up.
          g.rings[k].scale.setScalar(sc);
          g.rings[k].rotation.z = time * (k % 2 === 0 ? 0.06 : -0.09) * (0.4 + ignite);
        }
        g.halo.scale.setScalar(sc * 1.06);
        g.ticks.rotation.z = time * (0.12 + ignite * 0.5);
      }

      // Publish for the HUD. Nearest gate wins, with its ignition strength,
      // so the rail can pulse at the same instant the ring lights up.
      let bestGate = 0;
      let bestIgnite = 0;
      for (let i = 0; i < gates.length; i++) {
        const dd = Math.abs(gates[i].t - s);
        const ig = 1 - Math.min(1, dd / REACH);
        if (ig > bestIgnite) {
          bestIgnite = ig;
          bestGate = i;
        }
      }
      // The eased value, not the raw scroll target. The rail and the camera
      // are meant to be the same instrument, so the rail follows where the
      // camera actually is rather than where it is heading.
      corridorState.progress = scrollRef.current;
      corridorState.resolve = resolve;
      corridorState.collapse = collapse;
      corridorState.speed = speed;
      corridorState.gate = bestGate;
      corridorState.ignite = bestIgnite;

      fieldMat.uniforms.uGateT.value = gates[bestGate].t;
      fieldMat.uniforms.uIgnite.value = bestIgnite;

      renderer.render(scene, camera);

      frameCount++;
      // Gated. This used to run unconditionally, so the page took a React
      // state update four times a second on every visit whether or not
      // anyone was looking at the readout.
      if (showDebug && frameCount % 15 === 0) {
        setDebugLine(
          `${canvas.width}x${canvas.height} p=${target.toFixed(3)} ` +
            `z=${camera.position.z.toFixed(1)} res=${resolve.toFixed(2)} ` +
            `spd=${speed.toFixed(2)} col=${collapse.toFixed(2)}`
        );
      }
    }

    applySize();
    corridorState.live = true;
    const offFrame = onFrame(tick);

    return () => {
      corridorState.live = false;
      offFrame();
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      if (!isMobile) window.removeEventListener("pointermove", onMove);
      ringGeos.forEach((g) => g.dispose());
      haloGeo.dispose();
      gates.forEach((g) => {
        (g.rings[0].material as THREE.Material).dispose();
        (g.halo.material as THREE.Material).dispose();
        (g.ticks.material as THREE.Material).dispose();
        g.ticks.geometry.dispose();
      });
      armGeo.dispose();
      armMat.dispose();
      spineGeo.dispose();
      spineMat.dispose();
      fieldGeo.dispose();
      fieldMat.dispose();
      renderer.dispose();
      if (canvas.parentNode === mount) mount.removeChild(canvas);
      bootedRef.current = false;
    };
  }, [reducedMotion, showDebug]);

  return (
    <>
      <div
        ref={mountRef}
        className="fixed inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          zIndex: 0,
          background:
            "radial-gradient(ellipse 75% 60% at 50% 40%, rgba(126,200,227,0.16) 0%, transparent 68%), #ffffff",
        }}
      />
      {/* Directional legibility scrim.
          Clear where the corridor is worth looking at, white where the copy
          is. The first version was symmetric, which meant that on a left
          aligned stage it spent half its opacity veiling the right hand side
          where there was nothing to protect, while dimming corridor you
          actually wanted to see.

          It now slides. app/page.tsx sets --scrim-shift from whichever stage
          is in view, pushing the clear window away from the copy column. The
          element is deliberately wider than the viewport so translating it
          never exposes an unveiled edge, and it moves on transform rather
          than by re-centring the gradient, because gradient positions do not
          interpolate and transforms do.

          Sits at z-index 1, under the page content at 2. */}
      <div
        className="fixed pointer-events-none scrim"
        aria-hidden="true"
        style={{
          zIndex: 1,
          top: 0,
          bottom: 0,
          left: "-30vw",
          right: "-30vw",
          background:
            "radial-gradient(ellipse 34% 64% at 50% 48%," +
            " rgba(255,255,255,0) 0%," +
            " rgba(255,255,255,0.5) 56%," +
            " rgba(255,255,255,0.88) 100%)",
        }}
      />
      {showDebug && (
        <div
          className="fixed bottom-2 left-2 pointer-events-none"
          style={{
            zIndex: 9999,
            background: "rgba(9,18,28,0.9)",
            color: "#7EC8E3",
            font: "11px/1.5 ui-monospace, monospace",
            padding: "6px 9px",
            borderRadius: "6px",
            maxWidth: "94vw",
          }}
        >
          corridor: {status}
          {debugLine ? <><br />{debugLine}</> : null}
        </div>
      )}
    </>
  );
}
