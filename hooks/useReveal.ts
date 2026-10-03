"use client";
import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/pointer";

gsap.registerPlugin(ScrollTrigger);

/**
 * Reveals padrão ao entrar na viewport:
 *   [data-words]  → palavras mascaradas sobem (usar com <Words />)
 *   [data-reveal] → fade + deslocamento
 *   [data-line]   → linha que se desenha da esquerda
 */
export function useReveal(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>("[data-words]").forEach((block) => {
        gsap.from(block.querySelectorAll(".mask > span"), {
          yPercent: 140,
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.06,
          scrollTrigger: { trigger: block, start: "top 85%" },
        });
      });
      el.querySelectorAll<HTMLElement>("[data-reveal]").forEach((node) => {
        gsap.from(node, {
          opacity: 0,
          y: 24,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: { trigger: node, start: "top 90%" },
        });
      });
      el.querySelectorAll<HTMLElement>("[data-line]").forEach((node) => {
        gsap.from(node, {
          scaleX: 0,
          transformOrigin: "left",
          duration: 1.4,
          ease: "expo.out",
          scrollTrigger: { trigger: node, start: "top 92%" },
        });
      });
    }, el);
    return () => ctx.revert();
  }, [ref]);
}
