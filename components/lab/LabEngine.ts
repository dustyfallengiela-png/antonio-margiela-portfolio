/**
 * Motor do AM / LAB — Canvas 2D, um único sistema de partículas.
 *
 * As MESMAS partículas servem aos dois experimentos de pontos:
 *  - WAVE:    grade com mola; o cursor empurra, arrastar distorce, clique gera onda radial
 *  - GRAVITY: um subconjunto vira "nodes" livres, atraídos/orbitando o cursor, ligados por linhas
 *  - TYPE:    as partículas se apagam (a tipografia é DOM, ver LabType)
 * Trocar de modo reaproveita posições: a grade se solta em nodes e os nodes voltam à grade.
 * Easter egg: formAM() reorganiza as partículas em "AM" por ~1s.
 */

export type LabMode = "wave" | "gravity" | "type";

export type LabPointer = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  inside: boolean;
  down: boolean;
};

export type LabStats = {
  mode: LabMode;
  force: number;
  radius: number;
  fps: number;
  nodes: number;
};

type Opts = { mobile: boolean; reduced: boolean; density: number; nodes: number };

const FG = "rgb(236,235,229)";
const ACC = "rgb(255,90,31)";

type Ripple = { x: number; y: number; t: number };

export class LabEngine {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;

  private n = 0;
  private x = new Float32Array(0);
  private y = new Float32Array(0);
  private vx = new Float32Array(0);
  private vy = new Float32Array(0);
  private hx = new Float32Array(0);
  private hy = new Float32Array(0);
  private a = new Float32Array(0);
  private isNode = new Uint8Array(0);
  private orbit = new Int8Array(0);
  private nodes = new Int32Array(0);
  private shuffled = new Int32Array(0);

  private mode: LabMode = "wave";
  private ripples: Ripple[] = [];
  private formUntil = 0;
  private formSlot = new Int32Array(0);
  private ftx = new Float32Array(0);
  private fty = new Float32Array(0);
  private bootT = -1;
  /** a grade só aparece depois da entrada do LAB */
  private revealed = false;

  private raf = 0;
  private running = false;
  private last = 0;
  private frame = 0;
  private force = 0;
  /** força reportada pelo experimento TYPE (DOM) */
  externalForce = 0;

  readonly stats: LabStats = { mode: "wave", force: 0, radius: 0, fps: 60, nodes: 0 };

  constructor(
    private canvas: HTMLCanvasElement,
    private pointer: LabPointer,
    private opts: Opts,
    private onFrame?: (s: LabStats, frame: number) => void
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D indisponível");
    this.ctx = ctx;
    this.resize();
  }

  /* ---------------- configuração ---------------- */

  private get waveR() {
    return this.opts.mobile ? 120 : 170;
  }
  private get gravR() {
    return this.opts.mobile ? 190 : 280;
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    // celular: 1.5x já é nítido e reduz ~44% dos pixels desenhados por quadro
    this.dpr = Math.min(window.devicePixelRatio || 1, this.opts.mobile ? 1.5 : 2);
    this.w = Math.max(1, r.width);
    this.h = Math.max(1, r.height);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);

