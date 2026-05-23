# atom.io/react

Source: docs/source/pages/docs/react.mdx
URL: /docs/react

# atom.io/react

## package contents

| Export | Description |
| --- | --- |
| `useI` | Make an updater function for a reactive variable. |
| `useO` | Observe a reactive variable. |
| `useJSON` | Observe the JSON form of a mutable atom. |
| `useTL` | Control a timeline and observe its state. |
| `useLoadable` | For a `Loadable` atom or selector, this hook provides a convenient interface for observing its value, loading state, and error state. |

## useO

`useO` is a React hook that allows you to observe reactive variables in your React components.

### use o
Source: docs/source/exhibits/react/use-o.tsx

```tsx
import { atom } from "atom.io"
import { useO } from "atom.io/react"

function discoverUrl() {
	return new URL(window.location.href)
}
const urlAtom = atom<string>({
	key: `url`,
	default: () => discoverUrl().toString(),
	effects: [
		({ setSelf }) => {
			window.addEventListener(`popstate`, () => {
				setSelf(discoverUrl().toString())
			})
		},
	],
})

function UrlDisplay() {
	const url = useO(urlAtom)
	return <div>{url}</div>
}
```

## useI

`useI` is a React hook that allows you to update reactive variables in your React components.

### use i
Source: docs/source/exhibits/react/use-i.tsx

```tsx
import { atom } from "atom.io"
import { useI, useO } from "atom.io/react"

const toggleAtom = atom<boolean>({
	key: `toggle`,
	default: false,
})

function UrlDisplay() {
	const setToggle = useI(toggleAtom)
	const toggle = useO(toggleAtom)
	return (
		<input
			type="checkbox"
			checked={toggle}
			onChange={() => {
				setToggle((t) => !t)
			}}
		/>
	)
}
```

## useJSON

`useJSON` is a React hook that makes working with mutable atoms in your React components more convenient.

Mutable atoms hold transceivers, such as `UList` or `OList`. Those values are
useful when you are updating them, but they are usually not the shape you want to render
directly.

If you want more background on transceivers, see [the transceivers guide](/transceivers).

`useJSON` observes the mutable atom's JSON view instead. For example, a `UList<string>`
becomes a readonly `string[]`, which is usually easier to map over in JSX.

### use json
Source: docs/source/exhibits/react/use-json.tsx

```tsx
import { mutableAtom } from "atom.io"
import { useI, useJSON } from "atom.io/react"
import { UList } from "atom.io/transceivers/u-list"

const selectedTagKeysAtom = mutableAtom<UList<string>>({
	key: `selectedTagKeys`,
	class: UList,
})

function SelectedTags() {
	const selectedTagKeys = useJSON(selectedTagKeysAtom)
	const setSelectedTagKeys = useI(selectedTagKeysAtom)

	return (
		<>
			<button
				type="button"
				onClick={() => {
					setSelectedTagKeys((tagKeys) => {
						tagKeys.add(`typescript`)
						return tagKeys
					})
				}}
			>
				Add TypeScript
			</button>
			{selectedTagKeys.map((tagKey) => (
				<div key={tagKey}>{tagKey}</div>
			))}
		</>
	)
}
```

Use `useJSON` when you want to render a mutable atom. Use `useI` when you want to update
one.

## useTL

`useTL` provides convenient access to the `undo` and `redo` utilities, as well as metadata representing how many events are on the timeline (`length`) and where the timeline is currently positioned (`at`).

### use tl
Source: docs/source/exhibits/react/use-tl.tsx

```tsx
import { useTL } from "atom.io/react"

import { coordinatesTL } from "../core/timeline/create-a-timeline"

export function UrlDisplay(): React.JSX.Element {
	const { at, length, undo, redo } = useTL(coordinatesTL)
	return (
		<>
			<div>{at}</div>
			<div>{length}</div>
			<button type="button" onClick={undo}>
				undo
			</button>
			<button type="button" onClick={redo}>
				redo
			</button>
		</>
	)
}
```

## useLoadable

If you have a `Loadable` atom or selector, `useLoadable` is a great way to observe it in your React components.

### use loadable bare
Source: docs/source/exhibits/react/use-loadable-bare.tsx

```tsx
import { atom, type Loadable } from "atom.io"
import { useLoadable } from "atom.io/react"

const myApiDataAtom = atom<Loadable<{ name: string }>>({
	key: `myApiData`,
	default: async () => {
		const response = await fetch(`https://api.github.com/users/jeremybanka`)
		return response.json()
	},
})

export function UrlDisplay(): React.JSX.Element {
	const myApiData = useLoadable(myApiDataAtom)
	if (myApiData === `LOADING`) {
		return <p>Loading...</p>
	}
	return (
		<div>
			<h1>
				{myApiData.value.name}
				{myApiData.loading ? ` ⌛` : ``}
			</h1>
		</div>
	)
}
```

In this example, we can see that the hook will return the string `"LOADING"` until the promise resolves. Then, it will return an object containing `value` with our data, and `loading` indicating whether new data is on its way.

### use loadable fallback
Source: docs/source/exhibits/react/use-loadable-fallback.tsx

```tsx
import { atom, type Loadable } from "atom.io"
import { useLoadable } from "atom.io/react"

const myApiDataAtom = atom<Loadable<{ name: string }>, Error>({
	key: `myApiData`,
	default: async () => {
		const response = await fetch(`https://api.github.com/users/jeremybanka`)
		return response.json()
	},
	catch: [Error],
})

export function UrlDisplay(): React.JSX.Element {
	const myApiData = useLoadable(myApiDataAtom, { name: `Jeremy Banka` })
	return (
		<div>
			<h1>
				{myApiData.value.name}
				{myApiData.loading ? ` ⌛` : ``}
			</h1>
			{myApiData.error ? <p>{myApiData.error.message}</p> : null}
		</div>
	)
}
```

If you'd rather assume your data is loaded, simply pass a fallback parameter with same type as your loaded data.

In this case, you don't have to deal with the possibility that your data is `"LOADING"`, and you'll also get a separate `error` property if the promise rejects.

### error handling

If the atom or selector declares a [`catch` option](/docs#catching), `useLoadable`'s
fallback form gives you a typed `error?: E` property alongside the fallback-backed
`value`.

### use loadable catch
Source: docs/source/exhibits/react/use-loadable-catch.tsx

```tsx
import { atom, type Loadable } from "atom.io"
import { useLoadable } from "atom.io/react"

class RequestError extends Error {
	public readonly status: number

	public constructor(status: number, message: string) {
		super(message)
		this.name = `RequestError`
		this.status = status
	}
}

const accountAtom = atom<Loadable<{ name: string }>, RequestError>({
	key: `account`,
	default: async () => {
		await Promise.resolve()
		throw new RequestError(503, `Service unavailable`)
	},
	catch: [RequestError],
})

export function AccountCard(): React.JSX.Element {
	const account = useLoadable(accountAtom, { name: `Guest` })
	return (
		<div>
			<h1>
				{account.value.name}
				{account.loading ? ` ⌛` : ``}
			</h1>
			{account.error ? (
				<p>
					{account.error.status}: {account.error.message}
				</p>
			) : null}
		</div>
	)
}
```

In this example, `value` stays usable as `{ name: string }`, while `error` is available as
`RequestError | undefined`. That lets your component keep rendering with fallback data
while still reacting to the handled failure case.

See [catching](/docs#catching) for how to declare that error channel on atoms and selectors.
