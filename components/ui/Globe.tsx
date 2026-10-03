"use client";
import { useEffect, useRef } from "react";
import { bindPointer, pointer, prefersReducedMotion } from "@/lib/pointer";

/**
 * Globo/órbita wireframe em Canvas 2D — leve, sem Three.js.
 * - rotação extremamente lenta + inclinação guiada pelo cursor
 * - órbitas independentes (cada uma precessa no próprio eixo) com nodes percorrendo
 * - parallax de profundidade: esfera e órbitas deslocam em camadas diferentes
 * - `mode` muda o comportamento com transição suave (usado pelo main menu)
 * - pausa fora da viewport e com a aba oculta; clique = impulso de rotação
 */

export type GlobeMode = "idle" | "start" | "projects" | "services" | "about" | "lab" | "contact";

type Vec = [number, number, number];

const FG = "236,235,229";
const ACCENT = "255,90,31";
const MODES: GlobeMode[] = ["idle", "start", "projects", "services", "about", "lab", "contact"];

type Pt = { v: Vec; phi: number; th: number };

function ring(n: number, fn: (t: number) => Vec): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const v = fn((i / n) * Math.PI * 2);
    pts.push({ v, phi: Math.asin(Math.max(-1, Math.min(1, v[1]))), th: Math.atan2(v[2], v[0]) });
  }
  return pts;
}

function buildSphere() {
  const lines: Pt[][] = [];
  for (let lat = -60; lat <= 60; lat += 30) {
    const phi = (lat * Math.PI) / 180;
    const r = Math.cos(phi), y = Math.sin(phi);
    lines.push(ring(80, (t) => [Math.cos(t) * r, y, Math.sin(t) * r]));
  }
  for (let m = 0; m < 6; m++) {
    const th = (m / 6) * Math.PI;
    lines.push(ring(80, (t) => [Math.cos(t) * Math.cos(th), Math.sin(t), Math.cos(t) * Math.sin(th)]));
  }
  return lines;
}

const rotX = (p: Vec, a: number): Vec => {
  const c = Math.cos(a), s = Math.sin(a);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
};
const rotY = (p: Vec, a: number): Vec => {
  const c = Math.cos(a), s = Math.sin(a);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
};
const rotZ = (p: Vec, a: number): Vec => {
  const c = Math.cos(a), s = Math.sin(a);
  return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
};

// Cada órbita: raio, inclinação, precessão própria e nodes que a percorrem.
const ORBITS = [
  { r: 1.34, ax: 1.18, az: 0.35, prec: 0.05, nodes: [{ ph: 0, sp: 0.42, accent: true }] },
  { r: 1.58, ax: 1.4, az: -0.55, prec: -0.035, nodes: [{ ph: 2, sp: -0.26 }, { ph: 4.6, sp: -0.26 }] },
  { r: 1.82, ax: 0.35, az: 1.2, prec: 0.022, nodes: [{ ph: 1, sp: 0.16 }] },
];

function latLon(lat: number, lon: number): Vec {
  const phi = (lat * Math.PI) / 180, th = (lon * Math.PI) / 180;
  return [Math.cos(phi) * Math.cos(th), Math.sin(phi), Math.cos(phi) * Math.sin(th)];
}

// Brasil + nós de rede
const NODES: Vec[] = [latLon(-15, -47), latLon(40, 10), latLon(35, 139), latLon(40, -74), latLon(-33, 151)];
const ARCS: [number, number][] = [[0, 1], [0, 3], [1, 2], [2, 4], [3, 1]];

function arcPoints(a: Vec, b: Vec, n = 40): Vec[] {
  const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const om = Math.acos(Math.max(-1, Math.min(1, dot)));
  const pts: Vec[] = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    const k1 = Math.sin((1 - s) * om) / Math.sin(om), k2 = Math.sin(s * om) / Math.sin(om);
    const lift = 1 + 0.22 * Math.sin(Math.PI * s);
    pts.push([(a[0] * k1 + b[0] * k2) * lift, (a[1] * k1 + b[1] * k2) * lift, (a[2] * k1 + b[2] * k2) * lift]);
  }
  return pts;
}
const ARC_PTS = ARCS.map(([a, b]) => arcPoints(NODES[a], NODES[b]));