    const gap = Math.max(14, Math.min(34, Math.sqrt((this.w * this.h) / this.opts.density)));
    const cols = Math.max(2, Math.floor(this.w / gap));
    const rows = Math.max(2, Math.floor(this.h / gap));
    const offX = (this.w - (cols - 1) * gap) / 2;
    const offY = (this.h - (rows - 1) * gap) / 2;
    const n = cols * rows;
    this.n = n;
    this.x = new Float32Array(n);
    this.y = new Float32Array(n);
    this.vx = new Float32Array(n);
    this.vy = new Float32Array(n);
    this.hx = new Float32Array(n);
    this.hy = new Float32Array(n);
    this.a = new Float32Array(n);
    this.isNode = new Uint8Array(n);
    this.orbit = new Int8Array(n);
    this.formSlot = new Int32Array(n).fill(-1);
    let k = 0;
    for (let row = 0; row < rows; row++) {
      for (let c = 0; c < cols; c++, k++) {
        this.x[k] = this.hx[k] = offX + c * gap;
        this.y[k] = this.hy[k] = offY + row * gap;
        this.a[k] = 0;
        this.orbit[k] = Math.random() < 0.5 ? -1 : 1;
      }
    }
    // nodes espalhados pela grade (passo fixo) — viram o sistema GRAVITY
    const gN = Math.min(n, this.opts.nodes);
    this.nodes = new Int32Array(gN);
    const step = n / gN;
    for (let i = 0; i < gN; i++) {
      const idx = Math.min(n - 1, Math.floor(i * step + step / 2));
      this.nodes[i] = idx;
      this.isNode[idx] = 1;
    }
    // ordem aleatória estável para o easter egg
    this.shuffled = new Int32Array(n);
    for (let i = 0; i < n; i++) this.shuffled[i] = i;
    for (let i = n - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const t = this.shuffled[i];
      this.shuffled[i] = this.shuffled[j];
      this.shuffled[j] = t;
    }
    if (this.mode === "gravity") this.releaseNodes();
    this.stats.nodes = this.mode === "gravity" ? gN : n;
    this.draw(performance.now());
  }

  /* ---------------- controle ---------------- */

  setMode(m: LabMode) {
    if (m === this.mode) return;
    const prev = this.mode;
    this.mode = m;
    this.stats.mode = m;
    if (m === "gravity" && prev !== "gravity") this.releaseNodes();
    this.stats.nodes = m === "gravity" ? this.nodes.length : m === "wave" ? this.n : 0;
  }

  /** solta os nodes da grade com uma velocidade inicial pequena */
  private releaseNodes() {
    for (const i of this.nodes) {
      this.vx[i] += (Math.random() - 0.5) * 1.4;
      this.vy[i] += (Math.random() - 0.5) * 1.4;
    }
  }

  /** acende a grade do centro para fora (entrada do LAB) */
  boot() {
    this.revealed = true;
    this.bootT = performance.now();
  }

  press(x: number, y: number) {
    const now = performance.now();
    if (this.mode === "wave") {
      this.ripples.push({ x, y, t: now });
      if (this.ripples.length > 5) this.ripples.shift();
    } else if (this.mode === "gravity") {
      // explosão: os nodes próximos escapam
      const R = this.gravR * 0.8;
      for (const i of this.nodes) {
        const dx = this.x[i] - x, dy = this.y[i] - y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < R) {
          const f = (1 - d / R) * 7;
          this.vx[i] += (dx / d) * f;
          this.vy[i] += (dy / d) * f;
        }
      }
      this.ripples.push({ x, y, t: now });
      if (this.ripples.length > 5) this.ripples.shift();
    }
  }

  /** easter egg: partículas formam "AM" por ~1s */
  formAM() {
    const ow = Math.max(2, Math.floor(this.w / 2)), oh = Math.max(2, Math.floor(this.h / 2));
    const off = document.createElement("canvas");
    off.width = ow;
    off.height = oh;
    const c = off.getContext("2d", { willReadFrequently: true });
    if (!c) return;
    const family = getComputedStyle(document.body).fontFamily || "sans-serif";
    const size = Math.min(oh * 0.62, ow * 0.4);
    c.font = `800 ${size}px ${family}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = "#fff";
    c.fillText("AM", ow / 2, oh / 2);
    const data = c.getImageData(0, 0, ow, oh).data;
    const pts: number[] = [];
    for (let yy = 0; yy < oh; yy += 2) {
      for (let xx = 0; xx < ow; xx += 2) {
        if (data[(yy * ow + xx) * 4 + 3] > 128) pts.push(xx * 2, yy * 2);
      }
    }
    const want = Math.min(this.n, this.opts.mobile ? 520 : 1100, pts.length / 2);
    if (want < 10) return;
    const stride = pts.length / 2 / want;
    this.ftx = new Float32Array(want);
    this.fty = new Float32Array(want);
    for (let k = 0; k < want; k++) {
      const p = Math.floor(k * stride) * 2;
      this.ftx[k] = pts[p] + (Math.random() - 0.5) * 2;
      this.fty[k] = pts[p + 1] + (Math.random() - 0.5) * 2;
    }
    // no GRAVITY os nodes visíveis entram primeiro
    this.formSlot.fill(-1);
    let k = 0;
    if (this.mode === "gravity") for (const i of this.nodes) if (k < want) this.formSlot[i] = k++;
    for (let s = 0; s < this.n && k < want; s++) {
      const i = this.shuffled[s];
      if (this.formSlot[i] === -1) this.formSlot[i] = k++;
    }
    this.formUntil = performance.now() + 1150;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      const dt = Math.min((now - this.last) / 1000, 0.05);
      this.last = now;
      const fps = dt > 0 ? 1 / dt : 60;
      this.stats.fps += (fps - this.stats.fps) * 0.08;
      this.step(dt * 60, now);
      this.draw(now);
      this.frame++;
      this.onFrame?.(this.stats, this.frame);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /* ---------------- física ---------------- */

  private step(t: number, now: number) {
    const p = this.pointer;
    const formOn = now < this.formUntil;
    if (this.formUntil > 0 && !formOn) {
      // dissolve: no GRAVITY os nodes são soltos de novo
      this.formUntil = 0;
      this.formSlot.fill(-1);
      if (this.mode === "gravity") this.releaseNodes();
    }
    this.ripples = this.ripples.filter((r) => now - r.t < 1700);

    const reduced = this.opts.reduced;
    const R = this.waveR, R2 = R * R, RG = this.gravR;
    const grav = this.mode === "gravity" && !formOn;
    const damp = Math.pow(0.88, t);
    const gDamp = Math.pow(0.992, t);
    const ease = Math.min(1, 0.08 * t);
    const cx = this.w / 2, cy = this.h / 2;
    const booting = this.bootT > 0;
    const bootAge = now - this.bootT;
    if (booting && bootAge > 1800) this.bootT = -1;

    let disp = 0, speed = 0;

    for (let i = 0; i < this.n; i++) {
      const node = this.isNode[i] === 1;
      const slot = formOn ? this.formSlot[i] : -1;

      // ---- opacidade alvo
      let ta: number;
      if (formOn) ta = slot >= 0 ? 1 : this.mode === "wave" ? 0.12 : 0;
      else ta = this.mode === "wave" ? 1 : this.mode === "gravity" ? (node ? 1 : 0) : 0;
      if (!this.revealed) ta = 0;
      if (booting) {
        const d = Math.hypot(this.hx[i] - cx, this.hy[i] - cy);
        ta *= Math.max(0, Math.min(1, (bootAge - d * 0.9) / 380));
      }
      this.a[i] += (ta - this.a[i]) * (booting ? 0.3 : ease);

      // ---- easter egg: vai até o alvo
      if (slot >= 0) {
        this.x[i] += (this.ftx[slot] - this.x[i]) * Math.min(1, 0.16 * t);
        this.y[i] += (this.fty[slot] - this.y[i]) * Math.min(1, 0.16 * t);
        this.vx[i] = this.vy[i] = 0;
        continue;
      }

      // ---- GRAVITY: nodes livres
      if (grav && node) {
        if (p.inside) {
          const dx = p.x - this.x[i], dy = p.y - this.y[i];
          const d = Math.hypot(dx, dy) + 0.001;
          if (d < RG) {
            const dd = Math.max(d, 26);
            const g = Math.min(0.55, ((p.down ? 2.6 : 1) * 560) / (dd * dd));
            this.vx[i] += (dx / d) * g * t;
            this.vy[i] += (dy / d) * g * t;
            // componente tangencial: alguns entram em órbita
            const tg = this.orbit[i] * g * 0.9;
            this.vx[i] += (-dy / d) * tg * t;
            this.vy[i] += (dx / d) * tg * t;
          }
        }
        if (!reduced) {
          this.vx[i] += Math.cos(now * 0.0004 + i * 1.7) * 0.006 * t;
          this.vy[i] += Math.sin(now * 0.00035 + i * 2.3) * 0.006 * t;
        }
        this.vx[i] *= gDamp;
        this.vy[i] *= gDamp;
        const sp = Math.hypot(this.vx[i], this.vy[i]);
        if (sp > 7) {
          this.vx[i] *= 7 / sp;
          this.vy[i] *= 7 / sp;
        }
        speed += sp;
        this.x[i] += this.vx[i] * t;
        this.y[i] += this.vy[i] * t;
        // sai de um lado, volta pelo outro
        const m = 24;
        if (this.x[i] < -m) this.x[i] = this.w + m;
        else if (this.x[i] > this.w + m) this.x[i] = -m;
        if (this.y[i] < -m) this.y[i] = this.h + m;
        else if (this.y[i] > this.h + m) this.y[i] = -m;
        continue;
      }

      // partícula invisível e parada: não gasta física
      if (ta === 0 && this.a[i] < 0.01) {
        this.x[i] = this.hx[i];
        this.y[i] = this.hy[i];
        this.vx[i] = this.vy[i] = 0;
        continue;
      }

      // ---- WAVE: mola até a posição de origem
      this.vx[i] += (this.hx[i] - this.x[i]) * 0.022 * t;
      this.vy[i] += (this.hy[i] - this.y[i]) * 0.022 * t;

      if (p.inside && this.mode === "wave") {
        const dx = this.x[i] - p.x, dy = this.y[i] - p.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < R2 && d2 > 0.01) {
          const d = Math.sqrt(d2);
          let f = 1 - d / R;
          f *= f;
          if (p.down) {
            // arrastar: o sistema acompanha o gesto
            this.vx[i] += p.vx * f * 0.3;
            this.vy[i] += p.vy * f * 0.3;
          } else {
            this.vx[i] += (dx / d) * f * 1.8 * t;
            this.vy[i] += (dy / d) * f * 1.8 * t;
          }
        }
      }

      for (const r of this.ripples) {
        const age = Math.max(0, now - r.t); // relógios distintos (evento × quadro): nunca negativo
        const rr = age * 0.55;
        const dx = this.x[i] - r.x, dy = this.y[i] - r.y;
        const d = Math.hypot(dx, dy) || 1;
        const diff = Math.abs(d - rr);
        if (diff < 36) {
          const imp = (1 - diff / 36) * (1 - age / 1700) * 2.2;
          this.vx[i] += (dx / d) * imp;
          this.vy[i] += (dy / d) * imp;
        }
      }

      this.vx[i] *= damp;
      this.vy[i] *= damp;
      this.x[i] += this.vx[i] * t;
      this.y[i] += this.vy[i] * t;
      disp += Math.abs(this.x[i] - this.hx[i]) + Math.abs(this.y[i] - this.hy[i]);
    }

    // velocidade do ponteiro decai quando ele para
    p.vx *= Math.pow(0.8, t);
    p.vy *= Math.pow(0.8, t);

    let target: number;
    if (this.mode === "wave") target = Math.min(1, disp / Math.max(1, this.n) / 6);
    else if (this.mode === "gravity") target = Math.min(1, speed / Math.max(1, this.nodes.length) / 3);
    else target = this.externalForce;
    this.force += (target - this.force) * 0.1;
    this.stats.force = this.force;
    this.stats.radius = this.mode === "gravity" ? RG : this.mode === "wave" ? R : 300;
  }

  /* ---------------- desenho ---------------- */

  private draw(now: number) {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    const p = this.pointer;
    const formOn = now < this.formUntil;
    const grav = this.mode === "gravity" && !formOn;

    // anéis das ondas
    for (const r of this.ripples) {
      const age = Math.max(0, now - r.t); // relógios distintos (evento × quadro): nunca negativo
      ctx.globalAlpha = Math.max(0, 0.5 * (1 - age / 1700));
      ctx.strokeStyle = ACC;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(r.x, r.y, age * 0.55, 0, Math.PI * 2);
      ctx.stroke();
    }

    // GRAVITY: conexões finas entre nodes próximos
    if (grav) {
      const L = this.opts.mobile ? 80 : 110;
      const L2 = L * L;
      const buckets = [new Path2D(), new Path2D(), new Path2D()];
      const ns = this.nodes;
      for (let a = 0; a < ns.length; a++) {
        const i = ns[a];
        if (this.a[i] < 0.05) continue;
        for (let b = a + 1; b < ns.length; b++) {
          const j = ns[b];
          const dx = this.x[i] - this.x[j], dy = this.y[i] - this.y[j];
          const d2 = dx * dx + dy * dy;
          if (d2 < L2) {
            const q = Math.min(2, Math.floor((d2 / L2) * 3));
            buckets[q].moveTo(this.x[i], this.y[i]);
            buckets[q].lineTo(this.x[j], this.y[j]);
          }
        }
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = FG;
      [0.32, 0.18, 0.08].forEach((al, q) => {
        ctx.globalAlpha = al;
        ctx.stroke(buckets[q]);
      });
      // linhas do cursor para os nodes capturados
      if (p.inside) {
        const near = new Path2D();
        const R = this.gravR * 0.55;
        for (const i of ns) {
          const d = Math.hypot(this.x[i] - p.x, this.y[i] - p.y);
          if (d < R) {
            near.moveTo(p.x, p.y);
            near.lineTo(this.x[i], this.y[i]);
          }
        }
        ctx.globalAlpha = 0.28;
        ctx.strokeStyle = ACC;
        ctx.stroke(near);
      }
    }

    // partículas — passe 1: off-white, passe 2: laranja (deslocadas / capturadas)
    const accent: number[] = [];
    ctx.fillStyle = FG;
    let lastA = -1;
    for (let i = 0; i < this.n; i++) {
      const al = this.a[i];
      if (al < 0.02) continue;
      const node = this.isNode[i] === 1 && grav;
      let hot: boolean;
      if (node) hot = p.inside && Math.hypot(this.x[i] - p.x, this.y[i] - p.y) < this.gravR * 0.4;
      else if (formOn) hot = false;
      else hot = Math.abs(this.x[i] - this.hx[i]) + Math.abs(this.y[i] - this.hy[i]) > 13;
      if (hot) {
        accent.push(i);
        continue;
      }
      const ga = al * (node ? 0.9 : formOn ? 0.95 : 0.5);
      if (ga !== lastA) {
        ctx.globalAlpha = ga;
        lastA = ga;
      }
      const s = node ? 2.4 : 1.6;
      ctx.fillRect(this.x[i] - s / 2, this.y[i] - s / 2, s, s);
    }
    ctx.fillStyle = ACC;
    for (const i of accent) {
      ctx.globalAlpha = this.a[i];
      const s = this.isNode[i] && grav ? 2.8 : 2;
      ctx.fillRect(this.x[i] - s / 2, this.y[i] - s / 2, s, s);
    }

    // anel de influência ao redor do cursor
    if (p.inside && this.mode !== "type" && !formOn) {
      const R = this.mode === "gravity" ? this.gravR : this.waveR;
      ctx.globalAlpha = p.down ? 0.45 : 0.2;
      ctx.strokeStyle = p.down ? ACC : FG;
      ctx.setLineDash([2, 5]);
      ctx.beginPath();
      ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.globalAlpha = 1;
  }
}
