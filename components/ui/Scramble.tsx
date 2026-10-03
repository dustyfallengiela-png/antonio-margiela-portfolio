"use client";
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/pointer";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/_-+";

/** Texto que "decodifica" da esquerda para a direita sempre que `trigger` muda. */
export default function Scramble({ text, trigger, duration = 380 }: { text: string; trigger: unknown; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || !trigger) {
      el.textContent = text;
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const run = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const solved = Math.floor(p * text.length);
      let out = "";
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        out += i < solved || c === " " ? c : CHARS[(Math.random() * CHARS.length) | 0];
      }
      el.textContent = out;
      if (p < 1) raf = requestAnimationFrame(run);
    };
    raf = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf);
  }, [text, trigger, duration]);

  return (
    <span ref={ref} aria-label={text}>
      {text}
    </span>
  );
}
