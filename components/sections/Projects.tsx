"use client";
import { useRef } from "react";
import { PROJECTS } from "@/lib/content";
import { useReveal } from "@/hooks/useReveal";
import Words from "@/components/ui/Words";
import ProjectBrowser from "./ProjectBrowser";
import styles from "./Projects.module.css";

// intervalo de anos a partir dos próprios projetos (ex.: "2026" ou "2025 — 2026")
const years = PROJECTS.map((p) => Number(p.year));
const first = Math.min(...years), last = Math.max(...years);
const RANGE = first === last ? String(last) : `${first} — ${last}`;

export default function Projects() {
  const root = useRef<HTMLElement>(null);
  useReveal(root);

  return (
    <section id="projects" ref={root} className={styles.section}>
      <header className={styles.head}>
        <span className="mono dim" data-reveal>
          02 — WORK
        </span>
        <h2 className={styles.title} data-words>
          <Words text="SELECTED PROJECTS" />
        </h2>
        <span className="mono dim" data-reveal>
          {RANGE} / {String(PROJECTS.length).padStart(2, "0")} ENTRIES
        </span>
      </header>
      <div data-reveal>
        <ProjectBrowser />
      </div>
    </section>
  );
}
