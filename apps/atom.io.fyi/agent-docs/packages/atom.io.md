# atom.io

Source: src/pages/docs/index.mdx
URL: /docs

# atom.io

## core module

`atom.io` is the core state module: it gives you primitives to declare reactive state,
derive more state from it, subscribe to changes, and operate on a store directly from
TypeScript.

Start with `atom`, `selector`, `getState`, and `setState`. Add families when you need many
similar states, transactions when updates need coordination, and timelines when you want
history.

## package contents

| Export | Description |
| --- | --- |
| `atom` | Declare a reactive variable. |
| `mutableAtom` | Declare a reactive variable backed by a mutable, trackable data structure. |
| `selector` | Declare a reactive variable derived from other reactive variables. |
| `atomFamily` | Compose a function that can create reactive variables of a single type dynamically. |
| `selectorFamily` | Compose a function that can create reactive variables derived from other reactive variables dynamically. |
| `transaction` | Declare a function that can batch multiple atom changes into a single update. |
| `timeline` | Track the history of a group of reactive variables. |
| `join` | Manage bidirectional relations between two sets of keys. |
| `subscribe` | Subscribe to a reactive variable, calling a callback whenever it is updated. |
| `getState` | Get the value of a reactive variable. If the reactive variable is a selector, the value is derived from other reactive variables. |
| `setState` | Set the value of a reactive variable. If the reactive variable is a selector, its `set` method is called, which should be written to produce in the appropriate changes to its dependencies. |
| `resetState` | Recompute a reactive variable and its dependencies from scratch. |
| `Silo` | An isolated store with all of the above functions bound to it. Useful for testing. |

## atom

### declare an atom
Source: src/exhibits/core/atom/declare-an-atom.ts

```ts
import { atom } from "atom.io"

export const countAtom = atom<number>({
	key: `count`,
	default: 0,
})
```

Imagine an `atom` as a "reactive variable," with a key, a type, and a default
value.

### an atom token is a reference
Source: src/exhibits/core/atom/an-atom-token-is-a-reference.ts

```ts
import { getState } from "atom.io"

import { countAtom } from "./declare-an-atom"

countAtom // -> { key: `count`, type: `atom` }
getState(countAtom) // -> 0
getState({ key: `count`, type: `atom` }) // -> 0
```

As you can see, what is returned from `atom` does not contain the value itself.

Instead, it returns an importable, serializable, and replaceable reference to the value.

We call this an `AtomToken`. In this case, an `AtomToken<number>`.

### get and set an atom
Source: src/exhibits/core/atom/get-and-set-an-atom.ts

```ts
import { getState, setState } from "atom.io"

import { countAtom } from "./declare-an-atom"

getState(countAtom) // -> 0
setState(countAtom, 1)
getState(countAtom) // -> 1

// @ts-expect-error `hello` is not a number
setState(countAtom, `hello`)
```

An atom's value is accessed by calling `getState` and `setState` with the atom's
token.

TypeScript will discourage you from setting the wrong type of value.

### subscribe to an atom
Source: src/exhibits/core/atom/subscribe-to-an-atom.ts

```ts
import { subscribe } from "atom.io"

import { countAtom } from "./declare-an-atom"

subscribe(countAtom, (count) => {
	console.log(`count is now ${count.newValue}`)
})
```

Unlike a standard variable, you can `subscribe` to an atom. The callback you
pass to the subscription will be called whenever the atom is set to a new value.

### subscribe is the foundation of reactivity
Source: src/exhibits/core/atom/subscribe-is-the-foundation-of-reactivity.tsx

```tsx
import { useO } from "atom.io/react"

import { countAtom } from "./declare-an-atom"

function Component() {
	const count = useO(countAtom)
	return <>{count}</>
}
```

This is an example of the **observer pattern**. Following the observer pattern
allows atom.io to integrate cleanly with an observer like React. More on this
later.

## selector

### declare a selector
Source: src/exhibits/core/selector/declare-a-selector.ts

