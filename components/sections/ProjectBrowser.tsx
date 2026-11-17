"use client";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { PROJECTS, type Project } from "@/lib/content";
import { isTouchDevice, prefersReducedMotion } from "@/lib/pointer";
import Scramble from "@/components/ui/Scramble";
import styles from "./ProjectBrowser.module.css";

/** largura em que o site embutido é renderizado antes de ser escalado para a janela */
const VIRTUAL_W = 1440;

type Mode = "live" | "preview" | "soon";

const two = (n: number) => String(n).padStart(2, "0");
const host = (url?: string) => (url ? url.replace(/^https?:\/\//, "") : "");

function statusLabel(p: Project) {
  return p.status === "soon" ? "SOON" : "LIVE";
}

/**
 * Janela de navegador com abas para os projetos reais.
 * - LIVE: o site roda dentro da janela (só desktop, só se o site permitir iframe)
 * - PREVIEW: captura emendada da rolagem, rolando sozinha; clique abre o site
 * - SOON: projeto em pré-lançamento, sem link
 */
export default function ProjectBrowser() {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [index, setIndex] = useState(0);
  const [canEmbed, setCanEmbed] = useState(false); // desktop com mouse e janela larga
  const [near, setNear] = useState(false); // seção perto da tela: pode carregar o site
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [interactive, setInteractive] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [shotDur, setShotDur] = useState(30);

  const project = PROJECTS[index];
  const mode: Mode = project.status === "soon" ? "soon" : project.embeddable && canEmbed ? "live" : "preview";
  const scale = box.w > 0 ? box.w / VIRTUAL_W : 1;

  // site embutido só em desktop com mouse e janela larga (no toque, iframe trava a rolagem)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const update = () => setCanEmbed(!isTouchDevice() && mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // só carrega o site quando a seção se aproxima; pausa a prévia fora da tela
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: "300px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // trocar de aba volta ao modo "clique para navegar"
  useEffect(() => setInteractive(false), [index]);

  const select = useCallback((i: number) => {
    setIndex((cur) => (cur === i ? cur : i));
  }, []);

  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (index + (e.key === "ArrowRight" ? 1 : PROJECTS.length - 1)) % PROJECTS.length;
    select(next);
    tabRefs.current[next]?.focus();
  };

  // duração da rolagem automática proporcional à altura da captura
  const onShotLoad = (img: HTMLImageElement) => {
    const h = img.getBoundingClientRect().height;
    const vh = viewportRef.current?.clientHeight || 1;
    setShotDur(Math.max(12, Math.min(60, (h / vh) * 3.2)));
  };

  const reduced = typeof window !== "undefined" && prefersReducedMotion();

  return (
    <div ref={rootRef} className={styles.root} data-mode={mode}>
      <div className={styles.window}>
        {/* abas */}
        <div className={styles.tabs} role="tablist" aria-label="Projetos" onKeyDown={onTabKey}>
          {PROJECTS.map((p, i) => (
            <button
              key={p.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              role="tab"
              id={`project-tab-${p.id}`}
              aria-selected={i === index}
              aria-controls="project-panel"
              tabIndex={i === index ? 0 : -1}
              className={styles.tab}
              data-active={i === index || undefined}
              onClick={() => select(i)}
              data-cursor-label={two(i + 1)}
            >
              <span className={`mono ${styles.tabNum}`}>{two(i + 1)}</span>
              <span className={styles.tabName}>{p.name}</span>
              <span className={`mono ${styles.tabStatus}`} data-status={p.status}>
                <i />
                {statusLabel(p)}
              </span>
            </button>
          ))}
        </div>

        {/* barra de endereço */}
        <div className={`mono ${styles.bar}`}>
          <span className={styles.nav} aria-hidden="true">
            ‹ ›
          </span>
          <span className={styles.url}>
            {project.url ? (
              <>
                <span className="dim">https://</span>
                <Scramble text={host(project.url)} trigger={index + 1} />
              </>
            ) : (
              <span className="dim">private build — {project.name.toLowerCase()}</span>
            )}
          </span>
          <span className={styles.chip} data-mode={mode}>
            {mode === "live" ? "LIVE" : mode === "preview" ? "PREVIEW" : "SOON"}
          </span>
          {mode === "live" && (
            <button
              className={styles.icon}
              onClick={() => {
                setLoaded((l) => ({ ...l, [project.id]: false }));
                setReloadKey((k) => k + 1);
              }}
              aria-label="Recarregar site"
              data-cursor-label="RELOAD"
            >
              ↻
            </button>
          )}
          {project.url && (
            <a className={styles.open} href={project.url} target="_blank" rel="noopener noreferrer">
              ABRIR ↗
            </a>
          )}
        </div>

        {/* viewport */}
        <div
          ref={viewportRef}
          id="project-panel"
          role="tabpanel"
          aria-labelledby={`project-tab-${project.id}`}
          className={styles.viewport}
          onPointerLeave={() => setInteractive(false)}
        >
          <div key={`${project.id}-${mode}`} className={styles.layer}>
            {mode === "live" && project.url && (
              <>
                {project.preview && !loaded[project.id] && (
                  <img className={styles.poster} src={project.preview.desktop} alt="" aria-hidden="true" />
                )}
                <div
                  className={styles.live}
                  style={{ width: VIRTUAL_W, height: box.h / scale || 0, transform: `scale(${scale})` }}
                >
                  {near && (
                    <iframe
                      key={reloadKey}
                      src={project.url}
                      title={`${project.name} — site ao vivo`}
                      loading="lazy"
                      sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
                      onLoad={() => setLoaded((l) => ({ ...l, [project.id]: true }))}
                      data-ready={loaded[project.id] || undefined}
                    />
                  )}
                </div>
                {!loaded[project.id] && (
                  <span className={`mono ${styles.connecting}`}>
                    CONNECTING <span className="dim">→ {host(project.url)}</span>
                  </span>
                )}
                {!interactive && (
                  <button
                    className={styles.gate}
                    onClick={() => setInteractive(true)}
                    data-cursor-label="NAVEGAR"
                    aria-label={`Navegar no site ${project.name}`}
                  >
                    <span className={`mono ${styles.gateLabel}`}>
                      <i /> CLIQUE PARA NAVEGAR NO SITE
                    </span>
                  </button>
                )}
              </>
            )}

            {mode === "preview" && project.preview && (
              <a
                className={styles.shot}
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor-label="ABRIR ↗"
                data-paused={!near || undefined}
                data-static={reduced || undefined}
                style={{ ["--dur" as string]: `${shotDur}s`, ["--vh" as string]: `${box.h}px` }}
                aria-label={`Abrir o site ${project.name} em nova aba`}
              >
                <picture>
                  <source media="(max-width: 720px)" srcSet={project.preview.mobile} />
                  <img
                    src={project.preview.desktop}
                    alt={`Prévia da rolagem do site ${project.name}`}
                    loading="lazy"
                    decoding="async"
                    onLoad={(e) => onShotLoad(e.currentTarget)}
                  />
                </picture>
                <span className={`mono ${styles.shotHint}`}>
                  PRÉVIA · ROLAGEM AUTOMÁTICA <span className="dim">/ ABRIR SITE ↗</span>
                </span>
              </a>
            )}

            {mode === "soon" && (
              <div className={styles.soon}>
                <span className={`mono ${styles.soonTop}`}>
                  <i /> PRIVATE BUILD / PRÉ-LANÇAMENTO
                </span>
                <strong className={styles.soonName}>{project.name}</strong>
                <span className="mono dim">
                  {project.category.toUpperCase()} · {project.year}
                </span>
                <span className={styles.soonScan} aria-hidden="true" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ficha do projeto ativo */}
      <div key={project.id} className={styles.info}>
        <div className={styles.infoHead}>
          <span className="mono dim">
            {two(index + 1)} / {two(PROJECTS.length)} — {project.category} / {project.year}
          </span>
          <h3 className={styles.name}>{project.name}</h3>
        </div>
        <div className={styles.infoBody}>
          <p>{project.summary}</p>
          <ul className={`mono ${styles.stack}`}>
            {project.stack.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div className={`mono ${styles.links}`}>
          {project.url ? (
            <a href={project.url} target="_blank" rel="noopener noreferrer">
              VER SITE <span>↗</span>
            </a>
          ) : (
            <span className="dim">EM BREVE</span>
          )}
          {project.repo && (
            <a href={project.repo} target="_blank" rel="noopener noreferrer">
              GITHUB <span>↗</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
