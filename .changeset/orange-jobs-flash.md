---
"atom.io": patch
---

✨ `atom.io/eslint-plugin`: Added an option to the rule `explicit-state-types` called `permitAnnotation`. When enabled, this rule is satisfied by deliberate, top-level annotations of your state variables. This may be the preferred style in codebases where `isolatedDeclarations` are required by TypeScript anyway, as it removes the redundant need for both annotations and type parameters on states.