```ts
import { atom, selector } from "atom.io"

export const dividendAtom = atom<number>({
	key: `dividend`,
	default: 0,
})

export const divisorAtom = atom<number>({
	key: `divisor`,
	default: 2,
})

export const quotientSelector = selector<number>({
	key: `quotient`,
	get: ({ get }) => {
		const dividend = get(dividendAtom)
		const divisor = get(divisorAtom)
		return dividend / divisor
	},
})
```

A selector is also a reactive variable, but its value is derived from other atoms or selectors.

### use a selector
Source: src/exhibits/core/selector/use-a-selector.ts

```ts
import { getState, setState } from "atom.io"

import {
	dividendAtom,
	divisorAtom,
	quotientSelector,
} from "./declare-a-selector"

getState(dividendAtom) // -> 0
getState(divisorAtom) // -> 2
getState(quotientSelector) // -> 0

setState(dividendAtom, 4)

getState(quotientSelector) // -> 2
```

In this example, we can see that by setting `dividendState` to a new value, the value of `quotientState` is automatically updated.

## families

Sometimes you need a lot of the same type of atom or selector. The `atomFamily` and `selectorFamily` functions provide a convenient interface for declaring states dynamically.

### declare a family
Source: src/exhibits/core/families/declare-a-family.tsx

```tsx
import { atomFamily, getState } from "atom.io"
import { useO } from "atom.io/react"
import * as React from "react"

export const xAtoms = atomFamily<number, string>({
	key: `x`,
	default: 0,
})
export const yAtoms = atomFamily<number, string>({
	key: `y`,
	default: 0,
})

getState(xAtoms, `example`) // -> 0

export function Point(props: { pointId: string }): React.JSX.Element {
	const x = useO(xAtoms, props.pointId)
	const y = useO(yAtoms, props.pointId)

	return <div className="point" style={{ left: x, top: y }} />
}
```

For example, maybe we're making an app with `Point`s laid out in two dimensions.

We might use an `atomFamily` to handle creating state for each node. Or, better yet, we might make two families—for each node's x and y coordinates.

Counterintuitively, it is likely a performance win in highly interactive applications to take the latter approach, because when nodes move, we only need to replace two primitives in the underlying map, rather than a whole object.

This is the key to high-performance interactivity in atom.io: **the smaller the state, the better**.

### use an index to track family members
Source: src/exhibits/core/families/use-an-index-to-track-family-members.tsx

```tsx
import { atom } from "atom.io"
import { useO } from "atom.io/react"

import { Point, xAtoms, yAtoms } from "./declare-a-family"

export const pointKeysAtom = atom<string[]>({
	key: `pointKeys`,
	default: [],
})

function AllPoints() {
	const pointIds = useO(pointKeysAtom)
	return (
		<>
			{pointIds.map((pointId) => {
				return <Point key={pointId} pointId={pointId} />
			})}
		</>
	)
}
```

In this example, we use a single `atom<string[]>` to track the members of the family.

It is up to you to decide how to track the members of the families you create. `atom.io` does not do this for you, because different kinds of collections have different performance characteristics. There is no one-size-fits-all solution.

## transaction

Transactions allow you to batch multiple atom changes into a single update. This is useful for validating a complex set of changes before it is applied to the store.

### use a family in a transaction
Source: src/exhibits/core/transaction/use-a-family-in-a-transaction.ts

```ts
import { atom, atomFamily, transaction } from "atom.io"

export type PublicUser = {
	id: string
	displayName: string
}

export const publicUserAtoms = atomFamily<PublicUser, string>({
	key: `publicUser`,
	default: (id) => ({ id, displayName: `` }),
})

export const userKeysAtom = atom<string[]>({
	key: `userKeys`,
	default: [],
})

export const addUserTX = transaction<(user: PublicUser) => void>({
	key: `addUser`,
	do: ({ get, set }, user) => {
		set(publicUserAtoms, user.id, user)
		if (!get(userKeysAtom).includes(user.id)) {
			set(userKeysAtom, (current) => [...current, user.id])
		}
	},
})
```

A common use case is creating some new state using a family and adding it to an index tracking members of that family.

### iterate through an index changing the value of some atoms
Source: src/exhibits/core/transaction/iterate-through-an-index-changing-the-value-of-some-atoms.ts

