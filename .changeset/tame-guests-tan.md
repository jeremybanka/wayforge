---
"atom.io": patch
---

🚀 `atom.io/react` Fixed a performance mistake where unstable references were being passed to `React.useSyncExternalStore()`. As a result, each render would cause react to re-subscribe to any states being observed with `useO()` or `useLoadable()`.
