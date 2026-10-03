# Antonio Margiela — Portfolio (BUILD 01)

Next.js 16 · React 19 · GSAP (ScrollTrigger) · Lenis. Sem Three.js: o globo é Canvas 2D.

```
npm run dev     # http://localhost:3000
npm run build
```

## Estrutura

- `lib/content.ts` — **todo o conteúdo editável** (menu, splash texts, projetos, serviços, links de contato/WhatsApp)
- `components/Experience.tsx` — orquestra as fases `menu → boot → main` e o contexto de navegação
- `components/menu/` — Main Menu, previews de fundo por opção, HUD
- `components/transition/BootSequence.tsx` — INITIALIZING… + cortina
- `components/sections/` — Manifesto, Process, Projects, Capabilities, Lab, About, Contact
- `components/ui/` — Globe, Cursor, Terminal, Scramble, MockWindow, Words
- `components/lab/` — experimentos (partículas, tipografia variável)

## Easter eggs

- `↑ ↓ ENTER ESC` no menu; `ESC` no conteúdo volta ao menu
- `>_` ou tecla `` ` `` abre o terminal (`help`, `projects`, `services`, `about`, `contact`, `lab`, `hire`, `menu`, `clear`)
- clicar no splash text troca a frase; clicar no globo dá um impulso
- clicar 5× no nome no menu → modo blueprint (contornos do layout)
