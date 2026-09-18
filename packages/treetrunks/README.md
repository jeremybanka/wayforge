# treetrunks

<a aria-label="NPM version" href="https://www.npmjs.com/package/treetrunks">
	<img
		alt="NPM Version"
		src="https://img.shields.io/npm/v/treetrunks?style=for-the-badge"
	>
</a>
<a aria-label="Dependencies 0" href="https://www.npmjs.com/package/treetrunks">
	<img
		alt="Dependencies 0"
		src="https://img.shields.io/badge/dependencies-0-0?style=for-the-badge"
	>
</a>
<a aria-label="Coverage" href="https://recoverage.cloud/">
	<img
		alt="Coverage"
		src="https://img.shields.io/endpoint?url=https%3A%2F%2Frecoverage.cloud%2Fshields%2FS1ikz1yFmk93qbAI7lLnu%2Ftreetrunks"
	>
</a>

```sh
npm i treetrunks
```

Lean utilities to build type-safe trees and validate routes through them.

## overview

a tree structure affords many possible routes through the tree

```typescript
import type { Tree, TreePath } from "treetrunks"
import { optional, required } from "treetrunks"

const greetingTree = required({
	hello: optional({
		world: null,
		$name: optional({
			good: required({
				morning: null,
			}),
		}),
	}),
}) satisfies Tree

const validPaths: TreePath<typeof greetingTree>[] = [
	[`hello`],
	[`hello`, `world`],
	[`hello`, `jeremybanka`],
	[`hello`, `treetrunks`, `good`, `morning`],
]
```

the `optional` and `required` functions help determine what routes are valid.

note that,

- `"hello"` is required
- `"world"`, or any `$name` is optional
- `"good morning"` is optional

<!-- tonnage:default:start -->

## Bundle size

Package export sizes include complete runtime export surfaces.
Sizes are exact minified and level-9 gzip JavaScript byte counts. Declarations, source maps, CSS, and other assets are excluded. Peer dependencies stay external, and shared modules are counted once per bundle.

| Import                  | Minified JS | Gzip JS |
| ----------------------- | ----------: | ------: |
| <code>treetrunks</code> |     1,474 B |   747 B |

Report maintained with [tonnage](https://github.com/jeremybanka/tonnage).

<!-- tonnage:default:end -->

## Variadic captures

A `$...name` leaf branch represents one or more string segments. For `required({ add: required({ "$...paths": null }) })`, `TreePath` accepts `["add", string, ...string[]]`, while `TreePathName`, `flattenTree`, and `mapTree` keep the single declared route `add/$...paths`. `ExpandCaptures<["add", "$...paths"]>` also produces the nonempty variadic path type.

Use `optional({ "$...paths": null })` to allow stopping at the parent; selecting the rest branch still requires at least one string. `isTreePath` checks both cardinality and the type of every captured segment.

`TreePathCaptures<["project", "$name", "$...paths"]>` produces `{ name: string; paths: [string, ...string[]] }`. It distributes over alternative path names to produce a union of capture records. `isTreePath` checks paths against the supplied tree without imposing rules on capture names or inspecting unrelated branches. A path belongs to the tree if any matching literal or capture branch accepts it; all capture alternatives are considered.

## Capture expansion

`ExpandCaptures<Arr, CapturePrefix, RestMarker>` transforms a tuple of strings, preserving literal elements and expanding captures to `string & {}`. A terminal rest capture expands to a nonempty tuple of those strings. `CapturePrefix` defaults to `$`, and `RestMarker` defaults to `...` and immediately follows the prefix. These parameters customize the tuple transformation; tree branches use the `$name` and `$...name` syntax described above.

```ts
import type { ExpandCaptures } from "treetrunks"

type Expanded = ExpandCaptures<["literal", ":name", ":*items"], ":", "*">
// ["literal", string & {}, string & {}, ...(string & {})[]]
```
