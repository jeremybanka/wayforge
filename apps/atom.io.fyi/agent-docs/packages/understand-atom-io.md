# understand atom.io

Source: src/pages/docs/understand-atom-io.mdx
URL: /docs/understand-atom-io

# understand atom.io

`atom.io` is built around a few practical goals. They are less about forcing one
architecture and more about making state easy to reason about as an app grows.

## laziness

Never compute derived state until something actually asks for it.

This keeps derived state cheap enough to use freely, even when selectors are stacked on
top of other selectors.

### laziness
Source: src/exhibits/guides/understand-atom-io/laziness.ts

```ts
import { atom, selector, Silo } from "atom.io"

const store = new Silo({
	name: `guide-laziness`,
	lifespan: `ephemeral`,
	isProduction: false,
})

const countAtom = atom<number>({
	key: `count`,
	default: 0,
})

const doubledSelector = selector<number>({
	key: `doubled`,
	get: ({ get }) => {
		console.log(`computing doubledSelector`)
		return get(countAtom) * 2
	},
})

store.setState(countAtom, 2)
// Still nothing logged. No one has asked for doubledSelector yet.

store.getState(doubledSelector)
// Logs once and returns 4.
```

`doubledSelector` is never computed until something reads it with `getState`, `useO`, or a
subscription. If its cached value is later evicted, atom.io only recomputes it when
someone is still subscribed or a new read asks for it.

## testability

Write unit tests for your store without mocking a UI framework.

The core API works directly against a store, so tests can exercise state logic with
`getState`, `setState`, and transactions in isolation.

### counter
Source: src/exhibits/guides/understand-atom-io/counter.test.ts

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

That makes it easier to test behavior at the state layer instead of only through rendered
components.

## portability

Run the same store logic in the browser, on the server, or in a worker.

State declarations live in plain TypeScript modules, so they are not tied to React or to a
particular runtime.

### browser path sync
Source: src/exhibits/guides/understand-atom-io/browser-path-sync.ts

```ts
import { atom } from "atom.io"

export const pathnameAtom = atom<string>({
	key: `pathname`,
	default: () => window.location.pathname,
	effects: [
		({ setSelf, onSet }) => {
			const syncFromBrowser = () => {
				setSelf(window.location.pathname)
			}

			window.addEventListener(`popstate`, syncFromBrowser)

			onSet(({ newValue }) => {
				if (window.location.pathname !== newValue) {
					window.history.pushState(null, ``, newValue)
				}
			})

			return () => {
				window.removeEventListener(`popstate`, syncFromBrowser)
			}
		},
	],
})
```

The browser version can lean on `window.location` to keep a piece of state in sync with
the current pathname.

### node config sync
Source: src/exhibits/guides/understand-atom-io/node-config-sync.ts

```ts
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import { atom } from "atom.io"

const configFile = path.join(os.homedir(), `.config`, `my-app`, `session.json`)

export const sessionAtom = atom<string | null>({
	key: `session`,
	default: null,
	effects: [
		({ setSelf, onSet }) => {
			if (fs.existsSync(configFile)) {
				setSelf(JSON.parse(fs.readFileSync(configFile, `utf8`)))
			}

			onSet(({ newValue }) => {
				fs.mkdirSync(path.dirname(configFile), { recursive: true })
				fs.writeFileSync(configFile, JSON.stringify(newValue))
			})
		},
	],
})
```

The Node version uses the same atom API, but its effect reads from and writes to a config
file in `~/.config/my-app`.

## batteries included

Solve common state-management jobs like coordinated updates and history without wiring them
from scratch every time.

Transactions and timelines are part of the core module because they come up often in real
apps.

### transactions and timelines
Source: src/exhibits/guides/understand-atom-io/transactions-and-timelines.ts

```ts
import { atom, timeline, transaction } from "atom.io"

const statusAtom = atom<string>({
	key: `status`,
	default: `idle`,
})

const savedAtAtom = atom<number | null>({
	key: `savedAt`,
	default: null,
})

const saveDraftTX = transaction<() => void>({
	key: `saveDraft`,
	do: ({ set }) => {
		set(statusAtom, `saving`)
		set(savedAtAtom, Date.now())
	},
})

const editsTL = timeline({
	key: `edits`,
	scope: [statusAtom, savedAtAtom],
})
```

You can start small with atoms and selectors, then bring in transactions or time travel
when the app needs them.

## composability

Build a store out of small pieces, declare them near the code that owns them, and compose
them later.

This keeps state modular instead of forcing everything into one giant store object.

### search box
Source: src/exhibits/guides/understand-atom-io/search-box.tsx

```tsx
import { atom } from "atom.io"
import { useI, useO } from "atom.io/react"
import type { JSX } from "preact/jsx-runtime"

const searchBoxDraftAtom = atom<string>({
	key: `searchBoxDraft`,
	default: ``,
})

export function SearchBox(): JSX.Element {
	const draft = useO(searchBoxDraftAtom)
	const setDraft = useI(searchBoxDraftAtom)

	return (
		<input
			value={draft}
			onInput={(event) => {
				setDraft(event.currentTarget.value)
			}}
			placeholder="Filter results"
		/>
	)
}
```

That atom does not need to be exported or lifted into a giant central file. It can live
right next to the React component that observes it with `useO` and updates it with `useI`.
