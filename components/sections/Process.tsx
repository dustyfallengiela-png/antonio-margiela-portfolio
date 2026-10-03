"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { PROCESS } from "@/lib/content";
import { prefersReducedMotion } from "@/lib/pointer";
import styles from "./Process.module.css";

const ray = (i: number) => {
  const a = (i / 12) * Math.PI * 2;
  const r2 = i % 2 ? 58 : 70;
  return { x1: 100 + Math.cos(a) * 44, y1: 100 + Math.sin(a) * 44, x2: 100 + Math.cos(a) * r2, y2: 100 + Math.sin(a) * r2 };
};

// Uma ilustração de linha fina por etapa (viewBox 200x200)
const ART = [
  // IDEIA — faísca
  <g key="0">
    <circle cx="100" cy="100" r="6" className={styles.fill} />
    <circle cx="100" cy="100" r="30" />
    {Array.from({ length: 12 }).map((_, i) => (
      <line key={i} {...ray(i)} />
    ))}
  </g>,
  // ESTRATÉGIA — árvore de decisões
  <g key="1">
    <path d="M100 40 V80 M100 80 H50 V120 M100 80 H150 V120 M50 120 V160 M150 120 H120 V160 M150 120 H180 V160" />
    {[[100, 40], [50, 120], [150, 120], [50, 160], [120, 160], [180, 160]].map(([x, y], i) => (
      <rect key={i} x={x - 6} y={y - 6} width="12" height="12" className={i === 0 ? styles.fill : styles.node} />
    ))}
  </g>,
  // INTERFACE — wireframe
  <g key="2">
    <rect x="30" y="40" width="140" height="120" />
    <line x1="30" y1="58" x2="170" y2="58" />
    <rect x="44" y="72" width="70" height="10" className={styles.fill} />
    <line x1="44" y1="92" x2="104" y2="92" />
    <line x1="44" y1="100" x2="94" y2="100" />
    <rect x="124" y="72" width="32" height="46" />
    <rect x="44" y="128" width="112" height="20" />
  </g>,
  // ENGENHARIA — grafo de serviços
  <g key="3">
    <path d="M40 60 H160 M40 140 H160 M40 60 V140 M160 60 V140 M100 60 V140" />
    {[[40, 60], [100, 60], [160, 60], [40, 140], [100, 140], [160, 140], [100, 100]].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={i === 6 ? 7 : 5} className={i === 6 ? styles.fill : styles.node} />
    ))}
  </g>,
  // PRODUTO — o globo da marca
  <g key="4">
    <circle cx="100" cy="100" r="50" />
    <ellipse cx="100" cy="100" rx="20" ry="50" />
    <ellipse cx="100" cy="100" rx="50" ry="16" />
    <ellipse cx="100" cy="100" rx="78" ry="26" transform="rotate(-20 100 100)" />
    <circle cx="170" cy="76" r="5" className={styles.fill} />
  </g>,
];

/** IDEIA → PRODUTO, com a palavra rolando como um contador. */
export default function Process() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const q = gsap.utils.selector(el);
    const n = PROCESS.length;
    const ctx = gsap.context(() => {
      const item = q(`.${styles.word}`)[0] as HTMLElement;
      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: `+=${n * 70}%`,
          pin: q(`.${styles.pin}`)[0],
          scrub: prefersReducedMotion() ? true : 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // palavra i fica centralizada em t = i * 1.1; troca no meio do movimento
            const t = self.progress * (self.animation?.duration() ?? 1);
            const i = Math.min(n - 1, Math.floor((t + 0.3) / 1.1));
            if (el.dataset.stage !== String(i)) el.dataset.stage = String(i);
          },
        },
      });
      for (let i = 1; i < n; i++) {
        tl.to(q(`.${styles.track}`), { y: () => -i * item.offsetHeight, duration: 0.6 }, "+=0.5");
      }
      tl.to({}, { duration: 0.5 });
      tl.fromTo(q(`.${styles.progress} i`), { scaleX: 0 }, { scaleX: 1, ease: "none", duration: tl.duration() }, 0);
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className={styles.section} data-stage="0" aria-label="Processo">
      <div className={styles.pin}>
        <div className={`mono ${styles.top}`}>
          <span>01 — PROCESS</span>
          <span className="dim">IDEIA → PRODUTO</span>
        </div>

        <div className={styles.body}>
          <div className={styles.window}>
            <div className={styles.track}>
              {PROCESS.map((p) => (
                <div key={p.word} className={styles.word}>
                  {p.word}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.side}>
            <svg viewBox="0 0 200 200" className={styles.art} aria-hidden="true">
              {ART.map((g, i) => (
                <g key={i} data-i={i}>
                  {g}
                </g>
              ))}
            </svg>
            <div className={styles.descs}>
              {PROCESS.map((p, i) => (
                <p key={p.word} data-i={i}>
                  {p.desc}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <ol className={`mono ${styles.steps}`}>
            {PROCESS.map((p, i) => (
              <li key={p.word} data-i={i}>
                <span className="dim">{String(i + 1).padStart(2, "0")}</span> <span className={styles.stepName}>{p.word}</span>
              </li>
            ))}
          </ol>
          <span className={styles.progress}>
            <i />
          </span>
        </div>
      </div>
    </section>
  );
}
