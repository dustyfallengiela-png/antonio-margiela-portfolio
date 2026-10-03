"use client";
import { useEffect, useRef, type PointerEvent } from "react";
import gsap from "gsap";
import { PROJECTS, type Project } from "@/lib/content";
import { isFinePointer, prefersReducedMotion } from "@/lib/pointer";
import { useReveal } from "@/hooks/useReveal";
import MockWindow from "@/components/ui/MockWindow";
import Words from "@/components/ui/Words";
import styles from "./Projects.module.css";

const VARIANTS = ["editorial", "dashboard", "landing"] as const;

function ProjectBlock({ project, index }: { project: Project; index: number }) {
  const media = useRef<HTMLAnchorElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const tweens = useRef<{ rx: gsap.QuickToFunc; ry: gsap.QuickToFunc; ix: gsap.QuickToFunc; iy: gsap.QuickToFunc } | null>(null);

  useEffect(() => {
    if (!frame.current || !inner.current) return;
    const o = { duration: 0.8, ease: "power3.out" };
    tweens.current = {
      rx: gsap.quickTo(frame.current, "rotationX", o),
      ry: gsap.quickTo(frame.current, "rotationY", o),
      ix: gsap.quickTo(inner.current, "x", o),
      iy: gsap.quickTo(inner.current, "y", o),
    };
    // parallax de scroll
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        inner.current,
        { yPercent: 6 },
        {
          yPercent: -6,
          ease: "none",
          scrollTrigger: { trigger: media.current, start: "top bottom", end: "bottom top", scrub: true },
        }
      );
    });
    return () => ctx.revert();
  }, []);

  const onMove = (e: PointerEvent) => {
    if (!isFinePointer() || !media.current || !tweens.current) return;
    const r = media.current.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    tweens.current.rx(-ny * 8);
    tweens.current.ry(nx * 10);
    tweens.current.ix(-nx * 24);
    tweens.current.iy(-ny * 16);
  };
  const onLeave = () => {
    const t = tweens.current;
    if (!t) return;
    t.rx(0);
    t.ry(0);
    t.ix(0);
    t.iy(0);
  };

  const flip = index % 2 === 1;

  return (
    <article className={styles.project} data-flip={flip || undefined}>
      <div className={`mono ${styles.meta}`} data-reveal>
        <span>
          {String(index + 1).padStart(2, "0")} / PROJECT
        </span>
        <span className="dim">
          {project.category} / {project.year}
        </span>
      </div>
      <h3 className={styles.name} data-words>
        <Words text={project.name} />
      </h3>

      <a
        href={project.href}
        className={styles.media}
        ref={media}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        data-cursor-label="VIEW ↗"
        style={{ ["--tone" as string]: project.tone }}
      >
        <div ref={frame} className={styles.frame}>
          <div ref={inner} className={styles.inner}>
            <MockWindow tone={project.tone} variant={VARIANTS[index % 3]} url={project.name.toLowerCase().replace(/[^a-z]+/g, "") + ".com"} title={project.name} />
          </div>
          <div className={`mono ${styles.overlay}`}>
            <span>{project.stack.join(" · ")}</span>
            <span>CASE STUDY — SOON</span>
          </div>
        </div>
      </a>

      <div className={styles.foot} data-reveal>
        <p>{project.summary}</p>
        <a href={project.href} className={`mono ${styles.view}`}>
          VIEW PROJECT <span>↗</span>
        </a>
      </div>
    </article>
  );
}

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
          2024 — 2026 / {String(PROJECTS.length).padStart(2, "0")} ENTRIES
        </span>
      </header>
      {PROJECTS.map((p, i) => (
        <ProjectBlock key={p.name} project={p} index={i} />
      ))}
    </section>
  );
}
