# Tempest frontend styles

Follow Lasertag's authoring conventions for browser DOM components in `src/frontend`:

- Export one component per TSX file. Give it a multiword name, an exact sibling `.module.css`, and its matching kebab-case custom root with `className={css.class}`.
- Import only the component's own CSS Module as `css`. Export only `.class` from that module and mirror locally rendered DOM with nested tag and direct-child selectors.
- Keep styles inside their component's ownership boundary. Route views own their forms, controls, and layout; the application shell does not style imported views.
- Prefer semantic HTML and native form controls inside component roots. Use descriptive custom tags for local layout, avoid `div`, and use `header`, `main`, and `footer` only as a sibling group with at least two of those landmarks and no unrelated element siblings.
- Keep `globals.css` for fonts, resets, and shared tokens. Keep component appearance and layout in CSS Modules.
- SVG asset functions and Three.js scene components keep renderer-specific intrinsic roots. The ESLint exceptions list their exact files; the DOM components around the canvas and game controls still follow Lasertag.
- Describe stable external intrinsic roots through namespaces such as `svg` or `section`. Explain unavoidable runtime ownership uncertainty in narrowly scoped `@lasertag-expect-error` or diagnostic-specific disable/enable comments. Do not suppress unused selectors or bypass component ownership to share styles.
- After changing component markup or styles, run `pnpm --filter tempest.games check:lasertag` and the relevant package checks. Use `lasertag fix` only for intentional selector cleanup, then review its diff.

The installed package includes [the authoring guide](../../node_modules/lasertag/docs/lasertag-guide.md) and [the tooling guide](../../node_modules/lasertag/docs/tooling-guide.md).
