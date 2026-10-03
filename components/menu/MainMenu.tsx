"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { MENU, menuExitLines, type MenuItem, type SectionId } from "@/lib/content";
import { bindPointer, isTouchDevice, pointer, prefersReducedMotion } from "@/lib/pointer";
import { peekServiceFocus, setServiceFocus } from "@/lib/scroll";
import Globe, { type GlobeMode } from "@/components/ui/Globe";
import Scramble from "@/components/ui/Scramble";
import MenuPreviews from "./MenuPreviews";
import Splash from "./Splash";
import Hud from "./Hud";
import ServicesStage from "./ServicesStage";
import { useMenuFit } from "./useMenuFit";
import styles from "./MainMenu.module.css";

const NAME = "ANTONIO MARGIELA";
const SERVICES_INDEX = MENU.findIndex((m) => m.preview === "services");
const SERVICE_LABELS = ["WEB ENGINEERING", "VISUAL IDENTITY", "VIDEO EDITING"];
const EXIT_LABELS: Partial<Record<SectionId, string>> = {
  projects: "PROJECTS",
  capabilities: "SERVICES",
  about: "PROFILE",
  lab: "LAB",
  contact: "CHANNELS",
};

type Props = {
  onSelect: (item: MenuItem) => void;
  onExited: (target: SectionId) => void;
  exitTo: SectionId | null;
  locked: boolean;
};

