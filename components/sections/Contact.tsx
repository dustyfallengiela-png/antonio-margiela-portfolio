"use client";
import { useRef } from "react";
import { CONTACT } from "@/lib/content";
import { useReveal } from "@/hooks/useReveal";
import { useMagnetic } from "@/hooks/useMagnetic";
import { useExperience } from "@/components/ExperienceContext";
import Words from "@/components/ui/Words";
import styles from "./Contact.module.css";

export default function Contact() {
  const root = useRef<HTMLElement>(null);
  const cta = useRef<HTMLAnchorElement>(null);
  const { toMenu } = useExperience();
  useReveal(root);
  useMagnetic(cta, 0.3);

  const links = [
    { label: "WhatsApp", href: CONTACT.whatsapp, value: CONTACT.whatsappDisplay },
    { label: "Instagram", href: CONTACT.instagram, value: CONTACT.instagramHandle },
    // o e-mail só aparece quando existir um endereço real
    ...(CONTACT.email ? [{ label: "E-mail", href: `mailto:${CONTACT.email}`, value: CONTACT.email }] : []),
  ];

  return (
    <section id="contact" ref={root} className={styles.section}>
      <div className={`mono ${styles.top}`} data-reveal>
        <span>06 — CONTACT</span>
        <span>
          <i className={styles.dot} /> STATUS / AVAILABLE FOR PROJECTS
        </span>
      </div>

      <h2 className={styles.title} data-words>
        <Words text="TEM UMA IDEIA?" />
      </h2>
      <p className={styles.sub} data-words>
        <Words text="VAMOS COLOCÁ-LA NA INTERNET." />
      </p>

      <div className={styles.ctaRow} data-reveal>
        <a ref={cta} href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer" className={styles.cta}>
          <span className={styles.ctaInner}>
            [ INICIAR PROJETO <span className={styles.arrow}>→</span> ]
          </span>
        </a>
      </div>

      <ul className={styles.links}>
        {links.map((l) => (
          <li key={l.label} data-reveal>
            <a href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
              <span className={styles.linkLabel}>{l.label}</span>
              <span className="mono">{l.value}</span>
              <span className={styles.linkArrow}>↗</span>
            </a>
          </li>
        ))}
      </ul>

      <footer className={`mono ${styles.footer}`}>
        <span>© 2026 ANTONIO MARGIELA</span>
        <span>BUILD / 01 — MADE IN BRAZIL</span>
        <button onClick={toMenu}>BACK TO MENU ↑</button>
      </footer>
    </section>
  );
}
