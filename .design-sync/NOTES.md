# design-sync notes (Family Board → Claude Design)

- **This repo is an app, not a component library.** There is no dist/ or .d.ts. The sync builds its own package:
  `npx vite build --config .design-sync/vite.lib.config.mjs && node .design-sync/build-css.mjs` → `.ds-lib/` (gitignored).
  Vite (not esbuild) is needed because `Icon.jsx` uses `import.meta.glob(... ?raw)` and window icons import SVGs.
  Then: `node .ds-sync/package-build.mjs --config .design-sync/config.json --node-modules ./node_modules --entry ./.ds-lib/index.js --out ./ds-bundle`.
- **Exports** are chosen in `.design-sync/src/index.jsx` (re-exports from src/, no app code changed). `FamilyBoardRoot` (div.pl, dir=rtl) is the provider.
- **Types are hand-written** in `.design-sync/src/index.d.ts`. When a component's props change in src/, update this file too, or the design agent gets a wrong API.
- **CSS:** `build-css.mjs` concatenates global.css + plain.css + theme-pixel.css + lab.css and rewrites `:root[data-theme="pixel"]` → `:root`, so the pixel theme is the default in designs. Fonts (Assistant, Silkscreen) come from a Google Fonts `@import` at the top.
- **Groups** come from stub docs in `.design-sync/docs/<Name>.md` (frontmatter `category`), via `docsDir: ../.design-sync/docs` (relative to `.ds-lib`).
- **Modal preview** wraps the modal in a `transform` box so its position:fixed overlay stays inside the card. Inputs need `type="text"` to get the app's input style.
- **No playwright/chromium on this machine.** The user chose (2026-10-08) to verify in the in-app browser instead of installing it: validate runs with `--no-render-check`, the driver's capture stage fails (exit 2) — expected. Verification was done by opening every card and `?story=` in the built-in browser.

## Known render warns
- `[TOKENS_MISSING]` --member-color, --member-shadow, --fr-*: set at runtime by JS (member color, applied frame). Expected.
- `[RENDER_SKIPPED]`: see above.

## Re-sync risks
- `index.d.ts` is manual: it silently drifts when component props change in src/.
- `build-css.mjs` relies on the theme selector string `:root[data-theme="pixel"]`; if theme-pixel.css changes how it scopes, designs fall back to the plain theme.
- Frame variants (data-frame on html, from the style-guide lab) are NOT applied in designs; cards use the theme's default frame.
- Renders were checked by eye, not by the headless render check.
