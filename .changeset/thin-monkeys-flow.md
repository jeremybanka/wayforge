---
"atom.io": patch
---

🐛 `atom.io/realtime-react`: Fix bug with `RealtimeContext` where a `socket.io` instance would be preemptively initialized and would remain complaining that it could not connect after being replaced.