```ts
import { atom, atomFamily, selectorFamily, transaction } from "atom.io"

export const nowAtom = atom<number>({
	key: `now`,
	default: Date.now(),
	effects: [
		({ setSelf }) => {
			const interval = setInterval(() => {
				setSelf(Date.now())
			}, 1000)
			return () => {
				clearInterval(interval)
			}
		},
	],
})

export const timerKeysAtom = atom<string[]>({
	key: `timerKeys`,
	default: [],
})

export const timerStartedAtoms = atomFamily<number, string>({
	key: `timerStarted`,
	default: 0,
})
export const timerLengthAtoms = atomFamily<number, string>({
	key: `timerLength`,
	default: 60_000,
})
const timerRemainingSelectors = selectorFamily<number, string>({
	key: `timerRemaining`,
	get:
		(id) =>
		({ get }) => {
			const now = get(nowAtom)
			const started = get(timerStartedAtoms, id)
			const length = get(timerLengthAtoms, id)
			return Math.max(0, length - (now - started))
		},
})

export const addOneMinuteToAllRunningTimersTX = transaction({
	key: `addOneMinuteToAllRunningTimers`,
	do: ({ get, set }) => {
		const timerIds = get(timerKeysAtom)
		for (const timerId of timerIds) {
			if (get(timerRemainingSelectors, timerId) > 0) {
				set(timerLengthAtoms, timerId, (current) => current + 60_000)
			}
		}
	},
})
```

In this example, we add a minute to all running timers.

### try catch a failed transaction
Source: src/exhibits/core/transaction/try-catch-a-failed-transaction.ts

```ts
import type { Loadable } from "atom.io"
import { atom, atomFamily, runTransaction, transaction } from "atom.io"

export type GameItems = { coins: number }
export type Inventory = Partial<Readonly<GameItems>>

export const myIdAtom = atom<Loadable<string>>({
	key: `myId`,
	default: async () => {
		const response = await fetch(`https://io.fyi/api/myId`)
		const { id } = await response.json()
		return id
	},
})

export const playerInventoryAtoms = atomFamily<Inventory, string>({
	key: `playerInventory`,
	default: {},
})

export const giveCoinsTX = transaction<
	(playerId: string, amount: number) => Promise<void>
>({
	key: `giveCoins`,
	do: async ({ get, set }, playerId, amount) => {
		const myId = await get(myIdAtom)
		const myInventory = get(playerInventoryAtoms, myId)
		if (!myInventory.coins) {
			throw new Error(`Your inventory is missing coins`)
		}
		const myCoins = myInventory.coins
		if (myCoins < amount) {
			throw new Error(`You don't have enough coins`)
		}
		const theirInventory = get(playerInventoryAtoms, playerId)
		const theirCoins = theirInventory.coins ?? 0
		set(playerInventoryAtoms, myId, (previous) => ({
			...previous,
			coins: myCoins - amount,
		}))
		set(playerInventoryAtoms, playerId, (previous) => ({
			...previous,
			coins: theirCoins + amount,
		}))
	},
})
;async () => {
	try {
		await runTransaction(giveCoinsTX)(`playerId`, 3)
	} catch (thrown) {
		if (thrown instanceof Error) {
			alert(thrown.message)
		}
	}
}
```

If a transaction throws, the state of the store is not changed. However, it is up to you to handle the error.

## timeline

Timelines allow you to track the history of a group of atoms. If these atoms are set, or set as a group by a selector or transaction, the timeline will record the changes. A timeline can be used to undo and redo changes.

### create a timeline
Source: src/exhibits/core/timeline/create-a-timeline.ts

```ts
import { timeline } from "atom.io"

import { xAtoms, yAtoms } from "../families/declare-a-family"

export const coordinatesTL = timeline({
	key: `timeline`,
	scope: [xAtoms, yAtoms],
})
```

In this example, we create a timeline that tracks the history of two families of atoms.

### subscribe to a timeline
Source: src/exhibits/core/timeline/subscribe-to-a-timeline.ts

```ts
import { setState, subscribe } from "atom.io"

