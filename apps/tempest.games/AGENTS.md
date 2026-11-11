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

## SPA runtime and development

- Keep atom, selector, family, and timeline definitions in state or service modules outside component-only TSX files. Component edits can then hot-remount against the existing store; state-definition and mixed-module edits intentionally reload the page. Explicitly disposed transient family members reset on hot remount, while persistent model state survives.
- Use canonical application keys, including tuples for compound identities. A keyed component can read `props.key` and bind family hooks to it during setup; change the key to select another member. Use `useId()` when an instance has no application identity, and dispose its transient family members through `useDisposal()` on cleanup.
- Use `onCommit` for work that needs published refs, restored form values, or updated DOM. Return cleanup from the callback for observers and timers it owns. Floating UI's first position resolves asynchronously, so initial popover focus still waits for visibility rather than assuming the commit has positioned it.

The installed [SPA guide](node_modules/atom.io/docs/agent/packages/spa.md) and [Vite guide](node_modules/atom.io/docs/agent/packages/spa-vite.md) describe the current contracts, controlled form behavior, and hot-reload boundaries.
