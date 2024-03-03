---
"atom.io": patch
---

🐛 The sourcemap that was being shipped to npm was deficient, and would indicate lines incorrectly in the debugger. The sourcemap is being removed for now. The built, but non-minified js will appear in the debugger instead.
