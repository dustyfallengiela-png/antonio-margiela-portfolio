"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import type { SectionId } from "@/lib/content";
import { prefersReducedMotion } from "@/lib/pointer";
import { scrollToSection, setLenis } from "@/lib/scroll";
import Header from "./Header";
import Manifesto from "./Manifesto";
import Process from "./Process";
import Projects from "./Projects";
import Capabilities from "./Capabilities";
import Lab from "./Lab";
import About from "./About";
import Contact from "./Contact";

gsap.registerPlugin(ScrollTrigger);

export default function MainContent({ initialTarget, ready }: { initialTarget: SectionId; ready: boolean }) {
  // Smooth scroll (Lenis) sincronizado com o ticker do GSAP
  useEffect(() => {
    const reduced = prefersReducedMotion();
    let lenis: Lenis | null = null;
    const tick = (t: number) => lenis?.raf(t * 1000);
    if (!reduced) {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }
    setLenis(lenis);

    // efeitos dos filhos já registraram seus ScrollTriggers aqui
    const raf = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      if (initialTarget !== "top") scrollToSection(initialTarget, true);
    });
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      cancelAnimationFrame(raf);
      gsap.ticker.remove(tick);
      lenis?.destroy();
      setLenis(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Header />
      <main>
        <Manifesto ready={ready} />
        <Process />
        <Projects />
        <Capabilities />
        <Lab />
        <About />
        <Contact />
      </main>
    </>
  );
}
