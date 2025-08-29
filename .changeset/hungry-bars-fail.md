---
"atom.io": patch
---

✨ Add special-case handling for errors in `useLoadable`. If you pass a state that's able to `catch` and a fallback value to render, anything thrown from computing the state will show up on the `error?` property alongside `loading` and `value`. Currently, the fallback value is used in the case of an error, but in future an option this default may be changed or an option may be added to prefer the last loaded value.
