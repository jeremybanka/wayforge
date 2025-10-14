---
"atom.io": minor
---

✨ Store adds a configurable flag to indicate whether it exists in a production context.

```ts
Store.config.isProduction: boolean
```

Currently this is only used to suppress the warning that a state was created with an already-used key. If we're not in production, we don't want to log this warning.

The sensible default value is safely acquired as follows:

```ts
globalThis.process?.env?.[`NODE_ENV`] === `production`;
```

### Motivation

This warning would occur when running in a development hot-module-replacement (HMR) environment. Under these condition your code, including calls to `atom` or `atomFamily`, is being continually reevaluated on change. When this happens, the store would attempt to re-create these states. In the case of an atom, it would not do so, logging a warning. In the case of a family, it would overwrite the existing family, but also logging a warning.

In the case that a key was actually used twice, this _can_ a helpful indication of the root cause of errors with non obvious causes. For example, maybe you created a state by copying an existing state and forgot to change the key. This would likely result in type errors down the line.

However, there is a boy-who-cried-wolf situation here, since the warning, as it is designed, is mostly experienced as a false-positive due to HMR. Furthermore, In some contexts like react native, where errors are surfaced in the development UI, seeing it pop up on your screen is especially annoying.

If you have a custom way to indicate what environment you are in, you can configure this behavior.

For instance,

```ts
import { IMPLICIT } from "atom.io/internal";
import { env } from "./env";

IMPLICIT.STORE.config.isProduction = env.MODE === `prod`;
```
