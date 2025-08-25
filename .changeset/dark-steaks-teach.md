---
"atom.io": patch
---

🚀 Setting an atom now only produces up to one timeline event. Previously, if the atom had not been initialized previously, setting it could result in a state creation event and an state update event. This was undesirable, as these are really best seen as the same event. Now, they are.
