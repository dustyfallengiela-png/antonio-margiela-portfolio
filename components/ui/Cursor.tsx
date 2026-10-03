"use client";
import { useEffect, useRef } from "react";
import { bindPointer, isFinePointer, pointer } from "@/lib/pointer";
import styles from "./Cursor.module.css";

/**
 * Cursor técnico minimalista.
 * - normal: pequeno crosshair preciso
 * - interativo: cantoneiras expandem ao redor (com inércia)
 * - rótulo contextual: `data-cursor-label` explícito, ou automático
 *   (link externo → OPEN ↗, link interno → VIEW)
 */
function labelFor(el: HTMLElement | null): string {
  if (!el) return "";
  if (el.dataset.cursorLabel !== undefined) return el.dataset.cursorLabel;
  if (el.tagName === "A") return (el as HTMLAnchorElement).target === "_blank" ? "OPEN ↗" : "VIEW";
  return "";
}

export default function Cursor() {
  const cross = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isFinePointer()) return;
    bindPointer();
    const root = document.documentElement;
    root.classList.add("has-cursor");
    let fx = pointer.x, fy = pointer.y, raf = 0;

    const loop = () => {
      fx += (pointer.x - fx) * 0.22;
      fy += (pointer.y - fy) * 0.22;
      if (cross.current) cross.current.style.transform = `translate3d(${pointer.x}px,${pointer.y}px,0)`;
      if (frame.current) frame.current.style.transform = `translate3d(${fx}px,${fy}px,0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const over = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>("a,button,input,[data-cursor],[data-cursor-label]");
      const f = frame.current, c = cross.current;
      if (!f || !c) return;
      const text = t?.tagName === "INPUT";
      const lbl = text ? "" : labelFor(t);
      f.dataset.state = t && !text ? "hover" : "";
      c.dataset.state = text ? "text" : t ? "hover" : "";
      if (label.current && lbl) label.current.textContent = lbl;
      f.toggleAttribute("data-label", !!lbl);
    };
    const down = () => frame.current?.setAttribute("data-down", "");
    const up = () => frame.current?.removeAttribute("data-down");
    const leave = () => root.setAttribute("data-cursor-hidden", "");
    const enter = () => root.removeAttribute("data-cursor-hidden");

    document.addEventListener("mouseover", over);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    root.addEventListener("mouseleave", leave);
    root.addEventListener("mouseenter", enter);
    return () => {
      cancelAnimationFrame(raf);
      root.classList.remove("has-cursor");
      document.removeEventListener("mouseover", over);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      root.removeEventListener("mouseleave", leave);
      root.removeEventListener("mouseenter", enter);
    };
  }, []);

  return (
    <div className={styles.root} aria-hidden="true">
      <div ref={frame} className={styles.frame}>
        <i className={styles.tl} />
        <i className={styles.tr} />
        <i className={styles.bl} />
        <i className={styles.br} />
        <span ref={label} className={styles.label} />
      </div>
      <div ref={cross} className={styles.cross}>
        <i />
      </div>
    </div>
  );
}
