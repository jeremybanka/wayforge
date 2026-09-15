---
"comline": minor
---

Configuration discovery is now opt-in: CLIs without `discoverConfigPath` no longer read `<cli-name>.config.json`. To retain that behavior, set `discoverConfigPath: () => path.join(process.cwd(), "<cli-name>.config.json")`.

Config paths can point to programmatic TypeScript or JavaScript modules as well as JSON. Export an options object as the module's default export (or `module.exports` for CommonJS); Comline validates it with the selected route's schema and lets command-line options override it. Module loading is synchronous and uses the host runtime's TypeScript support and module cache.
