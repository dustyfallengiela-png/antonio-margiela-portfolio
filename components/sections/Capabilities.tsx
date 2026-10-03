"use client";
import { useEffect, useRef, useState } from "react";
import { SERVICES } from "@/lib/content";
import { consumeServiceFocus, peekServiceFocus, scrollToElement } from "@/lib/scroll";
import { useReveal } from "@/hooks/useReveal";
import Words from "@/components/ui/Words";
import ServiceDemo from "./ServiceDemo";
import styles from "./Capabilities.module.css";

const LETTERS = ["A", "B", "C", "D"];

/**
 * Três categorias de serviço em grandes faixas.
 * Hover (desktop) ou toque (mobile) ativa a faixa e revela descrição,
 * especialidades e a manifestação visual. As faixas têm altura fixa, então
 * trocar de serviço nunca desloca o layout sob o cursor.
 */
export default function Capabilities() {
  const root = useRef<HTMLElement>(null);
  // vindo de um mockup do main menu? abre direto naquele serviço
  const [active, setActive] = useState(() => peekServiceFocus() ?? 0);
  useReveal(root);

  useEffect(() => {
    if (peekServiceFocus() === null) return;
    // 2 frames: deixa o MainContent posicionar a seção antes de alinhar a faixa
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        const i = consumeServiceFocus();
        const row = i === null ? null : document.getElementById(`servico-${String(i + 1).padStart(2, "0")}`);
        if (row) scrollToElement(row, true, -72);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section id="capabilities" ref={root} className={styles.section}>
      <header className={styles.head}>
        <span className="mono dim" data-reveal>
          03 — SERVICES
        </span>
        <h2 className={styles.title} data-words>
          <Words text="SERVIÇOS" />
        </h2>
        <span className={`mono ${styles.kicker}`} data-reveal>
          <span className="accent">03</span> CATEGORIAS <span className="dim">/</span>{" "}
          <span className="dim">ENGINEERING DIGITAL EXPERIENCES</span>
        </span>
      </header>

      <ol className={styles.list}>
        {SERVICES.map((s, i) => {
          const on = active === i;
          const num = String(i + 1).padStart(2, "0");
          return (
            <li
              key={s.title}
              id={`servico-${num}`}
              className={styles.row}
              data-active={on || undefined}
              onPointerEnter={(e) => e.pointerType === "mouse" && setActive(i)}
            >
              <span className={styles.rule} data-line />
              <button
                className={styles.button}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                aria-expanded={on}
                aria-controls={`service-${num}`}
                data-reveal
              >
                <span className={`mono ${styles.num}`}>{num} /</span>
                <span className={styles.name}>{s.title}</span>
                <span className={styles.summary}>{s.summary}</span>
                <span className={`mono ${styles.plus}`} aria-hidden="true">
                  +
                </span>
              </button>

              <div id={`service-${num}`}>
                <div className={styles.inner}>
                  <p className={styles.desc}>{s.desc}</p>

                  <div className={styles.includes}>
                    <span className="mono dim">INCLUI</span>
                    <ul>
                      {s.includes.map((item, k) => (
                        <li key={item} className="mono" style={{ transitionDelay: on ? `${0.15 + k * 0.06}s` : "0s" }}>
                          <span className="accent">
                            {num}.{LETTERS[k]}
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <figure className={styles.visual}>
                    <figcaption className="mono">
                      <span>MANIFEST / {num}</span>
                      <span className="dim">LIVE</span>
                    </figcaption>
                    <div className={styles.stage}>
                      {on ? (
                        <ServiceDemo key={i} kind={s.demo} />
                      ) : (
                        <div className={`mono ${styles.standby}`}>STANDBY — {num}</div>
                      )}
                    </div>
                  </figure>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
