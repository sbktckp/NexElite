"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uMouseOn;
  uniform vec2 uRes;
  uniform float uGlitch;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= uRes.x / uRes.y;

    vec3 cyan = vec3(0.349, 0.890, 0.847);
    vec3 magenta = vec3(1.0, 0.302, 0.561);
    vec3 amber = vec3(1.0, 0.761, 0.294);
    vec3 ink = vec3(0.02, 0.024, 0.027);

    float mouseDist = length(p - uMouse);
    float mouseGlow = uMouseOn * smoothstep(0.9, 0.0, mouseDist);

    float n1 = noise(p * 3.0 + uTime * 0.05);
    float n2 = noise(p * 8.0 - uTime * 0.08);
    float grain = hash(uv * uRes.xy + uTime * 60.0) * 0.05;

    float bandY = uv.y * 40.0 + uTime * 2.0;
    float band = smoothstep(0.96, 1.0, sin(bandY) * 0.5 + 0.5) * 0.06;

    float vign = smoothstep(1.35, 0.2, length(p));

    vec3 col = ink;
    col += cyan * n1 * 0.045 * vign;
    col += magenta * n2 * 0.03 * vign;
    col += amber * mouseGlow * 0.12;
    col += cyan * mouseGlow * 0.08;
    col += grain * vign;
    col += band * vign;

    float sweepY = fract(uTime * 0.06);
    float sweep = smoothstep(0.0, 0.05, 0.05 - abs(uv.y - sweepY)) * 0.05;
    col += cyan * sweep;

    col += uGlitch * (vec3(n2, 1.0 - n2, n1) - 0.5) * 0.4;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function SignalField() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduced) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(10, 10) },
        uMouseOn: { value: isMobile ? 0 : 1 },
        uRes: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
        uGlitch: { value: 0 },
      },
    });

    const geo = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    const mouse = new THREE.Vector2(10, 10);
    function onMove(e: PointerEvent) {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      mouse.set(x * (window.innerWidth / window.innerHeight), y);
    }
    if (!isMobile) window.addEventListener("pointermove", onMove, { passive: true });

    function onResize() {
      renderer.setSize(window.innerWidth, window.innerHeight);
      mat.uniforms.uRes.value.set(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", onResize);

    function onGlitch() {
      mat.uniforms.uGlitch.value = 1;
      setTimeout(() => {
        mat.uniforms.uGlitch.value = 0;
      }, 180);
    }
    window.addEventListener("nx:glitch", onGlitch);

    let raf = 0;
    const clock = new THREE.Clock();
    function tick() {
      mat.uniforms.uTime.value = clock.getElapsedTime();
      mat.uniforms.uMouse.value.lerp(mouse, 0.08);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("nx:glitch", onGlitch);
      if (!isMobile) window.removeEventListener("pointermove", onMove);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0"
      style={{ zIndex: 0, background: "#050607" }}
    />
  );
}