import { xAtoms } from "../families/declare-a-family"
import { coordinatesTL } from "./create-a-timeline"

subscribe(coordinatesTL, (value) => {
	console.log(value)
})

setState(xAtoms, `sample_key`, 1)
/* {
  newValue: 1,
  oldValue: 0,
  key: `sample_key`,
  type: `atom_update`,
  timestamp: 1629780000000,
  family: {
    key: `x`,
    type: `atom_family`,
  }
} */
```

In this example, we subscribe to the timeline. Above are the structures of timeline updates.

### undo and redo changes
Source: src/exhibits/core/timeline/undo-and-redo-changes.ts

```ts
import { getState, redo, setState, subscribe, undo } from "atom.io"

import { xAtoms } from "../families/declare-a-family"
import { coordinatesTL } from "./create-a-timeline"

subscribe(coordinatesTL, (value) => {
	console.log(value)
})

setState(xAtoms, `sample_key`, 1)
getState(xAtoms, `sample_key`) // 1
setState(xAtoms, `sample_key`, 2)
getState(xAtoms, `sample_key`) // 2
undo(coordinatesTL)
getState(xAtoms, `sample_key`) // 1
redo(coordinatesTL)
getState(xAtoms, `sample_key`) // 2
```

In this example, we undo and redo changes to the timeline.

## join

Use `join` when a relationship needs to be its own state.

You will not always need this. But for apps that need fluid, frontend-reconfigurable relations, `join` is a powerful fit.

For example, imagine a playlist editor. Tracks are their own entities, and playlists are their own entities. A track can appear in many playlists, and a playlist can contain many tracks.

The tracks do not belong to the playlist object, and the playlists do not belong to the track object. The relationship is its own state, so the UI can reshape it freely.

### declare playlist tracks
Source: src/exhibits/core/advanced/join/declare-playlist-tracks.ts

```ts
import { join } from "atom.io"

type PlaylistKey = `playlist::${string}`
type TrackKey = `track::${string}`

export const playlistTracks = join({
	key: `playlistTracks`,
	between: [`playlist`, `track`],
	cardinality: `n:n`,
	isAType: (input): input is PlaylistKey => input.startsWith(`playlist::`),
	isBType: (input): input is TrackKey => input.startsWith(`track::`),
})
```

You can read the relation from either side.

### find tracks in playlist
Source: src/exhibits/core/advanced/join/find-tracks-in-playlist.ts

```ts
import { findRelations } from "atom.io"

import { playlistTracks } from "./declare-playlist-tracks"

const tracksInRoadTripState = findRelations(
	playlistTracks,
	`playlist::road-trip`,
).trackKeysOfPlaylist
```

### find playlists for track
Source: src/exhibits/core/advanced/join/find-playlists-for-track.ts

```ts
import { findRelations } from "atom.io"

import { playlistTracks } from "./declare-playlist-tracks"

const playlistsUsingDreamsState = findRelations(
	playlistTracks,
	`track::dreams`,
).playlistKeysOfTrack
```

Then you can reconfigure the relation without denormalizing either entity.

### replace playlist tracks
Source: src/exhibits/core/advanced/join/replace-playlist-tracks.ts

```ts
import { editRelations } from "atom.io"

import { playlistTracks } from "./declare-playlist-tracks"

editRelations(playlistTracks, (relations) => {
	relations.replaceRelations(`playlist::road-trip`, [
		`track::dreams`,
		`track::landslide`,
		`track::rhiannon`,
	])
})
```

The join keeps both directions consistent. If the road trip playlist changes, `tracksInRoadTripState` updates. If a track appears in or disappears from a playlist, `playlistsUsingDreamsState` updates too.

Use `join` when you need that bidirectional consistency to be reactive, typed, and safe to reconfigure from the frontend.

## advanced

### atom effects

Atoms can declare `effects`, which are setup hooks that run when the atom is created.

Use `setSelf` when an external source should initialize or push values into the atom:

### hydrate an atom with set self
Source: src/exhibits/core/advanced/effects/hydrate-an-atom-with-set-self.ts

```ts
import { atom } from "atom.io"

