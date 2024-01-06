---
"atom.io": patch
---

✨ `atom.io/realtime-server` has a new hook `useSyncTransaction` that can be used for synchronizing state between client and server in a transaction-driven way. A transaction update received by this hook will be recomputed on the server with the same parameters, and the resulting update will be sent in whole or in part to the client. If the client sees a different result than the server, it will roll back its update and apply the server's version.