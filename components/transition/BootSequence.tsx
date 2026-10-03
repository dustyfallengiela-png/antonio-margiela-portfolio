"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/pointer";
import styles from "./BootSequence.module.css";

/**
 * Sequência curta de "boot" (~1.5s) + cortina cinematográfica.
 * onSwap é chamado com a tela coberta (troca menu ↔ conteúdo);
 * onDone quando a cortina termina de sair.
 */
export default function BootSequence({
  lines,
  onSwap,
  onDone,
}: {
  lines: string[];
  onSwap: () => void;
  onDone: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const cb = useRef({ onSwap, onDone });
  cb.current = { onSwap, onDone };

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const q = gsap.utils.selector(el);
    const swap = () => cb.current.onSwap();
    const done = () => cb.current.onDone();

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      if (prefersReducedMotion()) {
        tl.to(q(`.${styles.backdrop}`), { opacity: 1, duration: 0.2 })
          .call(swap)
          .to(el, { opacity: 0, duration: 0.3, delay: 0.15 })
          .call(done);
        return;
      }
      const step = 0.24;
      const pct = { v: 0 };
      tl.to(q(`.${styles.backdrop}`), { opacity: 1, duration: 0.25, ease: "power2.out" });
      tl.to(
        pct,
        {
          v: 100,
          duration: lines.length * step,
          ease: "power1.inOut",
          onUpdate: () => {
            const n = q(`.${styles.pct}`)[0];
            if (n) n.textContent = String(Math.round(pct.v)).padStart(3, "0");
          },
        },
        0.2
      );
      tl.fromTo(q(`.${styles.bar} i`), { scaleX: 0 }, { scaleX: 1, duration: lines.length * step, ease: "power1.inOut" }, 0.2);
      q("[data-line]").forEach((line, i) => {
        tl.fromTo(line, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" }, 0.2 + i * step);
        tl.set(line.querySelector("[data-ok]"), { opacity: 1 }, 0.2 + (i + 0.7) * step);
      });
      tl.fromTo(
        q(`.${styles.curtain}`),
        { yPercent: 100 },
        { yPercent: 0, duration: 0.6, ease: "expo.inOut" },
        "+=0.12"
      )
        .call(swap)
        .set(q(`.${styles.backdrop}`), { opacity: 0 })
        .fromTo(q(`.${styles.curtain} span`), { opacity: 0 }, { opacity: 1, duration: 0.15 }, "<")
        .to(q(`.${styles.curtain}`), { yPercent: -100, duration: 0.75, ease: "expo.inOut" }, "+=0.15")
        .call(done);
    }, el);
    return () => ctx.revert();
  }, [lines]);

  const last = lines.length - 1;

  return (
    <div ref={root} className={styles.root} role="status" aria-live="polite">
      <div className={styles.backdrop}>
        <div className={styles.log}>
          {lines.map((l, i) =>
            i === last ? (
              <div key={l} data-line className={styles.welcome}>
                {l}
              </div>
            ) : (
              <div key={l} data-line className={`mono ${styles.line}`}>
                <span>
                  <span className="dim">{">"}</span> {l}
                </span>
                <span data-ok className={styles.ok}>
                  OK · {(0.08 + i * 0.07).toFixed(2)}s
                </span>
              </div>
            )
          )}
        </div>
        <div className={`mono ${styles.foot}`}>
          <span className={styles.bar}>
            <i />
          </span>
          <span className={styles.pct}>000</span>
        </div>
      </div>
      <div className={styles.curtain}>
        <span className="mono">AM — BUILD 01</span>
        <span className="mono">ENGINEERING DIGITAL EXPERIENCES</span>
      </div>
    </div>
  );
}
