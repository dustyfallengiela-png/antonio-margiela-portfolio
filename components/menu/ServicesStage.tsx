"use client";
import { useEffect, useRef, useState } from "react";
import { bindPointer, pointer, prefersReducedMotion } from "@/lib/pointer";
import styles from "./ServicesStage.module.css";

/**
 * Estado SERVIÇOS do main menu: três interfaces flutuantes ao redor do menu,
 * cada uma demonstrando um serviço. HTML/CSS/SVG puro.
 * - entrada progressiva (opacity + translate + scale + perspective), saída suave
 * - parallax por cursor em profundidades diferentes
 * - hover aproxima o mockup, revela o serviço e reduz o destaque dos outros
 * - clique leva à faixa correspondente na seção Serviços
 */

const ITEMS = [
  {
    id: "web",
    num: "01",
    tag: "WEB ENGINEERING",
    title: "ENGENHARIA DE SITES",
    sub: "SITES / E-COMMERCE / LANDING PAGES",
    depth: 22,
  },
  {
    id: "brand",
    num: "02",
    tag: "VISUAL IDENTITY",
    title: "IDENTIDADE VISUAL",
    sub: "BRANDING / DIREÇÃO CRIATIVA / SISTEMA VISUAL",
    depth: 14,
  },
  {
    id: "video",
    num: "03",
    tag: "VIDEO EDITING",
    title: "EDIÇÃO DE VÍDEO",
    sub: "YOUTUBE / STREAMING / SOCIAL CONTENT",
    depth: 30,
  },
] as const;

export default function ServicesStage({ on, onOpen }: { on: boolean; onOpen: (index: number) => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  // parallax por cursor — só roda enquanto o estado está ativo
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !on || prefersReducedMotion()) return;
    bindPointer();
    const layers = Array.from(root.querySelectorAll<HTMLElement>("[data-depth]"));
    let raf = 0, x = pointer.nx, y = pointer.ny;
    const loop = () => {
      x += (pointer.nx - x) * 0.05;
      y += (pointer.ny - y) * 0.05;
      for (const el of layers) {
        const d = Number(el.dataset.depth);
        el.style.translate = `${-x * d}px ${-y * d * 0.7}px`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [on]);

  useEffect(() => {
    if (!on) setHovered(null);
  }, [on]);

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-on={on || undefined}
      data-hover={hovered !== null || undefined}
      aria-hidden={!on}
    >
      {ITEMS.map((item, i) => (
        <button
          key={item.id}
          className={`${styles.item} ${styles[item.id]}`}
          data-hovered={hovered === i || undefined}
          data-cursor-label="OPEN"
          data-exit
          tabIndex={on ? 0 : -1}
          onPointerEnter={() => setHovered(i)}
          onPointerLeave={() => setHovered((h) => (h === i ? null : h))}
          onFocus={() => setHovered(i)}
          onBlur={() => setHovered(null)}
          onClick={() => on && onOpen(i)}
          aria-label={`${item.num} ${item.title} — abrir na seção Serviços`}
        >
          <span className={styles.para} data-depth={item.depth}>
            <span className={styles.plane}>
              <span className={styles.win}>
                <span className={`mono ${styles.head}`}>
                  <span>
                    <b className="accent">{item.num}</b> {item.tag}
                  </span>
                  <i />
                </span>
                <span className={styles.screen}>
                  {item.id === "web" && <WebMock />}
                  {item.id === "brand" && <BrandMock />}
                  {item.id === "video" && <VideoMock running={on} />}
                </span>
              </span>
              <span className={styles.caption}>
                <span className="mono accent">{item.num}</span>
                <span className={styles.capTitle}>{item.title}</span>
                <span className="mono dim">{item.sub}</span>
              </span>
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

/* ---------------- 01 — ENGENHARIA DE SITES ---------------- */
function WebMock() {
  return (
    <span className={styles.webMock}>
      <span className={`mono ${styles.chrome}`}>
        <i />
        <span>seusite.com.br</span>
        <em>200</em>
      </span>
      <span className={styles.viewport}>
        <span className={styles.cols} aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <i key={i} />
          ))}
        </span>
        {/* página mais alta que a viewport: rola sozinha bem devagar */}
        <span className={styles.page}>
          <span className={styles.navbar}>
            <b />
            <span>
              <i />
              <i />
              <i />
            </span>
            <em />
          </span>
          <span className={styles.hero}>
            <span className={styles.heroText}>
              <strong>
                Experiências
                <br />
                digitais sob medida.
              </strong>
              <span className={styles.lines}>
                <i />
                <i />
              </span>
              <span className={`mono ${styles.btn}`}>COMEÇAR →</span>
            </span>
            <span className={styles.heroImg}>
              <i />
            </span>
          </span>
          <span className={styles.cards}>
            <i />
            <i />
            <i />
          </span>
          <span className={styles.lines}>
            <i />
            <i />
            <i />
          </span>
          <span className={styles.footer}>
            <b />
            <i />
          </span>
        </span>
      </span>
    </span>
  );
}

/* ---------------- 02 — IDENTIDADE VISUAL ---------------- */
function BrandMock() {
  return (
    <span className={styles.brandMock}>
      <span className={styles.construct}>
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <g className={styles.guides}>
            <line x1="0" y1="50" x2="100" y2="50" />
            <line x1="50" y1="0" x2="50" y2="100" />
            <line x1="0" y1="0" x2="100" y2="100" />
            <line x1="100" y1="0" x2="0" y2="100" />
            <circle cx="50" cy="50" r="40" />
          </g>
          <g className={styles.symbol}>
            <circle cx="50" cy="50" r="24" />
            <path d="M32 66 L50 30 L68 66" />
            <circle className={styles.symbolDot} cx="68" cy="34" r="3.4" />
          </g>
        </svg>
        <span className={`mono ${styles.label}`}>FIG. A — SÍMBOLO</span>
      </span>

      <span className={styles.type}>
        <span className={styles.aa}>Aa</span>
        <span className={styles.wordmark}>norte.</span>
        <span className="mono">NORTE SANS / 300—800</span>
      </span>

      <span className={styles.palette}>
        {[
          ["#0A0A09", "#0a0a09"],
          ["#ECEBE5", "#ecebe5"],
          ["#6D6C67", "#6d6c67"],
          ["#FF5A1F", "var(--accent)"],
        ].map(([hex, c]) => (
          <span key={hex} className={styles.swatch}>
            <i style={{ background: c }} />
            <span className="mono">{hex}</span>
          </span>
        ))}
      </span>

      {/* formas que se reorganizam devagar: processo criativo */}
      <span className={styles.shapes} aria-hidden="true">
        <i className={styles.s1} />
        <i className={styles.s2} />
        <i className={styles.s3} />
      </span>

      {/* aplicação simples da identidade */}
      <span className={styles.application}>
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="24" />
          <path d="M32 66 L50 30 L68 66" />
        </svg>
        <span>norte.</span>
        <span className="mono">CARTÃO / 85×55</span>
      </span>
    </span>
  );
}

/* ---------------- 03 — EDIÇÃO DE VÍDEO ---------------- */
const V1 = [
  [0, 22],
  [23, 47],
  [48, 71],
  [72, 100],
];
const V2 = [
  [12, 30],
  [55, 68],
];
const CUTS = [22.5, 47.5, 71.5];
const DURATION = 14; // segundos para percorrer a timeline
const WAVE = Array.from({ length: 64 }, (_, i) => Math.round(20 + Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.23)) * 80));

