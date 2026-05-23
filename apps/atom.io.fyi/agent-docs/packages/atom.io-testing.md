# atom.io/testing

Source: docs/source/pages/docs/testing.mdx
URL: /docs/testing

# atom.io/testing

`atom.io/testing` provides a small helper for tests that use the implicit store.

Use it when your tests declare atoms, selectors, or families at module scope and you want
each test to start from the same assembled store without rebuilding that setup by hand.

## package contents

| Export | Description |
| --- | --- |
| `takeSnapshot` | Capture a store and return an object that can restore it later. |
| `Snapshot` | A snapshot object with `store` and `restore()`. |

## takeSnapshot

`takeSnapshot` captures the current shape of a store and returns a `Snapshot`.

For the common case, call it once at module scope after your test states are declared,
then restore it in `afterEach`.

### take snapshot
Source: docs/source/exhibits/tooling/testing/take-snapshot.ts

```ts
import { atom, getState, selector, setState } from "atom.io"
import { takeSnapshot } from "atom.io/testing"
import { afterEach, expect, test } from "vitest"

const countAtom = atom<number>({
	key: `count`,
	default: 0,
})

const doubledSelector = selector<number>({
	key: `doubled`,
	get: ({ get }) => get(countAtom) * 2,
})

const snapshot = takeSnapshot()

afterEach(() => {
	snapshot.restore()
})

test(`doubledSelector can be tested without React`, () => {
	setState(countAtom, 3)
	expect(getState(doubledSelector)).toBe(6)
})

test(`the implicit store is reset after each test`, () => {
	expect(getState(doubledSelector)).toBe(0)
})
```

That pattern keeps the test file visually familiar: setup at the top, then a normal
`afterEach` block.

## snapshot.store

The returned `Snapshot` also exposes the snapshotted store as `snapshot.store`.

That is useful when you want to inspect the captured template store directly. For example,
you can read the snapshotted value of a state from `snapshot.store` before restoring it.

### custom store
Source: docs/source/exhibits/tooling/testing/custom-store.ts

```ts
import { atom } from "atom.io"
import { getFromStore } from "atom.io/internal"
import { takeSnapshot } from "atom.io/testing"

const countAtom = atom<number>({
	key: `count`,
	default: 0,
})

const snapshot = takeSnapshot()

getFromStore(snapshot.store, countAtom)
snapshot.restore()
```

## when to use it

Use `atom.io/testing` when:

- your tests rely on the implicit store
- your states are declared once and reused across many tests
- you want each test to begin from the same installed atoms, selectors, and families

If you are already creating isolated stores with `Silo`, you may prefer to construct a
fresh store per test instead.
