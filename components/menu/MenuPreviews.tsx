"use client";
import type { MenuItem } from "@/lib/content";
import MockWindow from "@/components/ui/MockWindow";
import styles from "./MenuPreviews.module.css";

type Preview = MenuItem["preview"];

// Pontos de arquitetura (viewBox 1600x900) — clusters nas laterais, centro livre para o menu.
const NODES = [
  { id: "CDN", x: 140, y: 180 },
  { id: "EDGE", x: 360, y: 300 },
  { id: "UI", x: 180, y: 520 },
  { id: "AUTH", x: 380, y: 700 },
  { id: "API", x: 1240, y: 200 },
  { id: "QUEUE", x: 1440, y: 360 },
  { id: "DB", x: 1260, y: 560 },
  { id: "CACHE", x: 1460, y: 720 },
];
const LINKS = [
  "M140 180 H360 V300",
  "M360 300 V520 H180",
  "M180 520 V700 H380",
  "M360 300 H800 V120 H1240 V200",
  "M1240 200 H1440 V360",
  "M1440 360 V560 H1260",
  "M1260 560 V720 H1460",
  "M380 700 H800 V820 H1260 V560",
];

export default function MenuPreviews({ active }: { active: Preview }) {
  const on = (p: Preview) => (active === p ? true : undefined);

  return (
    <div className={styles.root} aria-hidden="true">
      {/* INICIAR — plano em perspectiva, sensação de "entrar" */}
      <div className={`${styles.layer} ${styles.start}`} data-on={on("start")}>
        <div className={styles.floor} />
        <div className={styles.horizon} />
        <div className={styles.scan} />
      </div>

      {/* PROJETOS — mockups flutuando */}
      <div className={`${styles.layer} ${styles.projects}`} data-on={on("projects")}>
        <div className={`${styles.win} ${styles.w1}`}>
          <MockWindow
            tone="#ff5a1f"
            variant="editorial"
            url="northwind.studio"
            title={"Experiências digitais\nconstruídas para\nimpressionar."}
            titleSize={6.4}
          />
        </div>
        <div className={`${styles.win} ${styles.w2}`}>
          <MockWindow tone="#d7ff3a" variant="dashboard" url="ledger.app/ops" />
        </div>
        <div className={`${styles.win} ${styles.w3}`}>
          <MockWindow tone="#8fb3ff" variant="landing" url="atlas.launch" title={"Lance sua ideia.\nConverta mais."} titleSize={6.2} />
        </div>
        <div className={`${styles.win} ${styles.w4}`}>
          <MockWindow
            tone="#ecebe5"
            variant="editorial"
            url="lab.am"
            title={"Identidades modernas\npara marcas que querem\nser lembradas."}
            titleSize={6.2}
          />
        </div>
      </div>

      {/* SERVIÇOS — arquitetura digital */}
      <div className={`${styles.layer} ${styles.services}`} data-on={on("services")}>
        <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" stroke="rgba(236,235,229,.05)" />
            </pattern>
          </defs>
          <rect width="1600" height="900" fill="url(#grid)" />
          {LINKS.map((d, i) => (
            <path key={d} d={d} className={styles.link} style={{ animationDelay: `${i * 0.08}s` }} pathLength={1} />
          ))}
          {active === "services" &&
            LINKS.map((d, i) => (
            <circle key={`p${i}`} r="3" className={styles.packet}>
              <animateMotion dur={`${3 + (i % 3)}s`} repeatCount="indefinite" path={d} begin={`${i * 0.3}s`} />
            </circle>
          ))}
          {NODES.map((n) => (
            <g key={n.id} transform={`translate(${n.x} ${n.y})`} className={styles.node}>
              <rect x="-7" y="-7" width="14" height="14" />
              <text x="16" y="4">
                {n.id}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* SOBRE — composição editorial, mais humana */}
      <div className={`${styles.layer} ${styles.about}`} data-on={on("about")}>
        <figure className={styles.portrait}>
          <div className={styles.figure} />
          <span className={styles.crop} />
          <figcaption className="mono">FIG. 01 — PORTRAIT / PLACEHOLDER</figcaption>
        </figure>
        <blockquote className={styles.quote}>
          <p>
            A forma segue a <em>ideia.</em>
            <br />
            Não o contrário.
          </p>
          <cite className="mono">— A. MARGIELA / NOTES 04</cite>
        </blockquote>
      </div>

      {/* LAB — o globo se deforma; o fundo vira um campo de medição */}
      <div className={`${styles.layer} ${styles.lab}`} data-on={on("lab")}>
        <div className={styles.field} />
        <span className={`mono ${styles.exp} ${styles.e1}`}>EXP—01 / WAVE DEFORM</span>
        <span className={`mono ${styles.exp} ${styles.e2}`}>EXP—02 / ORBIT DRIFT</span>
        <span className={`mono ${styles.exp} ${styles.e3}`}>f(φ,θ) = 1 + a·sin 4φ·cos 3θ</span>
      </div>

      {/* CONTATO */}
      <div className={`${styles.layer} ${styles.contact}`} data-on={on("contact")}>
        <span className={`mono ${styles.avail}`}>
          <i /> AVAILABLE FOR PROJECTS — 2026
        </span>
        {[1].map((row) => (
          <div key={row} className={styles.marquee} data-row={row}>
            <div>
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={i}>
                  AVAILABLE FOR PROJECTS <em>●</em>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
