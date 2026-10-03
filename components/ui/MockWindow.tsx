import styles from "./MockWindow.module.css";

/**
 * Mockup de interface desenhado em CSS puro (zero imagens).
 * Serve como placeholder até entrarem os screenshots reais dos projetos.
 */
export default function MockWindow({
  tone,
  variant,
  url,
  title,
  titleSize,
}: {
  tone: string;
  variant: "editorial" | "dashboard" | "landing";
  url: string;
  /** "\n" no texto vira quebra de linha */
  title?: string;
  /** só para títulos mais longos: tamanho em cqw (padrão 8cqw) */
  titleSize?: number;
}) {
  const headline = (fallback: string) => {
    const lines = (title ?? fallback).split("\n");
    return (
      <div
        className={styles.headline}
        style={titleSize ? { fontSize: `${titleSize}cqw`, lineHeight: 1 } : undefined}
      >
        {lines.map((l, i) => (
          <span key={i}>
            {l}
            {i < lines.length - 1 && <br />}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.win} data-variant={variant} style={{ ["--tone" as string]: tone }}>
      <div className={styles.bar}>
        <span className={styles.url}>{url}</span>
        <span className={styles.ctrl} />
      </div>
      <div className={styles.body}>
        {variant === "editorial" && (
          <>
            <div className={styles.nav}>
              <i /> <i /> <i />
            </div>
            {headline("Studio for modern brands")}
            <div className={styles.row}>
              <div className={styles.img} />
              <div className={styles.lines}>
                <i /> <i /> <i />
              </div>
            </div>
          </>
        )}
        {variant === "dashboard" && (
          <div className={styles.dash}>
            <div className={styles.side}>
              <i /> <i /> <i /> <i />
            </div>
            <div className={styles.main}>
              <div className={styles.kpis}>
                <b /> <b /> <b />
              </div>
              <div className={styles.chart}>
                {[40, 62, 48, 75, 58, 88, 70, 96, 80, 64, 92, 84].map((h, i) => (
                  <span key={i} style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        {variant === "landing" && (
          <div className={styles.landing}>
            <div className={styles.orb} />
            {headline("Launch faster.")}
            <div className={styles.cta} />
          </div>
        )}
      </div>
    </div>
  );
}
