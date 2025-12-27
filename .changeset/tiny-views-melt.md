---
"atom.io": patch
---

🐛 `atom.io/realtime-server` `::` `provideRooms()` Fixed a bug where a userKey would be redundantly added to a room that user was already present in, resulting in noise over the wire for other players in that room.
