---
"atom.io": patch
---

🐛 Fixed bug where a serialized form of a key would be used when producing a default value, in the event that an immortal store prevented the instantiation of a state whose key had not been safely preallocated.
