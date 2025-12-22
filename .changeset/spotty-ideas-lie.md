---
"atom.io": patch
---

🐛 `atom.io/realtime-client` Fixed an issue where `myRoomKeyAtom` was being stored independently of `usersInRooms` such that the two might not agree. Replaced `myRoomKeyAtom` with `myRoomKeySelector`. Server-side, this selector uses only the new environment variable, `env["REALTIME_ROOM_KEY]"`, and no other states, if it is found.
