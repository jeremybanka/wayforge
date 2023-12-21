---
"atom.io": patch
---

✨ `atom.io/data` `join`: Expose `core.getRelatedKeys`. This is a mutable atom family that serves as the actual source of truth for the relations a join stores. This can be used in other atom.io modules such as `/realtime` to synchronize the relations of a join across multiple instances.

As a part of exposing this family, its JSON interface has been updated to use the `toJSON` and `fromJSON` methods on the `SetRTX` transceiver.
