"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "@/lib/pointer";
import Globe from "@/components/ui/Globe";
import Words from "@/components/ui/Words";
import styles from "./Manifesto.module.css";

/** Primeira tela após o menu: a frase manifesto, trocada pelo scroll. */
export default function Manifesto({ ready }: { ready: boolean }) {
  const root = useRef<HTMLElement>(null);

  // timeline de scroll
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const q = gsap.utils.selector(el);
    const reduced = prefersReducedMotion();
    const ctx = gsap.context(() => {
      gsap.set(q(`.${styles.b} .mask > span`), { yPercent: 140 });
      // estado inicial da intro (fica escondido sob a cortina)
      if (!reduced) {
        gsap.set(q(`.${styles.a} .mask > span`), { yPercent: 140 });
        gsap.set(q("[data-fade]"), { opacity: 0, y: 12 });
      }
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: reduced ? "+=60%" : "+=170%",
          pin: q(`.${styles.pin}`)[0],
          scrub: reduced ? true : 0.8,
        },
      });
      tl.to(q(`.${styles.strike}`), { scaleX: 1, duration: 0.3, ease: "power2.inOut" })
        .to(q(`.${styles.a} .mask > span`), { yPercent: -140, duration: 0.35, stagger: 0.04, ease: "power2.in" }, "+=0.1")
        .to(q(`.${styles.strike}`), { opacity: 0, duration: 0.1 }, "<")
        .to(q(`.${styles.b} .mask > span`), { yPercent: 0, duration: 0.4, stagger: 0.05, ease: "power3.out" }, "-=0.1")
        .to(q(`.${styles.globe}`), { scale: 1.6, xPercent: -30, duration: 0.8 }, 0.2)
        .to(q(`.${styles.hint}`), { opacity: 0, duration: 0.1 }, 0)
        .to(q(`.${styles.counter} i`), { scaleX: 1, duration: 1 }, 0);
    }, el);
    return () => ctx.revert();
  }, []);

  // intro disparada quando a cortina termina
  useEffect(() => {
    const el = root.current;
    if (!el || !ready) return;
    const q = gsap.utils.selector(el);
    if (prefersReducedMotion()) return;
    gsap.to(q(`.${styles.a} .mask > span`), { yPercent: 0, duration: 1.2, ease: "expo.out", stagger: 0.08 });
    gsap.to(q("[data-fade]"), { opacity: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.08, delay: 0.3 });
  }, [ready]);

  return (
    <section id="top" ref={root} className={styles.section}>
      <div className={styles.pin}>
        <div className={`mono ${styles.metaTop}`} data-fade>
          <span>00 — MANIFESTO</span>
          <span className="dim">ENGINEERING DIGITAL EXPERIENCES</span>
        </div>

        <div className={styles.stack}>
          <h1 className={styles.a}>
            <span className={styles.line}>
              <Words text="NÃO ENTREGO" />
            </span>
            <span className={`${styles.line} ${styles.struck}`}>
              <Words text="APENAS PÁGINAS." />
              <i className={styles.strike} aria-hidden="true" />
            </span>
          </h1>
          <h2 className={styles.b}>
            <span className={styles.line}>
              <Words text="CONSTRUO" />
            </span>
            <span className={styles.line}>
              <Words text="EXPERIÊNCIAS" wordClass={() => styles.outline} />
            </span>
            <span className={styles.line}>
              <Words text="DIGITAIS." />
            </span>
          </h2>
        </div>

        <div className={styles.globe} data-fade>
          <Globe className={styles.globeCanvas} />
        </div>

        <div className={`mono ${styles.metaBottom}`} data-fade>
          <span className={styles.hint}>
            SCROLL <span className={styles.arrow}>↓</span>
          </span>
          <span className={styles.counter}>
            A → B <i />
          </span>
        </div>
      </div>
    </section>
  );
}
