# atom.io/transceivers

Source: docs/source/pages/transceivers.mdx
URL: /transceivers

# transceivers

A transceiver is a mutable object that can report its own updates to atom.io.

That makes it a good fit for collections that change often. Instead of replacing an
entire value every time something changes, you can mutate the transceiver and let
atom.io capture the specific update that happened.

Transceivers are especially useful because they let mutable atoms participate in
transactions and timelines. atom.io can observe each update, apply it as part of a
transaction, and record it in a timeline for undo and redo.

## built-in transceivers

The built-in transceivers you will usually reach for are `UList` and `OList`.

## UList

`UList` is an unordered list. In practice, it behaves like a `Set`.

Use it when membership matters, but order does not.

### u list
Source: docs/source/exhibits/transceivers/u-list.ts

```ts
import { getState, mutableAtom, setState } from "atom.io"
import { UList } from "atom.io/transceivers/u-list"

const selectedTagKeysAtom = mutableAtom<UList<string>>({
	key: `selectedTagKeys`,
	class: UList,
})

setState(selectedTagKeysAtom, (selectedTagKeys) => {
	selectedTagKeys.add(`typescript`)
	selectedTagKeys.add(`atom-io`)
	return selectedTagKeys
})

getState(selectedTagKeysAtom).has(`typescript`) // -> true
```

## OList

`OList` is an ordered list. In practice, it behaves like an `Array`.

Use it when order matters.

### o list
Source: docs/source/exhibits/transceivers/o-list.ts

```ts
import { getState, mutableAtom, setState } from "atom.io"
import { OList } from "atom.io/transceivers/o-list"

const queueAtom = mutableAtom<OList<string>>({
	key: `queue`,
	class: OList,
})

setState(queueAtom, (queue) => {
	queue.push(`first`)
	queue.push(`second`)
	return queue
})

getState(queueAtom)[0] // -> "first"
```

You do not need to learn any special implementation details to use these. If you know
how to work with a `Set` and an `Array`, you already know the important part.
