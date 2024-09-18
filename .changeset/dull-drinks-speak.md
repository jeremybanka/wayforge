---
"atom.io": patch
---

🐛 `atom.io/realtime-client` useSingleEffect used process.env to check whether it should run effects twice, which could cause errors in the browser.
