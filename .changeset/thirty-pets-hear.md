---
"atom.io": patch
---

🏷️ `atom.io/realtime-client` and `atom.io/realtime-react`: broaden types accepted by the `pullFamilyMember` and `usePullFamilyMember` functions. Instead of just accepting `AtomToken`, they now accept `StateToken`, allowing for `SelectorToken` and `AtomToken` to be used interchangeably.
