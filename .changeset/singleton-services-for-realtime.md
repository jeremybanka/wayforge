---
"atom.io": patch
---

🐛 `atom.io/realtime-react` will now create, at most, one instance of a given service for any token. Previously, it would create a new instance for each component that used the service, even if they used the same token. So a given atom, for example, would receive an update for each component with a `usePull` for it, meaning that you'd need to be careful to only pull a given atom once. This is now resolved; it's fine to pull an atom in as many components as you like.
