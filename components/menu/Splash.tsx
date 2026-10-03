"use client";
import { useEffect, useState } from "react";
import { SPLASHES } from "@/lib/content";
import { prefersReducedMotion } from "@/lib/pointer";
import styles from "./Splash.module.css";

/**
 * Anotação experimental ligada ao globo por uma linha guia.
 * Frase aleatória a cada carregamento; clique troca (datilografando).
 */
export default function Splash({ className }: { className?: string }) {
  const [phrase, setPhrase] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  // client-only para não gerar mismatch de hidratação
  useEffect(() => {
    setPhrase(SPLASHES[(Math.random() * SPLASHES.length) | 0]);
  }, []);

  useEffect(() => {
    if (!phrase) return;
    if (prefersReducedMotion()) return setCount(phrase.length);
    setCount(0);
    let i = 0;
    const start = window.setTimeout(() => {
      const id = window.setInterval(() => {
        i += 1;
        setCount(i);
        if (i >= phrase.length) window.clearInterval(id);
      }, 28);
      cleanup = () => window.clearInterval(id);
    }, 700);
    let cleanup = () => {};
    return () => {
      window.clearTimeout(start);
      cleanup();
    };
  }, [phrase]);

  const next = () =>
    setPhrase((cur) => {
      const pool = SPLASHES.filter((s) => s !== cur);
      return pool[(Math.random() * pool.length) | 0];
    });

  if (!phrase) return null;
  const typing = count < phrase.length;

  return (
    <button className={`${styles.splash} ${className ?? ""}`} onClick={next} data-cursor-label="SHUFFLE" aria-label={phrase}>
      <span className={styles.leader} aria-hidden="true">
        <i />
      </span>
      <span className={`mono ${styles.text}`} aria-hidden="true">
        <span className={styles.tag}>NOTE</span>
        {phrase.slice(0, count)}
        <span className={styles.caret} data-typing={typing || undefined} />
      </span>
    </button>
  );
}
