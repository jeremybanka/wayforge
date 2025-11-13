---
"atom.io": patch
---

✨ `atom.io/realtime-server` updated experimental join/leave/create/delete room functionality to no longer use transactions. `joinRoom` now buffers additional messages until a connection to the room is established.