export const sidebarOpenAtom = atom<boolean>({
	key: `sidebarOpen`,
	default: false,
	effects: [
		({ setSelf }) => {
			const stored = localStorage.getItem(`sidebarOpen`)
			if (stored !== null) {
				setSelf(JSON.parse(stored))
			}
		},
	],
})
```

Use `onSet` when you want to react to changes after the atom updates:

### react to changes with on set
Source: src/exhibits/core/advanced/effects/react-to-changes-with-on-set.ts

```ts
import { atom } from "atom.io"

export const searchQueryAtom = atom<string>({
	key: `searchQuery`,
	default: ``,
	effects: [
		({ onSet }) => {
			onSet(({ newValue }) => {
				console.log(`search query updated:`, newValue)
			})
		},
	],
})
```

These patterns are useful on their own, and `atom.io/web` builds on them with ready-made
browser effects such as storage and URL synchronization. See
[`atom.io/web`](/docs/web) for more examples of preincluded effects.

### async state

Often, the data you need is not immediately available. For example, you may need to fetch it from a server. `atom.io` offers natural support for `Promise` and `async/await` patterns.

### await your state
Source: src/exhibits/core/advanced/async/await-your-state.ts

```ts
import http from "node:http"

import type { Loadable } from "atom.io"
import { atom, getState, resetState } from "atom.io"

const server = http.createServer((req, res) => {
	let data: Uint8Array[] = []
	req
		.on(`data`, (chunk) => data.push(chunk))
		.on(`end`, () => {
			res.writeHead(200, { "Content-Type": `text/plain` })
			res.end(`The best way to predict the future is to invent it.`)
			data = []
		})
})
server.listen(3000)

export const quoteAtom = atom<Loadable<Error | string>>({
	key: `quote`,
	default: async () => {
		try {
			const response = await fetch(`http://localhost:3000`)
			return await response.text()
		} catch (thrown) {
			if (thrown instanceof Error) {
				return thrown
			}
			throw thrown
		}
	},
})

void getState(quoteAtom) // Promise { <pending> }
await getState(quoteAtom) // "The best way to predict the future is to invent it."
void getState(quoteAtom) // "The best way to predict the future is to invent it."
resetState(quoteAtom)
void getState(quoteAtom) // Promise { <pending> }
```

`Loadable` is a shorthand that means "this value may be a `Promise`". This is useful because `await` is harmless when the value is not a `Promise`. When the Promise does resolve, the value is set into the value map, allowing for maximum flexibility in Suspenseful environments.

### loadable selector
Source: src/exhibits/core/advanced/async/loadable-selector.ts

```ts
import type { Loadable } from "atom.io"
import { atom, selector } from "atom.io"

function discoverCoinId() {
	const urlParams = new URLSearchParams(window.location.search)
	return urlParams.get(`coinId`) ?? `bitcoin`
}
export const coinIdAtom = atom<string>({
	key: `coinId`,
	default: discoverCoinId,
	effects: [
		({ setSelf }) => {
			window.addEventListener(`popstate`, () => {
				setSelf(discoverCoinId())
			})
		},
	],
})

export const coinPriceSelector = selector<Loadable<number>>({
	key: `coinPrice`,
	get: async ({ get }) => {
		const coinId = get(coinIdAtom)
		const response = await fetch(
			`https://api.coingecko.com/api/v3/coins/${coinId}`,
		)
		const json = await response.json()
		return json.market_data.current_price.usd
	},
})
```

Here is an example where we read a query parameter from the URL, then use it to fetch data from a server. This is a great pattern, because the selector's value will be cached as long as the URL parameter does not change.

### avoid race between promises
Source: src/exhibits/core/advanced/async/avoid-race-between-promises.ts

```ts
import type { Loadable } from "atom.io"
import { atom, getState, setState } from "atom.io"

