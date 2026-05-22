# atom.io/json

Source: src/pages/docs/json.mdx
URL: /docs/json

# atom.io/json

`atom.io/json` contains small utilities and shared types for working with JSON-safe values.

Use it when you need to describe, validate, or transform values that can be serialized across browsers, servers, workers, and realtime boundaries.

## package contents

| Export | Description |
| --- | --- |
| `Json.Serializable` | A value that can survive `JSON.stringify` and{" "} `JSON.parse`. |
| `Json.Object` | A JSON-safe object type. |
| `Json.Array` | A JSON-safe array type. |
| `stringified` | A string type that preserves the original JSON value type. |
| `parseJson` | A typed wrapper for `JSON.parse`. |
| `stringifyJson` | A typed wrapper for `JSON.stringify`. |
| `isJson` | Check whether a value is a JSON tree node. |
| `Canonical` | A JSON-compatible value that can be used safely as a stable key. |
| `packCanonical` | Convert a canonical value into a stable packed string. |
| `unpackCanonical` | Convert a packed canonical string back into its original value. |
| `toEntries` | A typed wrapper for `Object.entries`. |
| `fromEntries` | A typed wrapper for `Object.fromEntries`. |
| `enumeration` | Create a two-way enum-like object from a readonly string array. |

## serializable json

Use `Json.Serializable` when a value needs to cross a serialization boundary.

That includes state sent across a network, values stored in persistence, and messages shared between different ECMAScript environments.

## canonical keys

Use `Canonical` when you need a structured key with predictable identity.

Objects are not a great fit for this. Their key order is not always the identity you mean to express, and TypeScript's duck typing can allow extra keys to sneak in.

Tuples are usually a better shape for compound keys.

For example, if a document owns many pages, the key for a page could be:

### page key
Source: src/exhibits/json/page-key.ts

```ts
export type PageKey = [documentId: string, pageIndex: number]
```

That tuple type can be used directly as the `K` type of an `atomFamily`.

### page atoms
Source: src/exhibits/json/page-atoms.ts

```ts
import { atomFamily } from "atom.io"

import type { PageKey } from "./page-key"

type Page = {
	text: string
}

const pageAtoms = atomFamily<Page, PageKey>({
	key: `page`,
	default: { text: `` },
})
```

## typed entries

Use `toEntries` and `fromEntries` when you want the shape of an object to survive a trip through `Object.entries` or `Object.fromEntries`.

## enumerations

Use `enumeration` when you want a small two-way mapping from strings to indexes and indexes back to strings.
