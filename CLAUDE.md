# CLAUDE.md — OrionContent (shared asset hub)

Guidance for Claude sessions working in this repo.

## What this repo is

**OrionContent is the shared styleguide and asset hub for all Orion course sites. It holds no course
content.** Course pages live in one repo per vak, and each of them links back here over GitHub Pages:

| Repo | Vak | Pages URL |
|---|---|---|
| `tdmts/ICEES` | ICEES | `https://tdmts.github.io/ICEES/` |
| `tdmts/DeN` | Datacommunicatie en Netwerken | `https://tdmts.github.io/DeN/` |
| `tdmts/Microcontrollers` | Microcontrollers | `https://tdmts.github.io/Microcontrollers/` |

One repo per vak is deliberate: collaborators are added to a single course and cannot affect another
course's content. This hub stays owned by the course lead and is consumed read-only by the others.

**Never add course content to this repo.** A page about a lab, a topic, or an assignment belongs in
that vak's repo. If you are about to create `ICEES/...` or `DeN/...` here, you are in the wrong repo.

## What lives here

- `orion.css` — the component stylesheet (115 classes). The single source of truth for styling.
- `orion.js` — auto-wires components by class name on load.
- `orion-embed.css` — styles the Brightspace iframe wrapper only.
- `template.html` — the styleguide: every component with its exact markup.
- `index.html` — the Brightspace embed wrapper (see below).

## How a page reaches a student

A content page is pushed to its vak repo → served by GitHub Pages → embedded in a Brightspace topic
via `index.html`. **`index.html` is the only file ever pasted into Brightspace.** Copy it, point the
`<iframe src>` at the page's Pages URL, paste. Every other file is served from GitHub, never uploaded.

A page must therefore work standalone inside an iframe — no cross-page navigation, no shared header
or footer, no assumptions about a parent document.

## Boilerplate for a content page (authored in a vak repo)

```html
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>...</title>
    <link rel="stylesheet" href="https://tdmts.github.io/OrionContent/orion.css">
    <script type="text/javascript" src="https://tdmts.github.io/OrionContent/orion.js"></script>
</head>
<body>
    <div class="container">
        <h1>...</h1>
    </div>
</body>
</html>
```

Always use the **absolute GitHub Pages URL** for `orion.css` / `orion.js`. Relative paths work only
inside `template.html`, which sits next to them in this repo. A content page in another repo that
uses a relative path will render unstyled.

Do not link `https://tdmts.github.io/OrionCSS/style.css`. That repo is a retired 70-class subset of
`orion.css` and is being archived.

**Filenames:** PascalCase Dutch nouns — `Studiemateriaal.html`, `Evaluatie.html`,
`VeiligheidOrdeEnNetheid.html`.

## Components — `template.html` is the source of truth

Before authoring, **read `template.html`** for the exact markup of any component you intend to use.
Don't reproduce component markup from memory or from this file — it will drift. Prefer an existing
component over inventing custom HTML/CSS. If nothing fits, ask before adding a new class.

- `.info-box` with `.info-title` variants `remark` / `warning` / `tip` / `evaluation` — callouts
- `.checklist` — material lists, prerequisites
- `.code-wrapper` with `.language-*`, `.linenumbers`, `.show-language` — code blocks
- `.terminal-window` + `.term-line` / `.term-cmd` / `.term-out` — shell sessions
- `.config-window` + `.conf-line.new` / `.conf-line.mod` — config file diffs
- `.accordion-container` / `.accordion-item` — collapsible sections (FAQ, optional reading)
- `.steps-container` / `.step-item` — step-by-step walkthrough wizard
- `.spoiler-container` — hidden answer / solution reveal
- `.download-container` — file downloads with instructions
- `.figure-zoom` — zoomable images with captions
- `.stl-viewer` (`data-src="..."`) — 3D STL preview
- `.math-tex` — inline / block math (MathJax)
- `.json-wrapper` — pretty-printed collapsible JSON
- `.table-responsive.table-spacer` + `.table-header-custom` — styled tables

Components auto-activate via class names — `orion.js` wires them up on load. No manual JS needed in
content pages.

## Voice & language

- All content in **Dutch**.
- Address students with **`je`** (informal second person), e.g. *"Doe je dit toch dan is je score voor
  dit labo = 0"*.

## Changing shared assets

Everything here is consumed by every vak repo, so a change ripples across every course at once.

- Never restyle `orion.css` to fix a single page — report the issue instead.
- Adding a component: add the CSS, wire it in `orion.js` if it needs behaviour, and document it in
  `template.html` in the same commit. A component absent from `template.html` does not exist.
- Never remove or rename an existing class without checking the consuming repos first. Content pages
  reference these names by absolute URL and will break silently on the live site.
- Any `window.qrData = { ... }` block holds real Orion/Brightspace integration IDs (`gradeId`,
  `orgunitid`, `assignment_id`). Leave untouched.

## Good examples

- `template.html` — every component, with markup. Start here.
