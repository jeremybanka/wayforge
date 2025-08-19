# treetrunks

<a aria-label="NPM version" href="https://www.npmjs.com/package/treetrunks">
  <img alt="NPM Version" src="https://img.shields.io/npm/v/treetrunks?style=for-the-badge">
</a>
<a aria-label="Dependencies 0" href="https://www.npmjs.com/package/treetrunks">
  <img alt="Dependencies 0" src=" https://img.shields.io/badge/dependencies-0-0?style=for-the-badge">
</a>
<a href="https://bundlephobia.com/result?p=treetrunks">
  <img alt="Bundlephobia" src="https://img.shields.io/bundlephobia/minzip/treetrunks?style=for-the-badge">
</a>
<a aria-label="Coverage" href="https://recoverage.cloud/">
  <img alt="Coverage" src="https://img.shields.io/endpoint?url=https%3A%2F%2Frecoverage.cloud%2Fshields%2FS1ikz1yFmk93qbAI7lLnu%2Ftreetrunks">
</a>

```sh
npm i treetrunks
```

treetrunks is a convenient way to define type-safe routers.

## overview

a tree structure affords many possible routes through the tree

```typescript
import type { Tree, TreePath } from "treetrunks";
import { optional, required } from "treetrunks";

const greetingTree = required({
  hello: optional({
    world: null,
    $name: optional({
      good: required({
        morning: null,
      }),
    }),
  }),
}) satisfies Tree;

const validPaths: TreePath<typeof greetingTree>[] = [
  [`hello`],
  [`hello`, `world`],
  [`hello`, `jeremybanka`],
  [`hello`, `treetrunks`, `good`, `morning`],
];
```

the `optional` and `required` functions help determine what routes are valid.

note that,

- `"hello"` is required
- `"world"`, or any `$name` is optional
- `"good morning"` is optional
