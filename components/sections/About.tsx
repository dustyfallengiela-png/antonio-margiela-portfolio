"use client";
import { useRef } from "react";
import { useReveal } from "@/hooks/useReveal";
import Words from "@/components/ui/Words";
import styles from "./About.module.css";

const FACTS = [
  ["ROLE", "Engenheiro de sites & software"],
  ["BASE", "Brasil — atendendo remoto"],
  ["STACK", "TypeScript · React · Next · Node"],
  ["FOCUS", "Performance, interação, produto"],
];

export default function About() {
  const root = useRef<HTMLElement>(null);
  useReveal(root);

  return (
    <section id="about" ref={root} className={styles.section}>
      <span className="mono dim" data-reveal>
        05 — ABOUT
      </span>
      <h2 className={styles.title} data-words>
        <Words text="ENGINEERING THE WEB DIFFERENTLY." wordClass={(w) => (w === "DIFFERENTLY." ? styles.accentWord : undefined)} />
      </h2>
      <div className={styles.cols}>
        <p className={styles.text} data-reveal>
          Desenvolvo sites, sistemas e experiências digitais combinando engenharia, design e novas tecnologias para
          transformar ideias em produtos digitais.
        </p>
        <dl className={styles.facts}>
          {FACTS.map(([k, v]) => (
            <div key={k} data-reveal>
              <dt className="mono dim">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
