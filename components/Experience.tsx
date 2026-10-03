"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { MenuItem, SectionId } from "@/lib/content";
import { scrollToSection } from "@/lib/scroll";
import { ExperienceContext, type Phase } from "./ExperienceContext";
import MainMenu from "./menu/MainMenu";
import BootSequence from "./transition/BootSequence";
import Cursor from "./ui/Cursor";
import Terminal from "./ui/Terminal";

// O conteúdo principal só é baixado quando necessário (menu carrega primeiro).
const MainContent = dynamic(() => import("./sections/MainContent"), { ssr: false });

const RETURN_LINES = ["SAVING STATE", "RETURNING TO MENU"];

export default function Experience() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [target, setTarget] = useState<SectionId>("top");
  const [ready, setReady] = useState(false);
  // saída do menu (menu → conteúdo): o próprio menu se desmonta visualmente
  const [menuExit, setMenuExit] = useState<SectionId | null>(null);
  // retorno ao menu (conteúdo → menu): cortina
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.phase = phase;
  }, [phase]);

  // Pré-carrega o chunk do conteúdo enquanto o usuário está no menu.
  useEffect(() => {
    const id = window.setTimeout(() => import("./sections/MainContent"), 1200);
    return () => window.clearTimeout(id);
  }, []);

  const go = useCallback(
    (t: SectionId) => {
      if (phase === "main") return scrollToSection(t);
      if (menuExit || returning) return;
      setMenuExit(t);
    },
    [phase, menuExit, returning]
  );

  const onMenuExited = useCallback((t: SectionId) => {
    setTarget(t);
    setPhase("main");
    setReady(true);
    setMenuExit(null);
  }, []);

  const toMenu = useCallback(() => {
    if (returning || phase === "menu") return;
    setReturning(true);
  }, [phase, returning]);

  const onReturnSwap = useCallback(() => {
    setReady(false);
    setPhase("menu");
    window.scrollTo(0, 0);
  }, []);

  const onReturnDone = useCallback(() => setReturning(false), []);

  // ESC no conteúdo volta ao menu (como num jogo)
  useEffect(() => {
    if (phase !== "main") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || (e.target as HTMLElement)?.closest("input")) return;
      toMenu();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, toMenu]);

  const onMenuSelect = useCallback((item: MenuItem) => go(item.target), [go]);
  const api = useMemo(() => ({ phase, go, toMenu }), [phase, go, toMenu]);

  return (
    <ExperienceContext.Provider value={api}>
      {phase === "menu" && (
        <MainMenu onSelect={onMenuSelect} exitTo={menuExit} onExited={onMenuExited} locked={returning} />
      )}
      {phase === "main" && <MainContent initialTarget={target} ready={ready} />}
      {returning && <BootSequence lines={RETURN_LINES} onSwap={onReturnSwap} onDone={onReturnDone} />}
      <Terminal />
      <Cursor />
      <div className="grain" aria-hidden="true" />
    </ExperienceContext.Provider>
  );
}
