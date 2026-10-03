// Posição global do ponteiro, compartilhada por todos os efeitos (um único listener).
export const pointer = { x: 0, y: 0, nx: 0, ny: 0, active: false };

let bound = false;

export function bindPointer() {
  if (bound || typeof window === "undefined") return;
  bound = true;
  pointer.x = window.innerWidth / 2;
  pointer.y = window.innerHeight / 2;
  window.addEventListener(
    "pointermove",
    (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.nx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ny = (e.clientY / window.innerHeight) * 2 - 1;
      pointer.active = true;
    },
    { passive: true }
  );
}

export const isFinePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/**
 * Dispositivo de toque (sem mouse de precisão): celulares e tablets.
 * É o inverso exato de isFinePointer — no desktop com mouse, sempre `false`,
 * então nenhum caminho de código do desktop muda.
 */
export const isTouchDevice = () => typeof window !== "undefined" && !isFinePointer();

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
