// Conteúdo centralizado — substitua aqui os placeholders pelos dados reais.

export type SectionId = "top" | "projects" | "capabilities" | "lab" | "about" | "contact";

export type MenuItem = {
  id: string;
  label: string;
  target: SectionId;
  meta: string;
  preview: "start" | "projects" | "services" | "about" | "lab" | "contact";
  primary?: boolean;
};

export const MENU: MenuItem[] = [
  { id: "start", label: "INICIAR EXPERIÊNCIA", target: "top", meta: "RUN / FULL EXPERIENCE", preview: "start", primary: true },
  { id: "projects", label: "PROJETOS", target: "projects", meta: "03 SELECTED / 2024—26", preview: "projects" },
  { id: "services", label: "SERVIÇOS", target: "capabilities", meta: "03 CATEGORIAS", preview: "services" },
  { id: "about", label: "SOBRE", target: "about", meta: "ENGINEER / DESIGNER", preview: "about" },
  { id: "lab", label: "LAB", target: "lab", meta: "EXPERIMENTS / WIP", preview: "lab" },
  { id: "contact", label: "CONTATO", target: "contact", meta: "RESPONSE < 24H", preview: "contact" },
];

// Anotações do menu — uma aleatória por carregamento (clique troca)
export const SPLASHES = [
  "TRY CLICKING THINGS.",
  "ENGINEERING PIXELS.",
  "SITES SHOULDN'T BE BORING.",
  "MADE IN BRAZIL.",
  "BUILT FOR THE WEB.",
  "EVERYTHING IS INTERACTIVE.",
  "PRESS ↑ ↓ IF YOU DARE.",
  "NOW WITH 100% MORE PIXELS.",
];

// Linhas exibidas na saída do main menu (≈1,5s no total)
export const menuExitLines = (targetLabel?: string) => [
  "INITIALIZING EXPERIENCE",
  targetLabel ? `LOADING ${targetLabel}` : "LOADING INTERACTIONS",
  "SYSTEM READY",
];

export const BOOT_LINES = [
  "INITIALIZING...",
  "LOADING PROJECTS",
  "LOADING INTERACTIONS",
  "SYSTEM READY",
  "WELCOME.",
];

export const PROCESS = [
  { word: "IDEIA", desc: "Tudo começa com um problema real e uma pergunta boa." },
  { word: "ESTRATÉGIA", desc: "Objetivos, público e arquitetura antes de qualquer pixel." },
  { word: "INTERFACE", desc: "Sistemas visuais claros, com hierarquia e intenção." },
  { word: "ENGENHARIA", desc: "Código limpo, performático e pronto para escalar." },
  { word: "PRODUTO", desc: "Algo vivo, no ar, gerando resultado." },
];

export type Project = {
  id: string;
  name: string;
  category: string;
  year: string;
  summary: string;
  stack: string[];
  /** "live": publicado; "soon": em pré-lançamento (sem link) */
  status: "live" | "soon";
  /** site publicado */
  url?: string;
  /** repositório público no GitHub (privados ficam sem link) */
  repo?: string;
  /** o site permite ser exibido dentro da janela (iframe)? */
  embeddable?: boolean;
  /** capturas emendadas da rolagem do site (public/projects) */
  preview?: { desktop: string; mobile: string };
};

// Projetos reais do GitHub (dustyfallengiela-png).
export const PROJECTS: Project[] = [
  {
    id: "new-alpha",
    name: "NEW ALPHA",
    category: "Landing page",
    year: "2026",
    summary:
      "Landing page de lançamento de um guia digital para homens acima dos 40 — narrativa, oferta e conversão em uma única página.",
    stack: ["React", "Vite", "Tailwind CSS"],
    status: "live",
    url: "https://new-alpha-zeta.vercel.app",
    repo: "https://github.com/dustyfallengiela-png/new-alpha",
    embeddable: true,
    preview: { desktop: "/projects/new-alpha-desktop.webp", mobile: "/projects/new-alpha-mobile.webp" },
  },
  {
    id: "psiorienta",
    name: "PSIORIENTA",
    category: "Site institucional",
    year: "2026",
    summary:
      "Site oficial da formação em Transtornos de Personalidade da PsiOrienta — conteúdo clínico denso organizado em uma experiência editorial.",
    stack: ["Next.js", "GSAP", "Lenis", "Tailwind CSS"],
    status: "live",
    url: "https://psiorienta-site-v2.vercel.app",
    // o site bloqueia exibição em iframe (X-Frame-Options): mostra a captura
    embeddable: false,
    preview: { desktop: "/projects/psiorienta-desktop.webp", mobile: "/projects/psiorienta-mobile.webp" },
  },
  {
    id: "maldito",
    name: "MALDITO.",
    category: "E-commerce",
    year: "2026",
    summary: "Loja de camisetas oversized estampadas, com visualização de produto em 3D. Em pré-lançamento.",
    stack: ["Next.js", "Tailwind CSS", "model-viewer (3D)"],
    status: "soon",
  },
];

// As 3 categorias de serviço — exatamente estas, nesta ordem.
export const SERVICES = [
  {
    title: "ENGENHARIA DE SITES",
    summary: "Desenvolvimento e confecção de experiências web completas para pessoas, profissionais e empresas.",
    desc: "Sites desenvolvidos sob medida, combinando engenharia, design e interação para transformar ideias, marcas e negócios em experiências digitais.",
    includes: ["SITES INSTITUCIONAIS", "SITES PESSOAIS & PORTFÓLIOS", "E-COMMERCE", "LANDING PAGES"],
    demo: "web",
  },
  {
    title: "IDENTIDADE VISUAL",
    summary: "Design e desenvolvimento da identidade visual de produtos, marcas e negócios.",
    desc: "Construção de identidades que transformam ideias em marcas reconhecíveis, consistentes e preparadas para se comunicar no ambiente digital.",
    includes: ["IDENTIDADE VISUAL", "DIREÇÃO CRIATIVA", "LOGOTIPO & SISTEMA VISUAL", "APLICAÇÕES DE MARCA"],
    demo: "brand",
  },
  {
    title: "EDIÇÃO DE VÍDEO",
    summary:
      "Serviço de edição profissional de vídeo sob demanda, principalmente direcionado para criadores de conteúdo, YouTubers, streamers e marcas digitais.",
    desc: "Edição profissional pensada para ritmo, retenção e identidade, adaptada à linguagem de cada criador e plataforma.",
    includes: ["YOUTUBE", "STREAMERS", "SHORT-FORM CONTENT", "CONTEÚDO PARA REDES SOCIAIS"],
    demo: "video",
  },
] as const;

// Canais de contato — única fonte para todo o site (CTA, seção Contato, terminal).
const WHATSAPP_NUMBER = "5511953993242"; // formato internacional, sem símbolos
const WHATSAPP_MESSAGE = "Olá Antonio, tenho uma ideia.";

export const CONTACT = {
  whatsapp: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`,
  whatsappDisplay: "(11) 95399-3242",
  instagram: "https://www.instagram.com/antoniomargiela.code/",
  instagramHandle: "@antoniomargiela.code",
  // Sem e-mail por enquanto: com `null`, o canal some da interface.
  email: null as string | null,
};
