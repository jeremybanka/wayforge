# Tempest Games

React and TypeScript frontend, Bun servers, and PostgreSQL storage for Tempest Games.

Run commands from the repository root after `pnpm install`:

- `pnpm --filter tempest.games dev` starts the development servers.
- `pnpm --filter tempest.games check` runs the package's static checks, including Lasertag.
- `pnpm --filter tempest.games check:lasertag` checks component CSS selector reachability and ownership.
- `pnpm --filter tempest.games test` runs tests once with the test database setup.
- `pnpm --filter tempest.games build` builds the browser application and Bun entrypoints.

See [repository commands](../../docs/commands.md) for workspace-wide equivalents.

## Component styling

The browser DOM uses [Lasertag](https://github.com/jeremybanka/lasertag): each exported component owns a same-named sibling CSS Module, imports it as `css`, and applies its only exported class to a matching custom root. For example, `AccountView.tsx` renders `<account-view className={css.class}>` and owns `AccountView.module.css`.

Keep route layout and control styles with the component that renders them. Use native form controls and semantic elements inside named roots, and use nested direct-child selectors to describe the owned DOM. `globals.css` contains the reset, shared color tokens, and font import.

SVG assets and React Three Fiber scene components retain their intrinsic roots. Motion namespaces assert stable intrinsic HTML roots; narrowly explained CSS directives cover animation and Floating UI subtrees that static analysis cannot fully inspect. See [frontend authoring guidance](AGENTS.md) for the complete conventions and renderer exceptions.

Lasertag's JSX and CSS Module entrypoints are imported before `vite/client` in `vite-env.d.ts` so CSS Modules retain the single `class` type rather than Vite's unrestricted class dictionary. These declaration imports add no browser runtime dependency.