export const nameAtom = atom<Loadable<string>>({
	key: `name`,
	default: ``,
})
// resolve in 2 seconds
setState(
	nameAtom,
	new Promise<string>((resolve) =>
		setTimeout(() => {
			resolve(`one`)
		}, 2000),
	),
)
// resolve in 1 second
setState(
	nameAtom,
	new Promise<string>((resolve) =>
		setTimeout(() => {
			resolve(`two`)
		}, 1000),
	),
)
// "two" resolves first
// promise for "one" is set to be ignored
// "one" resolves, but is ignored
await new Promise((resolve) => setTimeout(resolve, 3000))
void getState(nameAtom) // "two"
```

If we update an async state more quickly than its promises resolve, only the last resolved value will be set into the state. All previous results will be discarded.

### catching errors

Regular atoms and pure selectors can declare a `catch` option.

When a matching error class is thrown, atom.io stores that error in the state instead of
rethrowing it. This gives the state a typed error channel, so code that reads it can
handle the expected failure case explicitly.

To make sure your declared error type stays aligned with the constructors in `catch`, use
[`atom.io/exact-catch-types`](/docs/eslint-plugin#exact-catch-types).

### catch an atom
Source: src/exhibits/core/advanced/catching/catch-an-atom.ts

```ts
import { atom, getState } from "atom.io"

class MissingSessionError extends Error {
	public constructor() {
		super(`No active session`)
		this.name = `MissingSessionError`
	}
}

export const currentSessionIdAtom = atom<string, MissingSessionError>({
	key: `currentSessionId`,
	default: () => {
		throw new MissingSessionError()
	},
	catch: [MissingSessionError],
})

const result = getState(currentSessionIdAtom)

if (result instanceof MissingSessionError) {
	console.log(result.message) // -> "No active session"
}
```

The same pattern works for selectors:

### catch a selector
Source: src/exhibits/core/advanced/catching/catch-a-selector.ts

```ts
import { atom, getState, selector } from "atom.io"

class UnauthorizedError extends Error {
	public constructor() {
		super(`You must sign in first`)
		this.name = `UnauthorizedError`
	}
}

const authTokenAtom = atom<string | null>({
	key: `authToken`,
	default: null,
})

export const viewerSelector = selector<{ id: string }, UnauthorizedError>({
	key: `viewer`,
	get: ({ get }) => {
		const authToken = get(authTokenAtom)
		if (authToken === null) {
			throw new UnauthorizedError()
		}
		return { id: authToken }
	},
	catch: [UnauthorizedError],
})

const result = getState(viewerSelector)

if (result instanceof UnauthorizedError) {
	console.log(result.message) // -> "You must sign in first"
}
```

This is especially helpful for `Loadable` state. If you read a caught loadable value with
[`useLoadable`](/docs/react#error-handling), the hook can expose the caught error
separately from the fallback value.

### mutable atoms

Most atom.io state should be modeled with regular immutable atoms. Sometimes, though, a
large collection changes frequently enough that copying the whole structure on every
update is not a good tradeoff.

For those cases, use `mutableAtom`.

### declare a mutable atom
Source: src/exhibits/core/mutable/declare-a-mutable-atom.ts

```ts
import { getState, mutableAtom, setState } from "atom.io"
import { UList } from "atom.io/transceivers/u-list"

export const selectedTagKeysAtom = mutableAtom<UList<string>>({
	key: `selectedTagKeys`,
	class: UList,
})

getState(selectedTagKeysAtom).has(`typescript`) // -> false

setState(selectedTagKeysAtom, (selectedTagKeys) =>
	selectedTagKeys.add(`typescript`),
)

getState(selectedTagKeysAtom).has(`typescript`) // -> true
```

A mutable atom holds a `Transceiver`: a mutable object that knows how to report its own
changes to atom.io.

Read more in [the transceivers guide](/transceivers).

The built-in transceivers you will typically use are:

- `UList` from `atom.io/transceivers/u-list`: a trackable unordered set
- `OList` from `atom.io/transceivers/o-list`: a trackable ordered array

Read mutable atoms the same way you read regular atoms: with `getState`, `subscribe`,
or a UI adapter like `useO`.

When writing one, prefer the setter callback form. Mutate the value inside the callback
and return it. That lets atom.io capture the transceiver's fine-grained update instead
of requiring you to replace the entire collection.
