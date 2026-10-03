"use client";
import { useEffect, useRef, useState } from "react";
import { bindPointer, pointer } from "@/lib/pointer";
import styles from "./Hud.module.css";

function useClock() {
  const [time, setTime] = useState("--:--:--");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return time;
}

const TICKS = 25;

/** Microinformações técnicas espalhadas pela tela inicial. */
export default function Hud({
  keyboard,
  devMode,
  active,
  total,
}: {
  keyboard: boolean;
  devMode: boolean;
  active: number;
  total: number;
}) {
  const time = useClock();
  const coords = useRef<HTMLSpanElement>(null);

  // coordenadas do ponteiro, atualizadas sem re-render
  useEffect(() => {
    bindPointer();
    let raf = 0;
    const loop = () => {
      if (coords.current) {
        const x = String(Math.round(pointer.x)).padStart(4, "0");
        const y = String(Math.round(pointer.y)).padStart(4, "0");
        coords.current.textContent = `X ${x} · Y ${y}`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const pos = total > 1 ? active / (total - 1) : 0;

  return (
    <div className={`mono ${styles.hud}`} aria-hidden="true">
      <div className={styles.tl} data-exit>
        <span>AM / 2026</span>
        <span className="dim">BUILD / 01</span>
      </div>
      <div className={styles.tr} data-exit>
        <span>
          <i className={styles.dot} /> SYSTEM / ONLINE
        </span>
        <span className={`dim ${styles.coords}`} ref={coords}>
          X 0000 · Y 0000
        </span>
        {devMode && <span className="accent">BLUEPRINT / ON</span>}
      </div>
      <div className={styles.bl} data-exit>
        <span>BRAZIL</span>
        <span className="dim">{time} BRT</span>
      </div>
      <div className={styles.br} data-exit>
        <span>
          STATUS / <span className={styles.available}>AVAILABLE</span>
        </span>
        <span className="dim">{keyboard ? "INPUT / KEYBOARD" : "INPUT / POINTER"}</span>
      </div>

      {/* régua lateral: o marcador acompanha o item selecionado */}
      <div className={styles.ruler} data-exit style={{ ["--pos" as string]: pos }}>
        <div className={styles.ticks}>
          {Array.from({ length: TICKS }).map((_, i) => (
            <i key={i} data-major={i % 6 === 0 || undefined} />
          ))}
        </div>
        <span className={styles.marker}>
          <b />
          SEL {String(active).padStart(2, "0")}/{String(total - 1).padStart(2, "0")}
        </span>
      </div>

      <span className={`${styles.cross} ${styles.c1}`} data-exit />
      <span className={`${styles.cross} ${styles.c2}`} data-exit />
      <span className={`${styles.cross} ${styles.c3}`} data-exit />
      <span className={`${styles.cross} ${styles.c4}`} data-exit />
    </div>
  );
}
