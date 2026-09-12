---
"comline": patch
---

Return an always-present `warnings` array for unknown options and options invalid on the selected route. Malformed option assignments also produce warnings. Warnings include option spelling, word index within `argv.slice(2)`, and selected command context; consumed values follow the selected route’s grammar and do not produce warnings. Display messages escape argument control characters while structured fields retain raw input. Interpretation and completion defer warnings until the route is complete and error-free. Export `CliWarning`, reusable `formatWarnings`, and opt-in `logWarnings` with stderr output, custom logging, and color controls. Parsing does not automatically log warnings.