function VideoMock({ running }: { running: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const tc = el.querySelector<HTMLElement>("[data-tc]");
    const clips = Array.from(el.querySelectorAll<HTMLElement>("[data-clip]"));
    const reduced = prefersReducedMotion();

    let p = 8, last = performance.now(), raf = 0, flashT = 0;
    const render = () => {
      el.style.setProperty("--pp", String(p / 100));
      const scene = V1.findIndex(([a, b]) => p >= a && p <= b + 0.5);
      if (el.dataset.scene !== String(scene)) el.dataset.scene = String(Math.max(0, scene));
      clips.forEach((c) => c.toggleAttribute("data-live", p >= Number(c.dataset.a) && p <= Number(c.dataset.b)));
      if (tc) {
        const f = Math.floor((p / 100) * DURATION * 24);
        const s = Math.floor(f / 24);
        tc.textContent = `00:00:${String(s).padStart(2, "0")}:${String(f % 24).padStart(2, "0")}`;
      }
    };
    render();
    if (!running || reduced) return;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const prev = p;
      p += (dt * 100) / DURATION;
      if (p > 100) p = 0;
      // passou por um corte: o monitor e o clipe respondem
      if (CUTS.some((c) => prev < c && p >= c)) {
        el.setAttribute("data-cut", "");
        flashT = now;
      } else if (flashT && now - flashT > 160) {
        el.removeAttribute("data-cut");
        flashT = 0;
      }
      render();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  return (
    <span ref={ref} className={styles.videoMock} data-scene="0">
      <span className={styles.monitor}>
        <span className={`mono ${styles.monHead}`}>
          <span>PREVIEW</span>
          <span data-tc>00:00:01:04</span>
        </span>
        <span className={styles.frame}>
          <span className={`${styles.scene} ${styles.sc0}`}>
            <i />
            <b />
          </span>
          <span className={`${styles.scene} ${styles.sc1}`}>
            <i />
            <i />
            <i />
          </span>
          <span className={`${styles.scene} ${styles.sc2}`}>
            <i />
          </span>
          <span className={`${styles.scene} ${styles.sc3}`}>
            <i />
            <b />
          </span>
          <span className={styles.safe} />
        </span>
        <span className={`mono ${styles.spec}`}>1080P · 24FPS</span>
      </span>

      <span className={styles.timeline}>
        <span className={styles.ruler}>
          {Array.from({ length: 21 }).map((_, i) => (
            <i key={i} data-major={i % 5 === 0 || undefined} />
          ))}
        </span>
        <span className={styles.track}>
          <span className="mono">V2</span>
          <span className={styles.lane}>
            {V2.map(([a, b], i) => (
              <b
                key={i}
                data-clip
                data-a={a}
                data-b={b}
                className={i === 1 ? styles.accentClip : undefined}
                style={{ left: `${a}%`, width: `${b - a}%` }}
              />
            ))}
          </span>
        </span>
        <span className={styles.track}>
          <span className="mono">V1</span>
          <span className={styles.lane}>
            {V1.map(([a, b], i) => (
              <b key={i} data-clip data-a={a} data-b={b} style={{ left: `${a}%`, width: `${b - a}%` }} />
            ))}
          </span>
        </span>
        <span className={styles.track}>
          <span className="mono">A1</span>
          <span className={`${styles.lane} ${styles.wave}`}>
            {WAVE.map((h, i) => (
              <i key={i} style={{ height: `${h}%` }} />
            ))}
          </span>
        </span>
        <span className={styles.track}>
          <span className="mono">A2</span>
          <span className={styles.lane}>
            <b className={styles.music} style={{ left: "0%", width: "100%" }} />
          </span>
        </span>
        <span className={styles.playhead} />
      </span>
    </span>
  );
}
