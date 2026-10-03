"use client";
import { useEffect, useLayoutEffect, useRef } from "react";
import type { LabPointer } from "./LabEngine";
import styles from "./LabType.module.css";

const LINES = ["ANTONIO", "MARGIELA"];

type LetterState = { ox: number; oy: number; sx: number; sy: number; sk: number; fr: number; w: number };

/**
 * EXP 03 — TYPE. Cada letra tem duas metades (clip-path) que se separam com a
 * velocidade do cursor; perto dele a letra é empurrada, esticada, inclinada e
 * perde peso. Tudo é interpolado e volta à forma original quando o cursor sai.
 */
export default function LabType({
  active,
  visible,
  pointer,
  onForce,
}: {
  active: boolean;
  visible: boolean;
  pointer: LabPointer;
  onForce: (f: number) => void;
}) {
  const layer = useRef<HTMLDivElement>(null);
  const centers = useRef<{ x: number; y: number }[]>([]);
  const forceCb = useRef(onForce);
  forceCb.current = onForce;

  // centros das letras SEM transformações (offset* ignora transform)
  useLayoutEffect(() => {
    const el = layer.current;
    if (!el) return;
    const measure = () => {
      centers.current = Array.from(el.querySelectorAll<HTMLElement>(`.${styles.ch}`)).map((ch) => {
        const line = ch.offsetParent as HTMLElement;
        return {
          x: line.offsetLeft + ch.offsetLeft + ch.offsetWidth / 2,
          y: line.offsetTop + ch.offsetTop + ch.offsetHeight / 2,
        };
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = layer.current;
    if (!el || !active || !visible) return;
    const chars = Array.from(el.querySelectorAll<HTMLElement>(`.${styles.ch}`));
    const halves = chars.map((c) => [c.children[0] as HTMLElement, c.children[1] as HTMLElement]);
    const st: LetterState[] = chars.map(() => ({ ox: 0, oy: 0, sx: 1, sy: 1, sk: 0, fr: 0, w: 0 }));
    let raf = 0;

    const loop = () => {
      const R = Math.max(220, el.clientWidth * 0.2);
      const p = pointer;
      let total = 0;
      chars.forEach((ch, i) => {
        const c = centers.current[i];
        if (!c) return;
        let f = 0, dx = 0, dy = 0;
        if (p.inside) {
          dx = c.x - p.x;
          dy = c.y - p.y;
          const d = Math.hypot(dx, dy) || 1;
          f = Math.max(0, 1 - d / R);
          f = f * f * (3 - 2 * f); // smoothstep
          dx /= d;
          dy /= d;
        }
        const vx = p.vx, vy = p.vy;
        const target: LetterState = {
          ox: dx * f * 34 + vx * f * 1.4,
          oy: dy * f * 20 + vy * f * 0.9,
          sx: 1 + f * 0.16 + Math.min(0.45, Math.abs(vx) * 0.018) * f,
          sy: 1 + f * 0.1 - Math.min(0.2, Math.abs(vx) * 0.008) * f + Math.min(0.35, Math.abs(vy) * 0.018) * f,
          sk: Math.max(-26, Math.min(26, -vx * f * 1.1)),
          fr: Math.max(-46, Math.min(46, vx * f * 1.7 + vy * f * 0.6)),
          w: f,
        };
        const s = st[i];
        const k = f > s.w ? 0.2 : 0.07; // ataque rápido, retorno suave
        s.ox += (target.ox - s.ox) * k;
        s.oy += (target.oy - s.oy) * k;
        s.sx += (target.sx - s.sx) * k;
        s.sy += (target.sy - s.sy) * k;
        s.sk += (target.sk - s.sk) * k;
        s.fr += (target.fr - s.fr) * k;
        s.w += (target.w - s.w) * k;
        total += s.w;

        ch.style.transform = `translate3d(${s.ox.toFixed(2)}px,${s.oy.toFixed(2)}px,0) skewX(${s.sk.toFixed(2)}deg) scale(${s.sx.toFixed(3)},${s.sy.toFixed(3)})`;
        ch.style.fontWeight = String(Math.round(800 - s.w * 520));
        const [top, bottom] = halves[i];
        top.style.transform = `translateX(${(-s.fr / 2).toFixed(2)}px)`;
        bottom.style.transform = `translateX(${(s.fr / 2).toFixed(2)}px)`;
        ch.toggleAttribute("data-hot", Math.abs(s.fr) > 9);
      });
      forceCb.current(Math.min(1, (total / Math.max(1, chars.length)) * 4));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active, visible, pointer]);

  return (
    <div ref={layer} className={styles.layer} data-on={active || undefined} aria-label="ANTONIO MARGIELA">
      {LINES.map((line) => (
        <div key={line} className={styles.line} aria-hidden="true">
          {line.split("").map((c, i) => (
            <span key={i} className={styles.ch}>
              <span className={styles.top}>{c}</span>
              <span className={styles.bottom}>{c}</span>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
