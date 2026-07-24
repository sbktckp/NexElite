"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export interface TapeItem {
  label: string;
  category: string;
  color: string;
}

const DEFAULT_ITEMS: TapeItem[] = [
  { label: "Project Alpha", category: "Brand campaign", color: "#2F5D7C" },
  { label: "Project Bravo", category: "Short-form reel", color: "#7EC8E3" },
  { label: "Project Charlie", category: "Photography", color: "#2F5D7C" },
  { label: "Project Delta", category: "Social strategy", color: "#7EC8E3" },
  { label: "Project Echo", category: "Product launch", color: "#2F5D7C" },
  { label: "Project Foxtrot", category: "Motion design", color: "#7EC8E3" },
  { label: "Project Golf", category: "Documentary", color: "#2F5D7C" },
  { label: "Project Hotel", category: "Event coverage", color: "#7EC8E3" },
];

function makeCardTexture(item: TapeItem, index: number): THREE.CanvasTexture {
  const W = 640;
  const H = 400;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d")!;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(47,93,124,0.16)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, W - 2, H - 2);

  ctx.fillStyle = item.color;
  ctx.fillRect(0, 0, W, 10);

  ctx.font = "700 22px 'Space Mono', monospace";
  ctx.fillStyle = "rgba(47,93,124,0.45)";
  ctx.fillText(`REEL·${String(index + 1).padStart(2, "0")}`, 28, 56);

  ctx.font = "800 42px 'Bricolage Grotesque', sans-serif";
  ctx.fillStyle = "#2F5D7C";
  wrapText(ctx, item.label, 28, 190, W - 56, 46);

  ctx.font = "400 20px 'Space Mono', monospace";
  ctx.fillStyle = item.color;
  ctx.fillText(item.category.toUpperCase(), 28, H - 34);

  const barsY = H - 14;
  const barW = (W - 56) / 7;
  const cols = ["#2F5D7C", "#7EC8E3", "#B6C7D6", "#EAF6FF", "#7EC8E3", "#2F5D7C", "#B6C7D6"];
  cols.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(28 + i * barW, barsY, barW - 3, 6);
  });

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  let cy = y;
  for (const w of words) {
    const test = line + w + " ";
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = w + " ";
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, cy);
}

export function TapeDrum({ items = DEFAULT_ITEMS }: { items?: TapeItem[] }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const rotationRef = useRef(0);
  const targetRotationRef = useRef(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      42,
      mount.clientWidth / mount.clientHeight,
      0.1,
      50
    );
    camera.position.set(0, 0, 6.4);

    const group = new THREE.Group();
    scene.add(group);

    const N = items.length;
    const radius = 4.1;
    const cardGeo = new THREE.PlaneGeometry(2.1, 1.31);
    const cards: THREE.Mesh[] = [];

    items.forEach((item, i) => {
      const tex = makeCardTexture(item, i);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        toneMapped: false,
      });
      const mesh = new THREE.Mesh(cardGeo, mat);
      const angle = (i / N) * Math.PI * 2;
      mesh.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius);
      mesh.lookAt(0, 0, 0);
      mesh.rotateY(Math.PI);
      group.add(mesh);
      cards.push(mesh);
    });

    const light = new THREE.AmbientLight(0xffffff, 1);
    scene.add(light);

    let dragging = false;
    let lastX = 0;
    let velocity = 0;
    let autoSpin = true;

    function pointerDown(e: PointerEvent) {
      dragging = true;
      autoSpin = false;
      lastX = e.clientX;
    }
    function pointerMove(e: PointerEvent) {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      velocity = dx * 0.005;
      targetRotationRef.current += velocity;
    }
    function pointerUp() {
      dragging = false;
    }

    const dom = renderer.domElement;
    dom.style.cursor = "grab";
    dom.addEventListener("pointerdown", (e) => {
      dom.style.cursor = "grabbing";
      pointerDown(e);
    });
    window.addEventListener("pointermove", pointerMove);
    window.addEventListener("pointerup", () => {
      dom.style.cursor = "grab";
      pointerUp();
    });

    function onWheel(e: WheelEvent) {
      autoSpin = false;
      targetRotationRef.current += e.deltaY * 0.0012;
    }
    dom.addEventListener("wheel", onWheel, { passive: true });

    function onResize() {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    }
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    let raf = 0;
    function tick() {
      if (autoSpin && !dragging) {
        targetRotationRef.current += 0.0016;
      }
      rotationRef.current +=
        (targetRotationRef.current - rotationRef.current) * 0.08;
      group.rotation.y = rotationRef.current;

      let bestIdx = 0;
      let bestZ = -Infinity;
      cards.forEach((c, i) => {
        const wp = new THREE.Vector3();
        c.getWorldPosition(wp);
        const s = 0.55 + 0.45 * Math.max(0, wp.z / radius);
        c.scale.setScalar(s);
        const mat = c.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.35 + 0.65 * Math.max(0, wp.z / radius);
        if (wp.z > bestZ) {
          bestZ = wp.z;
          bestIdx = i;
        }
      });
      setActive((prev) => (prev !== bestIdx ? bestIdx : prev));

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", pointerMove);
      cardGeo.dispose();
      cards.forEach((c) => (c.material as THREE.Material).dispose());
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [items]);

  return (
    <div className="relative w-full">
      <div ref={mountRef} className="w-full h-[440px] sm:h-[520px] touch-none" />
      <p className="text-center text-[10px] sm:text-[11px] tracking-[0.3em] uppercase mt-2" style={{ color: "var(--dim)" }}>
        Drag or scroll to browse — {items[active]?.label}
      </p>
    </div>
  );
}
