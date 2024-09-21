---
"atom.io": patch
---

`atom.io/realtime-testing` The `teardown()` function for tests now returns a Promise<void>, carried through from awaiting `Server.close(): Promise<void>` in `socket.io@4.8.0`.
