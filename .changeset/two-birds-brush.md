---
"atom.io": patch
---

🐛 Fixed bug in AtomIO's core that would occur in situations where a package manager like pnpm installed multiple AtomIO instances for purposes of version safety/intercompatibility. This could lead to different `IMPLICIT.STORE`s being used on adjacent lines, and as a result, bizarre errors would be thrown. Resolved this by making the `IMPLICIT.STORE` discoverable on `globalThis.