export default function Globe({
  className,
  energy = 1,
  interactive = true,
  showOrbits = true,
  mode = "idle",
  depth = 1,
}: {
  className?: string;
  energy?: number;
  interactive?: boolean;
  showOrbits?: boolean;
  mode?: GlobeMode;
  depth?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useRef({ energy, mode, depth });
  live.current = { energy, mode, depth };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    bindPointer();

    const reduced = prefersReducedMotion();
    const sphere = buildSphere();
    const weight: Record<GlobeMode, number> = { idle: 1, start: 0, projects: 0, services: 0, about: 0, lab: 0, contact: 0 };

    let w = 0, h = 0, dpr = 1, raf = 0, visible = true, last = performance.now();
    let spinAngle = 0.6, spinVel = 0, tilt = 0.3, yawOff = 0, time = 0, energyNow = 1;
    let px = 0, py = 0; // parallax suavizado

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      draw();
    };

    // projeção: rotação do globo → perspectiva leve → deslocamento de camada (parallax)
    const project = (p: Vec, R: number, layer: number): [number, number, number] => {
      let q = rotY(p, spinAngle + yawOff);
      q = rotX(q, tilt);
      const k = 7 / (7 - q[2]);
      return [w / 2 + q[0] * R * k + px * layer, h / 2 - q[1] * R * k + py * layer, q[2]];
    };

    const stroke = (paths: Vec[][], R: number, layer: number, front: string, back: string, dashedBack = false) => {
      const fp = new Path2D(), bp = new Path2D();
      for (const line of paths) {
        let prev = project(line[0], R, layer);
        for (let i = 1; i < line.length; i++) {
          const cur = project(line[i], R, layer);
          const path = prev[2] + cur[2] > 0 ? fp : bp;
          path.moveTo(prev[0], prev[1]);
          path.lineTo(cur[0], cur[1]);
          prev = cur;
        }
      }
      ctx.lineWidth = 1;
      if (dashedBack) ctx.setLineDash([2, 4]);
      ctx.strokeStyle = back;
      ctx.stroke(bp);
      ctx.setLineDash([]);
      ctx.strokeStyle = front;
      ctx.stroke(fp);
    };

    const dot = (p: [number, number, number], r: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p[0], p[1], r, 0, Math.PI * 2);
      ctx.fill();
    };

    function draw() {
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w, h) * (showOrbits ? 0.235 : 0.44);
      const lab = weight.lab, svc = weight.services, contact = weight.contact, start = weight.start;
      const e = energyNow;

      // esfera — no LAB ela se deforma em ondas (mais experimental)
      const morphed: Vec[][] = sphere.map((line) =>
        line.map(({ v, phi, th }) => {
          if (lab < 0.01) return v;
          const d = 1 + lab * 0.17 * Math.sin(4 * phi + time * 1.4) * Math.cos(3 * th - time * 0.9);
          return [v[0] * d, v[1] * d, v[2] * d];
        })
      );
      const frontA = 0.4 + start * 0.15 + e * 0.04;
      stroke(morphed, R, 1, `rgba(${FG},${frontA})`, `rgba(${FG},${0.07 + lab * 0.08})`, lab > 0.4);

      if (showOrbits) {
        // órbitas independentes: cada uma com precessão própria
        const orbitPaths: Vec[][] = [];
        const orbitFrames = ORBITS.map((o, i) => {
          const az = o.az + time * o.prec * (1 + lab * 3);
          const r = o.r * (1 + lab * 0.12 * (i + 1) * 0.5) * (1 + start * 0.04);
          return { az, r, ax: o.ax + lab * 0.3 * Math.sin(time * 0.5 + i) };
        });
        orbitFrames.forEach((f) => {
          const pts: Vec[] = [];
          for (let k = 0; k <= 120; k++) {
            const t = (k / 120) * Math.PI * 2;
            pts.push(rotZ(rotX([Math.cos(t) * f.r, 0, Math.sin(t) * f.r], f.ax), f.az));
          }
          orbitPaths.push(pts);
        });
        stroke(orbitPaths, R, 1.8, `rgba(${FG},${0.26 + start * 0.1})`, `rgba(${FG},0.06)`);

        // nodes percorrendo as órbitas
        ORBITS.forEach((o, i) => {
          const f = orbitFrames[i];
          o.nodes.forEach((n) => {
            const t = n.ph + time * n.sp * (0.7 + e * 0.3) * (1 + lab);
            const p = project(rotZ(rotX([Math.cos(t) * f.r, 0, Math.sin(t) * f.r], f.ax), f.az), R, 1.8);
            const front = p[2] > 0;
            if ("accent" in n && n.accent) dot(p, 2.8, `rgba(${ACCENT},${front ? 1 : 0.4})`);
            else dot(p, 1.8, `rgba(${FG},${front ? 0.9 : 0.25})`);
          });
        });
      }

      // SERVIÇOS: rede conectando nós, com pacotes em trânsito
      if (svc > 0.01) {
        stroke(ARC_PTS, R, 1, `rgba(${ACCENT},${0.55 * svc})`, `rgba(${ACCENT},${0.12 * svc})`);
        ARC_PTS.forEach((arc, i) => {
          const s = (time * 0.35 + i * 0.23) % 1;
          const p = project(arc[Math.floor(s * (arc.length - 1))], R, 1);
          if (p[2] > 0) dot(p, 1.6, `rgba(${FG},${svc})`);
        });
      }

      // nós na superfície (Brasil em destaque)
      NODES.forEach((n, i) => {
        if (i > 2 && svc < 0.05) return;
        const p = project(n, R, 1);
        if (p[2] < 0) return;
        const pulse = 0.5 + 0.5 * Math.sin(time * 2 + i);
        dot(p, i === 0 ? 2 : 1.6, i === 0 ? `rgba(${ACCENT},0.95)` : `rgba(${FG},0.75)`);
        if (i === 0) {
          const amp = 9 + contact * 16;
          ctx.strokeStyle = `rgba(${ACCENT},${(0.45 + contact * 0.4) * (1 - pulse)})`;
          ctx.beginPath();
          ctx.arc(p[0], p[1], 3 + pulse * amp, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
    }

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      time += dt;
      const { mode, energy, depth } = live.current;
      for (const m of MODES) weight[m] += ((m === mode ? 1 : 0) - weight[m]) * Math.min(1, dt * 4);
      energyNow += (energy - energyNow) * Math.min(1, dt * 3);

      // rotação extremamente lenta; energia e impulso somam velocidade
      if (!reduced) spinAngle += dt * (0.035 + (energyNow - 1) * 0.25 + weight.lab * 0.08) + spinVel * dt;
      spinVel *= Math.pow(0.2, dt);
      const tx = interactive ? 0.3 + pointer.ny * 0.3 : 0.3;
      const ty = interactive ? pointer.nx * 0.55 : 0;
      tilt += (tx - tilt) * Math.min(1, dt * 2.5);
      yawOff += (ty - yawOff) * Math.min(1, dt * 2.5);
      const tpx = interactive ? pointer.nx * 5 * depth : 0;
      const tpy = interactive ? pointer.ny * 5 * depth : 0;
      px += (tpx - px) * Math.min(1, dt * 3);
      py += (tpy - py) * Math.min(1, dt * 3);
      draw();
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      cancelAnimationFrame(raf);
      if (visible && !document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    });
    io.observe(canvas);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    document.addEventListener("visibilitychange", start);
    const burst = () => (spinVel += 7);
    canvas.addEventListener("click", burst);
    resize();
    start();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", start);
      canvas.removeEventListener("click", burst);
    };
  }, [interactive, showOrbits]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" data-cursor-label="SPIN" />;
}
