"use client";
import { useLayoutEffect, type RefObject } from "react";

/**
 * Garante o enquadramento do main menu em qualquer viewport:
 * 1. largura — o nome (nowrap) nunca passa da área útil; se o clamp() do CSS
 *    ultrapassar, a fonte é reduzida proporcionalmente;
 * 2. altura — se globo + nome + menu não couberem, o palco inteiro é escalado
 *    (via --fit) em vez de cortar ou gerar scroll.
 */
export function useMenuFit(
  wrapRef: RefObject<HTMLElement | null>,
  fitRef: RefObject<HTMLElement | null>,
  stageRef: RefObject<HTMLElement | null>,
  nameRef: RefObject<HTMLElement | null>
) {
  useLayoutEffect(() => {
    const wrap = wrapRef.current, fit = fitRef.current, stage = stageRef.current, name = nameRef.current;
    if (!wrap || !fit || !stage || !name) return;

    const run = () => {
      const cs = getComputedStyle(wrap);
      const availW = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const availH = wrap.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);

      name.style.fontSize = "";
      if (getComputedStyle(name).whiteSpace === "nowrap") {
        const w = name.scrollWidth;
        const max = availW * 0.97;
        if (w > max) {
          const size = parseFloat(getComputedStyle(name).fontSize);
          name.style.fontSize = `${Math.floor(size * (max / w) * 10) / 10}px`;
        }
      }

      const h = stage.offsetHeight;
      fit.style.setProperty("--fit", String(h > availH ? Math.max(0.6, availH / h) : 1));
    };

    run();
    const ro = new ResizeObserver(run);
    ro.observe(wrap);
    document.fonts?.ready.then(run);
    return () => ro.disconnect();
  }, [wrapRef, fitRef, stageRef, nameRef]);
}
