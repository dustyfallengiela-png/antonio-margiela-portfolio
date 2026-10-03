import type Lenis from "lenis";
import type { SectionId } from "./content";

// Instância única do Lenis, registrada pelo MainContent.
let lenis: Lenis | null = null;

export const setLenis = (l: Lenis | null) => {
  lenis = l;
};

export function scrollToElement(el: HTMLElement, immediate = false, offset = 0) {
  if (lenis) {
    lenis.scrollTo(el, { immediate, duration: 1.6, offset });
  } else {
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: immediate ? "auto" : "smooth" });
  }
}

// Serviço específico pedido a partir do main menu (mockups do estado SERVIÇOS).
let serviceFocus: number | null = null;
export const setServiceFocus = (i: number | null) => {
  serviceFocus = i;
};
export const peekServiceFocus = () => serviceFocus;
export const consumeServiceFocus = () => {
  const v = serviceFocus;
  serviceFocus = null;
  return v;
};

export function scrollToSection(id: SectionId, immediate = false) {
  const el = id === "top" ? 0 : document.getElementById(id);
  if (el === null) return;
  if (lenis) {
    lenis.scrollTo(el as HTMLElement | number, { immediate, duration: 1.6, offset: 0 });
  } else {
    const top = typeof el === "number" ? el : el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top, behavior: immediate ? "auto" : "smooth" });
  }
}
