"use client";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useExperience } from "@/components/ExperienceContext";
import { CONTACT, type SectionId } from "@/lib/content";
import styles from "./Terminal.module.css";

type Line = { kind: "in" | "out" | "err" | "accent"; text: string };

const HELP = [
  "comandos disponíveis:",
  "  projects   → projetos selecionados",
  "  services   → serviços",
  "  lab        → experimentos",
  "  about      → sobre",
  "  contact    → canais de contato",
  "  hire       → iniciar um projeto",
  "  menu       → voltar ao main menu",
  "  clear      → limpar o terminal",
];

const ROUTES: Record<string, SectionId> = {
  projects: "projects",
  services: "capabilities",
  lab: "lab",
  about: "about",
  contact: "contact",
  hire: "contact",
};

/** Easter egg: terminal discreto acionado por ">_" ou pela tecla ` */
export default function Terminal() {
  const { go, toMenu, phase } = useExperience();
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([
    { kind: "out", text: "AM/OS 0.1 — build 01" },
    { kind: "out", text: "digite 'help' para ver os comandos." },
  ]);
  const [value, setValue] = useState("");
  const history = useRef<string[]>([]);
  const hIndex = useRef(-1);
  const input = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "`" && !(e.target as HTMLElement)?.closest("input,textarea")) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) input.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [lines]);

  const print = (...ls: Line[]) => setLines((cur) => [...cur, ...ls]);

  const run = (raw: string) => {
    const cmd = raw.trim().toLowerCase();
    print({ kind: "in", text: raw });
    if (!cmd) return;
    history.current.unshift(raw);
    hIndex.current = -1;

    if (cmd === "help") return print(...HELP.map((text) => ({ kind: "out" as const, text })));
    if (cmd === "clear") return setLines([]);
    if (cmd === "menu" || cmd === "exit") {
      toMenu();
      return print({ kind: "out", text: phase === "menu" ? "você já está no menu." : "voltando ao menu..." });
    }
    if (cmd === "whoami") return print({ kind: "out", text: "visitante — mas poderia ser cliente." });
    if (cmd === "ls") return print({ kind: "out", text: "projects/  services/  lab/  about.md  contact.sh" });
    if (cmd.startsWith("sudo")) return print({ kind: "err", text: "permissão negada. tente 'hire'." });
    if (cmd in ROUTES) {
      if (cmd === "hire") {
        print(
          { kind: "accent", text: "excelente escolha." },
          { kind: "out", text: `whatsapp → ${CONTACT.whatsapp.split("?")[0]}` },
          ...(CONTACT.email ? [{ kind: "out" as const, text: `e-mail   → ${CONTACT.email}` }] : [])
        );
      } else {
        print({ kind: "out", text: `abrindo ${cmd}...` });
      }
      go(ROUTES[cmd]);
      return;
    }
    print({ kind: "err", text: `comando não encontrado: ${cmd}` });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      run(value);
      setValue("");
    } else if (e.key === "Escape") {
      e.stopPropagation();
      setOpen(false);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const h = history.current;
      hIndex.current = Math.max(-1, Math.min(h.length - 1, hIndex.current + (e.key === "ArrowUp" ? 1 : -1)));
      setValue(hIndex.current >= 0 ? h[hIndex.current] : "");
    }
  };

  return (
    <>
      <button
        className={`mono ${styles.toggle}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Fechar terminal" : "Abrir terminal"}
        aria-expanded={open}
        data-open={open || undefined}
      >
        {">_"}
      </button>
      <div className={styles.panel} data-open={open || undefined} role="dialog" aria-label="Terminal">
        <div className={`mono ${styles.head}`}>
          <span>AM/OS — TERMINAL</span>
          <button onClick={() => setOpen(false)} className="dim">
            ESC
          </button>
        </div>
        <div ref={log} className={styles.log} onClick={() => input.current?.focus()}>
          {lines.map((l, i) => (
            <div key={i} className={styles[l.kind]}>
              {l.kind === "in" && <span className={styles.prompt}>am@web:~$ </span>}
              {l.text}
            </div>
          ))}
          <label className={styles.inputRow}>
            <span className={styles.prompt}>am@web:~$ </span>
            <input
              ref={input}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKeyDown}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              aria-label="Comando"
              tabIndex={open ? 0 : -1}
            />
          </label>
        </div>
      </div>
    </>
  );
}