export default function MainMenu({ onSelect, onExited, exitTo, locked }: Props) {
  const [active, setActive] = useState(0);
  const [keyboard, setKeyboard] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [devMode, setDevMode] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fitRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selectorRef = useRef<HTMLSpanElement>(null);

  const activeRef = useRef(active);
  activeRef.current = active;
  const pickedRef = useRef(false);
  // teclado tem prioridade até o mouse se mover de verdade
  const kbdLock = useRef(false);
  const nameClicks = useRef(0);

  useMenuFit(wrapRef, fitRef, stageRef, nameRef);

  // ---------- seleção ----------
  const select = useCallback(
    (i: number) => {
      if (locked || pickedRef.current) return;
      pickedRef.current = true;
      setActive(i);
      setPicked(i);
      onSelect(MENU[i]);
    },
    [locked, onSelect]
  );

  // teclado: ↑ ↓ / W S navegam, Enter acessa, Esc volta ao topo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,textarea") || pickedRef.current) return;
      const k = e.key.toLowerCase();
      kbdLock.current = true;
      if (k === "arrowdown" || k === "arrowup" || k === "s" || k === "w") {
        e.preventDefault();
        setKeyboard(true);
        const dir = k === "arrowdown" || k === "s" ? 1 : -1;
        setActive((a) => (a + dir + MENU.length) % MENU.length);
      } else if (k === "enter") {
        e.preventDefault();
        setKeyboard(true);
        select(activeRef.current);
      } else if (k === "escape") {
        setActive(0);
      }
    };
    const onMove = (e: PointerEvent) => {
      if (e.movementX || e.movementY) kbdLock.current = false;
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointermove", onMove);
    };
  }, [select]);

  // Com SERVIÇOS ativo, o mouse precisa atravessar o menu para chegar aos
  // mockups: a troca de item exige uma breve pausa (intenção), evitando que
  // o estado se desfaça no caminho.
  const intent = useRef<number>(0);
  const intentFor = useRef(-1);
  const hover = (e: React.PointerEvent, i: number) => {
    if (e.pointerType !== "mouse" || pickedRef.current || kbdLock.current) return;
    if (activeRef.current === i) return;
    if (activeRef.current === SERVICES_INDEX) {
      if (intentFor.current === i) return; // já aguardando este item
      window.clearTimeout(intent.current);
      intentFor.current = i;
      intent.current = window.setTimeout(() => {
        intentFor.current = -1;
        if (!pickedRef.current) setActive(i);
      }, 140);
    } else {
      setActive(i);
    }
  };
  const unhover = () => {
    window.clearTimeout(intent.current);
    intentFor.current = -1;
  };

  const openService = useCallback(
    (i: number) => {
      if (locked || pickedRef.current) return;
      setServiceFocus(i);
      select(SERVICES_INDEX);
    },
    [locked, select]
  );

  // indicador de seleção desliza até o item ativo
  useLayoutEffect(() => {
    const place = () => {
      const row = listRef.current?.children[activeRef.current] as HTMLElement | undefined;
      const sel = selectorRef.current;
      if (!row || !sel) return;
      sel.style.transform = `translate3d(0, ${row.offsetTop}px, 0)`;
      sel.style.height = `${row.offsetHeight}px`;
    };
    place();
    const ro = new ResizeObserver(place);
    if (listRef.current) ro.observe(listRef.current);
    return () => ro.disconnect();
  }, [active]);

  // ---------- intro + parallax em camadas ----------
  useEffect(() => {
    bindPointer();
    const reduced = prefersReducedMotion();
    const ctx = gsap.context(() => {
      if (reduced) return;
      gsap.from("[data-intro]", { y: 22, opacity: 0, duration: 1.2, ease: "expo.out", stagger: 0.07, delay: 0.1 });
      gsap.from(`.${styles.row}`, { x: -10, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.045, delay: 0.35 });
    }, rootRef);

    let raf = 0, rx = 0, ry = 0;
    const layers: [React.RefObject<HTMLElement | null>, number][] = [
      [bgRef, -16],
      [globeRef, 14],
      [titleRef, 6],
      [navRef, 3],
    ];
    const loop = () => {
      rx += (pointer.nx - rx) * 0.06;
      ry += (pointer.ny - ry) * 0.06;
      if (stageRef.current) stageRef.current.style.transform = `rotateX(${-ry * 2}deg) rotateY(${rx * 2.5}deg)`;
      for (const [ref, d] of layers) {
        if (ref.current) ref.current.style.translate = `${rx * d}px ${ry * d * 0.7}px`;
      }
      raf = requestAnimationFrame(loop);
    };
    // parallax depende do mouse: em toque não há o que acompanhar, então não roda
    if (!reduced && !isTouchDevice()) raf = requestAnimationFrame(loop);
    return () => {
      ctx.revert();
      cancelAnimationFrame(raf);
    };
  }, []);

  // ---------- saída: o menu se desmonta enquanto a câmera "entra" ----------
  const focus = exitTo === "capabilities" ? peekServiceFocus() : null;
  const exitLines = menuExitLines(
    focus !== null ? SERVICE_LABELS[focus] : exitTo ? EXIT_LABELS[exitTo] : undefined
  );
  const exitCb = useRef(onExited);
  exitCb.current = onExited;

  useEffect(() => {
    if (!exitTo) return;
    const root = rootRef.current;
    if (!root) return;
    const idx = Math.max(0, MENU.findIndex((m) => m.target === exitTo));
    pickedRef.current = true;
    setActive(idx);
    setPicked(idx);

    const done = () => exitCb.current(exitTo);
    const q = gsap.utils.selector(root);

    if (prefersReducedMotion()) {
      const tl = gsap.timeline({ onComplete: done });
      tl.to(root, { opacity: 0, duration: 0.3 });
      return () => {
        tl.kill();
      };
    }

    const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    // empurra cada elemento para fora do centro (sensação de travelling para dentro)
    const outward = (el: Element, k: number) => {
      const r = el.getBoundingClientRect();
      return { x: (r.left + r.width / 2 - cx) * k, y: (r.top + r.height / 2 - cy) * k };
    };

    const rows = q(`.${styles.row}`);
    const others = rows.filter((_, i) => i !== idx);
    const chars = q(`.${styles.char}`);
    const lines = q("[data-log-line]");

    const tl = gsap.timeline({ onComplete: done });
    tl.to(others, { opacity: 0, x: -14, duration: 0.24, stagger: 0.025, ease: "power2.in" }, 0.05)
      .to(rows[idx], { opacity: 0, duration: 0.2, ease: "power2.in" }, 0.24)
      .to(selectorRef.current, { opacity: 0, duration: 0.2 }, 0.24)
      .set(q(`.${styles.log}`), { autoAlpha: 1 }, 0.26)
      .fromTo(q(`.${styles.logBar} i`), { scaleX: 0 }, { scaleX: 1, duration: 0.46, ease: "power1.inOut" }, 0.28);
    lines.forEach((line, i) => {
      tl.fromTo(line, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.12, ease: "power2.out" }, 0.28 + i * 0.15);
      tl.set(line.querySelector("[data-ok]"), { opacity: 1 }, 0.38 + i * 0.15);
    });

    // desmontagem (≈0.74s → 1.45s)
    const T = 0.74;
    tl.call(() => nameRef.current?.classList.add(styles.split), undefined, T)
      .to(
        chars,
        {
          x: (_: number, el: Element) => outward(el, 0.9).x,
          y: (_: number, el: Element) => outward(el, 0.9).y + gsap.utils.random(-30, 30),
          rotation: () => gsap.utils.random(-14, 14),
          scale: 1.5,
          opacity: 0,
          // blur em 16 letras é o efeito mais caro para GPU de celular
          filter: isTouchDevice() ? "none" : "blur(10px)",
          duration: 0.6,
          ease: "power3.in",
          stagger: { each: 0.012, from: "center" },
        },
        T
      )
      .to(
        q("[data-exit]"),
        {
          x: (_: number, el: Element) => outward(el, 0.5).x,
          y: (_: number, el: Element) => outward(el, 0.5).y,
          opacity: 0,
          duration: 0.5,
          ease: "power2.in",
        },
        T
      )
      .to(bgRef.current, { opacity: 0, scale: 1.12, duration: 0.55, ease: "power2.in" }, T - 0.05)
      .to(globeRef.current, { scale: 9, opacity: 0, duration: 0.68, ease: "power3.in" }, T);

    return () => {
      tl.kill();
    };
  }, [exitTo]);

  // ---------- easter egg: 5 cliques no nome → blueprint ----------
  const onNameClick = () => {
    nameClicks.current += 1;
    if (nameClicks.current % 5 === 0) setDevMode((d) => !d);
  };
  useEffect(() => {
    document.documentElement.toggleAttribute("data-devmode", devMode);
    return () => document.documentElement.removeAttribute("data-devmode");
  }, [devMode]);

  const current = MENU[active];
  const exiting = exitTo !== null;
  const globeMode = current.preview as GlobeMode;

  return (
    <div ref={rootRef} className={styles.root} data-exiting={exiting || undefined} data-mode={current.preview}>
      <div ref={bgRef} className={styles.bg}>
        <MenuPreviews active={current.preview} />
      </div>
      <div className={styles.vignette} />

      <Hud keyboard={keyboard} devMode={devMode} active={active} total={MENU.length} />

      {/* estado SERVIÇOS: três interfaces flutuantes demonstrando os serviços */}
      <ServicesStage on={current.preview === "services"} onOpen={openService} />

      <div ref={wrapRef} className={styles.stageWrap}>
        <div ref={fitRef} className={styles.fit}>
          <div ref={stageRef} className={styles.stage}>
            <div ref={globeRef} className={styles.globe} data-intro>
              <Globe
                className={styles.globeCanvas}
                mode={globeMode}
                energy={exiting ? 3.5 : active === 0 ? 1.25 : 1}
                depth={1.4}
              />
              <Splash className={styles.splash} />
            </div>

            <div ref={titleRef} className={styles.titleBlock} data-intro>
              <h1 ref={nameRef} className={styles.name} onClick={onNameClick} aria-label={NAME}>
                {NAME.split("").map((c, i) => (
                  <span key={i} className={c === " " ? styles.space : styles.char} aria-hidden="true">
                    {c}
                  </span>
                ))}
              </h1>
              <p className={`mono ${styles.subtitle}`} data-exit>
                <span className={styles.subEn}>Engineering digital experiences</span>
                <span className={styles.sep}>/</span>
                <span>Engenharia de Sites & Software</span>
              </p>
            </div>

            <nav ref={navRef} className={styles.menu} aria-label="Menu principal" data-intro>
              <span
                ref={selectorRef}
                className={styles.selector}
                data-picked={picked !== null || undefined}
                aria-hidden="true"
              >
                <i />
              </span>
              <ul ref={listRef} role="menu" className={styles.list}>
                {MENU.map((item, i) => {
                  const on = i === active;
                  return (
                    <li key={item.id} role="none" className={styles.row}>
                      <button
                        role="menuitem"
                        className={`${styles.item} ${item.primary ? styles.primary : ""}`}
                        data-active={on || undefined}
                        data-picked={picked === i || undefined}
                        data-cursor-label="ENTER"
                        onPointerEnter={(e) => hover(e, i)}
                        onPointerMove={(e) => hover(e, i)}
                        onPointerLeave={unhover}
                        onFocus={() => !pickedRef.current && setActive(i)}
                        onClick={() => select(i)}
                      >
                        <span className={`mono ${styles.index}`}>{String(i).padStart(2, "0")}</span>
                        <span className={styles.label}>
                          <span className={`${styles.bracket} ${styles.bl}`} aria-hidden="true">
                            [
                          </span>
                          <span className={styles.text}>{item.label}</span>
                          <span className={`${styles.bracket} ${styles.br}`} aria-hidden="true">
                            ]
                          </span>
                        </span>
                        <span className={`mono ${styles.meta}`}>
                          {on && !exiting && <Scramble text={item.meta} trigger={active + 1} />}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* log da transição — aparece no lugar do menu */}
              <div className={`mono ${styles.log}`} aria-live="polite" data-exit>
                {exitLines.map((l) => (
                  <div key={l} data-log-line className={styles.logLine}>
                    <span>
                      <span className="accent">{">"}</span> {l}
                    </span>
                    <span data-ok className={styles.ok}>
                      OK
                    </span>
                  </div>
                ))}
                <span className={styles.logBar}>
                  <i />
                </span>
              </div>
            </nav>
          </div>
        </div>
      </div>

      <div className={`mono ${styles.kbd}`} data-on={keyboard || undefined} data-exit>
        ↑ ↓ / W S navegar <span className="dim">·</span> ↵ acessar <span className="dim">·</span> esc voltar
      </div>
    </div>
  );
}
