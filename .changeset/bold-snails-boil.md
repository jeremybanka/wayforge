---
"atom.io": patch
---

✨ Store adds configuration to suppress the warning that a state was created with an already-used key.

This warning would occur when running in a development environment, and your code, including calls to `atom` or `atomFamily`, is being hot-reloaded. When this happens, the store would attempt to create the state. In the case of an atom, it would not do so, logging a warning. In the case of a family, it would overwrite the existing family, also logging a warning.

In the case that a key was actually used twice, this _can_ a helpful indication of the root cause of a weird type error.

However, there is a boy-who-cried-wolf situation here, since the warning is mostly experienced as a false-positive due to HMR.

Furthermore, In some contexts like react native, where errors are surfaced in the development UI, this error is especially annoying.

So, in the future this warning may be only be enabled in production environments. For now, it remains enabled by default but can be disabled for convenience like so:

```ts
import { IMPLICIT } from "atom.io/internal";

IMPLICIT.STORE.config.warnings.delete(`possible_duplicate_key`);
```
