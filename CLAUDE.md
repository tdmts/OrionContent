# CLAUDE.md — OrionContent (Brightspace embedding + styleguide)

Guidance for Claude sessions working in this repo.

## What this repo is

OrionContent holds the **Brightspace embed wrapper** and the **rendered styleguide**. It holds no
course content, and it is no longer the source of truth for styling.

**Styling lives in `tdmts/OrionCSS`** — `style.css` and `main.js`. See that repo's `CLAUDE.md` for
the component catalogue and the page boilerplate. Course content lives in one repo per vak
(`tdmts/ICEES`, `tdmts/DeN`, `tdmts/Microcontrollers`).

**Never add course content here.** A page about a lab, a topic or an assignment belongs in its vak
repo. If you are about to create `ICEES/...` or `DeN/...` here, you are in the wrong repo.

## What lives here

- `index.html` — the Brightspace embed wrapper. **The only file ever pasted into Brightspace.**
  Copy it, point the `<iframe src>` at the page's GitHub Pages URL, paste. Everything else is
  served from GitHub and never uploaded.
- `orion-embed.css` — styles that wrapper, and nothing else.
- `template.html` — the rendered styleguide: every component with its exact markup. Read it before
  authoring a page, rather than reproducing markup from memory.
There are deliberately no stylesheet or script files here beyond `orion-embed.css`. `orion.css` and
`orion.js` used to live here as duplicates of OrionCSS and have been deleted — never reintroduce
them. A styling fix belongs in `OrionCSS/style.css` or `OrionCSS/main.js`.

## Writing a content page

Not here — in the vak repo. Use the boilerplate from `OrionCSS/CLAUDE.md`, which links
`https://tdmts.github.io/OrionCSS/style.css` and `.../main.js` by absolute URL.

A page is embedded in an iframe, so it must work standalone: no cross-page navigation, no shared
header or footer, no assumptions about a parent document.

## Editing template.html

`template.html` links `https://tdmts.github.io/OrionCSS/style.css` and `.../main.js` by absolute
URL, exactly like a real content page, so it renders against the same CSS students get and its
`<head>` is safe to copy.

A component added to OrionCSS must be documented here in the same change. A component absent from
`template.html` does not exist.

## Voice & language

- All content in **Dutch**.
- Address students with **`je`** (informal second person).
