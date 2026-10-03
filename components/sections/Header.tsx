"use client";
import { useEffect, useRef } from "react";
import { useExperience } from "@/components/ExperienceContext";
import type { SectionId } from "@/lib/content";
import styles from "./Header.module.css";

const NAV: { id: SectionId; label: string }[] = [
  { id: "projects", label: "Projects" },
  { id: "capabilities", label: "Capabilities" },
  { id: "lab", label: "Lab" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

export default function Header() {
  const { go, toMenu } = useExperience();
  const pct = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  // indicador de progresso de scroll (sem re-render)
  useEffect(() => {
    let raf = 0;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      if (pct.current) pct.current.textContent = String(Math.round(p * 100)).padStart(3, "0");
      if (bar.current) bar.current.style.transform = `scaleY(${p})`;
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className={styles.header}>
        <button className={styles.brand} onClick={() => go("top")}>
          ANTONIO MARGIELA
        </button>
        <nav className={`mono ${styles.nav}`} aria-label="Seções">
          {NAV.map((n) => (
            <button key={n.id} onClick={() => go(n.id)}>
              {n.label}
            </button>
          ))}
        </nav>
        <button className={`mono ${styles.menu}`} onClick={toMenu}>
          [ MENU ] <span className={styles.esc}>ESC</span>
        </button>
      </header>
      <div className={`mono ${styles.progress}`} aria-hidden="true">
        <span className={styles.track}>
          <span ref={bar} />
        </span>
        <span>
          SCROLL / <span ref={pct}>000</span>
        </span>
      </div>
    </>
  );
}
