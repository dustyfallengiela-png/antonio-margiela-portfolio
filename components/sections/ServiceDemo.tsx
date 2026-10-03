"use client";
import { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/lib/pointer";
import styles from "./ServiceDemo.module.css";

export type DemoKind = "web" | "brand" | "video";

/** Timecode HH:MM:SS:FF a 24fps — só roda enquanto a demo está montada. */
function Timecode() {
  const [f, setF] = useState(12 * 24 + 8);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.setInterval(() => setF((v) => v + 1), 1000 / 24);
    return () => window.clearInterval(id);
  }, []);
  const p = (n: number) => String(n).padStart(2, "0");
  const s = Math.floor(f / 24);
  return <>{`00:${p(Math.floor(s / 60))}:${p(s % 60)}:${p(f % 24)}`}</>;
}

const WAVE = Array.from({ length: 48 }, (_, i) => 18 + Math.abs(Math.sin(i * 0.9) * Math.cos(i * 0.31)) * 82);

/** Manifestação visual de cada categoria — CSS puro, montada só quando ativa. */
export default function ServiceDemo({ kind }: { kind: DemoKind }) {
  return (
    <div className={styles.demo} data-kind={kind} aria-hidden="true">
      {kind === "web" && (
        <div className={styles.web}>
          <div className={styles.browser}>
            <div className={styles.bar}>
              <span className={styles.url}>https://seu-site.com</span>
              <span className={styles.status}>200 OK</span>
            </div>
            <div className={styles.page}>
              <div className={styles.cols}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <i key={i} />
                ))}
              </div>
              <i className={styles.nav} />
              <b className={styles.hero} />
              <span className={styles.blocks}>
                <em />
                <em />
                <em />
              </span>
              <span className={styles.click} />
            </div>
          </div>
          <svg className={styles.nodes} viewBox="0 0 120 120">
            <path d="M20 20 H60 V60 H100 M60 60 V100 H20" />
            <rect x="15" y="15" width="10" height="10" />
            <rect x="95" y="55" width="10" height="10" />
            <rect x="15" y="95" width="10" height="10" />
            <circle cx="60" cy="60" r="5" />
          </svg>
        </div>
      )}

      {kind === "brand" && (
        <div className={styles.brand}>
          <div className={styles.construct}>
            <svg viewBox="0 0 160 160">
              <g className={styles.guides}>
                <line x1="0" y1="80" x2="160" y2="80" />
                <line x1="80" y1="0" x2="80" y2="160" />
                <line x1="0" y1="0" x2="160" y2="160" />
                <line x1="160" y1="0" x2="0" y2="160" />
                <circle cx="80" cy="80" r="64" />
              </g>
              <g className={styles.mark}>
                <circle cx="80" cy="80" r="40" pathLength={1} />
                <rect x="52" y="52" width="56" height="56" pathLength={1} />
                <path d="M52 108 L80 52 L108 108" pathLength={1} />
              </g>
              <circle className={styles.dot} cx="108" cy="52" r="4" />
            </svg>
          </div>
          <div className={styles.specimen}>
            <span className={styles.aa}>Aa</span>
            <span className={styles.weights}>
              <i>300</i>
              <i>500</i>
              <i>800</i>
            </span>
            <span className={styles.swatches}>
              <i style={{ background: "#0a0a09" }} />
              <i style={{ background: "#ecebe5" }} />
              <i style={{ background: "#6d6c67" }} />
              <i style={{ background: "var(--accent)" }} />
            </span>
          </div>
        </div>
      )}

      {kind === "video" && (
        <div className={styles.video}>
          <div className={styles.monitor}>
            <span className={styles.rec}>● REC</span>
            <span className={styles.tc}>
              <Timecode />
            </span>
            <div className={styles.frames}>
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
          <div className={styles.timeline}>
            <div className={styles.ruler}>
              {Array.from({ length: 13 }).map((_, i) => (
                <i key={i} />
              ))}
            </div>
            <div className={styles.track}>
              <span>V2</span>
              <div>
                <b style={{ left: "18%", width: "14%" }} />
                <b style={{ left: "58%", width: "20%" }} className={styles.accentClip} />
              </div>
            </div>
            <div className={styles.track}>
              <span>V1</span>
              <div>
                <b style={{ left: "0%", width: "30%" }} />
                <b style={{ left: "31%", width: "22%" }} />
                <b style={{ left: "54%", width: "28%" }} />
                <b style={{ left: "83%", width: "17%" }} />
              </div>
            </div>
            <div className={`${styles.track} ${styles.audio}`}>
              <span>A1</span>
              <div className={styles.wave}>
                {WAVE.map((h, i) => (
                  <i key={i} style={{ height: `${h}%`, animationDelay: `${(i % 8) * -0.12}s` }} />
                ))}
              </div>
            </div>
            <span className={styles.playhead} />
          </div>
        </div>
      )}
    </div>
  );
}
