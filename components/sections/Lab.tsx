"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { LabEngine, type LabMode, type LabPointer } from "@/components/lab/LabEngine";
import LabType from "@/components/lab/LabType";
import { prefersReducedMotion } from "@/lib/pointer";
import styles from "./Lab.module.css";

const MODES: { id: LabMode; label: string }[] = [
  { id: "wave", label: "WAVE" },
  { id: "gravity", label: "GRAVITY" },
  { id: "type", label: "TYPE" },
];

const pad = (n: number, l = 4) => String(Math.max(0, Math.round(n))).padStart(l, "0");

/**
 * AM / EXPERIMENTAL LAB — playground interativo.
 * Uma ferramenta interna "descoberta" dentro do sistema: sem cards, sem texto longo.
 */
export default function Lab() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<LabEngine | null>(null);
  const pointer = useRef<LabPointer>({ x: 0, y: 0, vx: 0, vy: 0, inside: false, down: false }).current;
  const panel = useRef<Record<string, HTMLElement | null>>({});

  const [mode, setModeState] = useState<LabMode>("wave");
  const [visible, setVisible] = useState(false);
  const [inView, setInView] = useState(false);
  const [intro, setIntro] = useState<"pre" | "boot" | "title" | "ready">("pre");
  const [interacted, setInteracted] = useState(false);
  const [flash, setFlash] = useState(0);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  // ---------- motor ----------
  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const mobile = window.matchMedia("(pointer: coarse), (max-width: 720px)").matches;
    const cores = navigator.hardwareConcurrency || 4;
    const eng = new LabEngine(
      cv,
      pointer,
      {
        mobile,
        reduced: prefersReducedMotion(),
        density: mobile ? 700 : cores <= 4 ? 1700 : 2600,
        nodes: mobile ? 70 : 160,
      },
      (s, frame) => {
        if (frame % 4) return; // painel: ~15 atualizações/s bastam
        const P = panel.current;
        if (P.force) P.force.textContent = s.force.toFixed(2);
        if (P.radius) P.radius.textContent = String(s.radius);
        if (P.fps) P.fps.textContent = String(Math.round(Math.min(120, s.fps)));
        if (P.nodes) P.nodes.textContent = pad(s.nodes, 4);
        if (P.px) P.px.textContent = pointer.inside ? pad(pointer.x) : "----";
        if (P.py) P.py.textContent = pointer.inside ? pad(pointer.y) : "----";
      }
    );
    engine.current = eng;
    const ro = new ResizeObserver(() => eng.resize());
    ro.observe(cv);
    return () => {
      ro.disconnect();
      eng.stop();
      engine.current = null;
    };
  }, [pointer]);

  // roda só quando a seção está visível; teclado/entrada quando ela domina a tela
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setVisible(e.isIntersecting);
        setInView(e.intersectionRatio >= 0.45);
      },
      { threshold: [0, 0.45] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const eng = engine.current;
    if (!eng) return;
    const sync = () => (visible && !document.hidden ? eng.start() : eng.stop());
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [visible]);

  // ---------- entrada: AM / LAB → EXPERIMENTAL INTERFACE → DISTORT THE SYSTEM. ----------
  // a sequência roda uma vez; os timers só são cancelados ao desmontar
  // (oscilações de visibilidade durante o scroll não podem interrompê-la)
  const introTimers = useRef<number[]>([]);
  useEffect(() => () => introTimers.current.forEach(window.clearTimeout), []);
  useEffect(() => {
    if (!inView || intro !== "pre") return;
    if (prefersReducedMotion()) {
      engine.current?.boot();
      setIntro("ready");
      return;
    }
    setIntro("boot");
    introTimers.current = [
      window.setTimeout(() => engine.current?.boot(), 250),
      window.setTimeout(() => setIntro("title"), 650),
      window.setTimeout(() => setIntro("ready"), 1500),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  // ---------- modos ----------
  const setMode = useCallback((m: LabMode) => {
    if (m === modeRef.current) return;
    engine.current?.setMode(m);
    setModeState(m);
    setFlash((f) => f + 1);
  }, []);

  // teclado: 1/2/3, ← →, e "AM" (segredo)
  useEffect(() => {
    if (!inView) return;
    let buffer = "";
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,textarea") || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      const idx = MODES.findIndex((m) => m.id === modeRef.current);
      if (k === "1" || k === "2" || k === "3") setMode(MODES[Number(k) - 1].id);
      else if (k === "ArrowRight") setMode(MODES[(idx + 1) % 3].id);
      else if (k === "ArrowLeft") setMode(MODES[(idx + 2) % 3].id);
      else if (k.length === 1) {
        buffer = (buffer + k.toLowerCase()).slice(-2);
        if (buffer === "am") {
          engine.current?.formAM();
          buffer = "";
        }
        return;
      } else return;
      setInteracted(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inView, setMode]);

  // ---------- ponteiro (mouse e toque) ----------
  const local = (e: React.PointerEvent) => {
    const r = stage.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onMove = (e: React.PointerEvent) => {
    const { x, y } = local(e);
    if (pointer.inside) {
      pointer.vx = pointer.vx * 0.5 + (x - pointer.x) * 0.5;
      pointer.vy = pointer.vy * 0.5 + (y - pointer.y) * 0.5;
    }
    pointer.x = x;
    pointer.y = y;
    pointer.inside = true;
    if (!interacted && (Math.abs(pointer.vx) + Math.abs(pointer.vy) > 2 || pointer.down)) setInteracted(true);
  };
  const onDown = (e: React.PointerEvent) => {
    const { x, y } = local(e);
    pointer.x = x;
    pointer.y = y;
    pointer.vx = pointer.vy = 0;
    pointer.inside = true;
    pointer.down = true;
    stage.current?.setPointerCapture(e.pointerId);
    engine.current?.press(x, y);
    setInteracted(true);
  };
  const onUp = (e: React.PointerEvent) => {
    pointer.down = false;
    if (e.pointerType !== "mouse") pointer.inside = false;
  };
  const onLeave = () => {
    pointer.inside = false;
    pointer.down = false;
  };

  const current = MODES.findIndex((m) => m.id === mode);
  const setRef = (k: string) => (el: HTMLElement | null) => {
    panel.current[k] = el;
  };

  return (
    <section
      id="lab"
      ref={root}
      className={styles.section}
      data-intro={intro}
      data-interacted={interacted || undefined}
      data-mode={mode}
      aria-label="AM / LAB — interface experimental"
    >
      {/* área interativa */}
      <div
        ref={stage}
        className={styles.stage}
        onPointerMove={onMove}
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerLeave={onLeave}
      >
        <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />
        <LabType
          active={mode === "type"}
          visible={visible}
          pointer={pointer}
          onForce={(f) => {
            if (engine.current) engine.current.externalForce = f;
          }}
        />
      </div>

      {/* moldura técnica */}
      <span className={styles.frame} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>

      {/* entrada */}
      <div className={styles.intro} aria-hidden={intro === "ready" && interacted}>
        <p className={`mono ${styles.boot}`}>
          <span>AM / LAB</span>
          <span className="dim">EXPERIMENTAL INTERFACE</span>
        </p>
        <h2 className={styles.title}>
          <span className={styles.titleMask}>
            <span>DISTORT THE SYSTEM.</span>
          </span>
        </h2>
      </div>

      {/* topo esquerdo */}
      <div className={`mono ${styles.tl}`}>
        <span>04 — EXPERIMENTS</span>
        <span className="dim">AM / EXPERIMENTAL LAB</span>
      </div>

      {/* painel técnico */}
      <dl className={`mono ${styles.panel}`} aria-hidden="true">
        <div className={styles.panelHead}>
          <span>LAB / ACTIVE</span>
          <i />
        </div>
        <div>
          <dt>MODE</dt>
          <dd className="accent">{MODES[current].label}</dd>
        </div>
        <div>
          <dt>FORCE</dt>
          <dd ref={setRef("force")}>0.00</dd>
        </div>
        <div>
          <dt>RADIUS</dt>
          <dd ref={setRef("radius")}>170</dd>
        </div>
        <div className={styles.hideSm}>
          <dt>{mode === "gravity" ? "NODES" : "POINTS"}</dt>
          <dd ref={setRef("nodes")}>0000</dd>
        </div>
        <div>
          <dt>POINTER</dt>
          <dd>
            X <span ref={setRef("px")}>----</span> Y <span ref={setRef("py")}>----</span>
          </dd>
        </div>
        <div>
          <dt>FPS</dt>
          <dd ref={setRef("fps")}>60</dd>
        </div>
      </dl>

      {/* seletor de experimentos */}
      <nav className={`mono ${styles.selector}`} aria-label="Experimentos">
        <span className={styles.exp}>
          EXP / <b className="accent">{String(current + 1).padStart(2, "0")}</b>
        </span>
        <ul>
          {MODES.map((m, i) => (
            <li key={m.id}>
              <button
                onClick={() => {
                  setMode(m.id);
                  setInteracted(true);
                }}
                data-active={mode === m.id || undefined}
                aria-pressed={mode === m.id}
                data-cursor-label={`0${i + 1}`}
              >
                <span className={styles.br}>[</span>
                <span className={styles.num}>0{i + 1}</span>
                {m.label}
                <span className={styles.br}>]</span>
              </button>
            </li>
          ))}
        </ul>
        <span className={`dim ${styles.keys}`}>1 2 3 / ← →</span>
      </nav>

      {/* instrução */}
      <div className={`mono ${styles.hint}`}>
        <span className={styles.hintDot} />
        <span className={styles.hintDesk}>MOVE / CLICK / DRAG</span>
        <span className={styles.hintTouch}>TAP / DRAG</span>
      </div>

      {/* troca de experimento */}
      {flash > 0 && (
        <div key={flash} className={`mono ${styles.flash}`} aria-hidden="true">
          EXP / {String(current + 1).padStart(2, "0")} — {MODES[current].label}
        </div>
      )}
    </section>
  );
}
