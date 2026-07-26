"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { SERVICES } from "@/lib/services";

/**
 * OrbitalTrack — Three.js progress visualization.
 * A glowing signal-sphere travels along a curved 3D tube path,
 * passing through one waypoint node per service. Distinct from
 * SignalRings (flat SVG) and from any particle-morph mechanism:
 * this is a single traveling object on a fixed curve.
 */
export function OrbitalTrack({ progress }: { progress: number }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }

    const W = mount.clientWidth || 320;
    const H = mount.clientHeight || 56;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, 0.1, 100);
    camera.position.z = 20;

    const N = SERVICES.length;
    const margin = 28;
    const pathW = W - margin * 2;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const x = -pathW / 2 + t * pathW;
      const y = Math.sin(t * Math.PI * 2.5) * (H * 0.22);
      points.push(new THREE.Vector3(x, y, 0));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeo = new THREE.TubeGeometry(curve, 120, 1.1, 8, false);
    const tubeMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#B6C7D6"),
      transparent: true,
      opacity: 0.4,
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    scene.add(tube);

    const litTubeMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#7EC8E3"),
      transparent: true,
      opacity: 0.15,
    });
    const litTube = new THREE.Mesh(tubeGeo, litTubeMat);
    litTube.scale.setScalar(1.001);
    scene.add(litTube);

    const nodeGeo = new THREE.SphereGeometry(3.4, 16, 16);
    const nodes: THREE.Mesh[] = [];
    const nodeColors = SERVICES.map((s) => new THREE.Color(s.tone));
    for (let i = 0; i < N; i++) {
      const t = (i + 0.5) / N;
      const pos = curve.getPointAt(t);
      const mat = new THREE.MeshBasicMaterial({ color: nodeColors[i], transparent: true, opacity: 0.35 });
      const mesh = new THREE.Mesh(nodeGeo, mat);
      mesh.position.copy(pos);
      scene.add(mesh);
      nodes.push(mesh);
    }

    const sphereGeo = new THREE.SphereGeometry(5, 20, 20);
    const sphereMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#2F5D7C") });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphere);

    const glowGeo = new THREE.SphereGeometry(9, 20, 20);
    const glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#7EC8E3"),
      transparent: true,
      opacity: 0.35,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glow);

    function onResize() {
      const w = mount.clientWidth || 320;
      const h = mount.clientHeight || 56;
      renderer.setSize(w, h);
      camera.left = -w / 2;
      camera.right = w / 2;
      camera.top = h / 2;
      camera.bottom = -h / 2;
      camera.updateProjectionMatrix();
    }
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    let raf = 0;
    let displayed = 0;
    function tick() {
      const target = Math.max(0, Math.min(1, progressRef.current));
      displayed += (target - displayed) * (reduced ? 1 : 0.12);

      const pos = curve.getPointAt(Math.max(0.0001, Math.min(0.9999, displayed)));
      sphere.position.copy(pos);
      glow.position.copy(pos);

      nodes.forEach((n, i) => {
        const t = (i + 0.5) / N;
        const passed = displayed >= t - 0.02;
        const mat = n.material as THREE.MeshBasicMaterial;
        mat.opacity += ((passed ? 1 : 0.35) - mat.opacity) * 0.15;
        const s = passed ? 1.25 : 1;
        n.scale.setScalar(n.scale.x + (s - n.scale.x) * 0.15);
      });

      litTubeMat.opacity = 0.15 + displayed * 0.75;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      tubeGeo.dispose();
      tubeMat.dispose();
      litTubeMat.dispose();
      nodeGeo.dispose();
      nodes.forEach((n) => (n.material as THREE.Material).dispose());
      sphereGeo.dispose();
      sphereMat.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full" aria-hidden="true" />;
}
