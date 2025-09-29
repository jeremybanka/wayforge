import type { AtomEffect } from "atom.io"
import { getFromStore, getUpdateToken, subscribeInStore } from "atom.io/internal"
import { type primitive, stringifyJson } from "atom.io/json"

import { OList } from "./o-list"

export function filterOutInPlace<T>(arr: T[], toRemove: T): T[] {
	let writeIndex = 0

	// eslint-disable-next-line @typescript-eslint/prefer-for-of
	for (let readIndex = 0; readIndex < arr.length; readIndex++) {
		if (toRemove !== arr[readIndex]) {
			arr[writeIndex] = arr[readIndex]
			writeIndex++
		}
	}

	arr.length = writeIndex
	return arr
}

export const oListDisposedKeyCleanupEffect: AtomEffect<OList<primitive>> = ({
	token,
	setSelf,
	store,
}) => {
	const disposalSubscriptions = new Map<primitive, () => void>()
	const updateToken = getUpdateToken(token)

	const addedValues = new Set<primitive>()
	const removedValues = new Set<primitive>()
	function updateSubscriptions() {
		for (const addedValue of addedValues) {
			const molecule = store.molecules.get(stringifyJson(addedValue))
			if (molecule) {
				disposalSubscriptions.set(
					addedValue,
					molecule.subject.subscribe(token.key, () => {
						disposalSubscriptions.get(addedValue)?.()
						disposalSubscriptions.delete(addedValue)
						setSelf((self) => {
							filterOutInPlace(self, addedValue)
							return self
						})
					}),
				)
			} else {
				store.logger.warn(
					`❌`,
					token.type,
					token.key,
					`Added "${addedValue}" to ${token.key} but it has not been allocated.`,
				)
			}
		}
		for (const removedValue of removedValues) {
			if (disposalSubscriptions.has(removedValue)) {
				disposalSubscriptions.get(removedValue)?.()
				disposalSubscriptions.delete(removedValue)
			}
		}
	}
	subscribeInStore(
		store,
		updateToken,
		function manageAutoDeletionTriggers({ newValue }) {
			const currentList = getFromStore(store, token)
			const unpacked = OList.unpackUpdate(newValue)
			switch (unpacked.type) {
				case `extend`:
				case `reverse`:
				case `sort`:
					break // these don't change what values are present in the list

				case `set`:
					{
						const { next } = unpacked
						if (`prev` in unpacked && !currentList.includes(unpacked.prev)) {
							removedValues.add(unpacked.prev)
						}
						if (!disposalSubscriptions.has(next)) {
							addedValues.add(next)
						}
					}
					break
				case `truncate`:
					{
						for (const item of unpacked.items) {
							if (!currentList.includes(item)) {
								removedValues.add(item)
							}
						}
					}
					break
				case `shift`:
				case `pop`:
					{
						const { value } = unpacked
						if (value !== undefined && !currentList.includes(value)) {
							removedValues.add(value)
						}
					}
					break
				case `push`:
				case `unshift`:
					for (const item of unpacked.items) {
						if (!disposalSubscriptions.has(item)) {
							addedValues.add(item)
						}
					}
					break
				case `copyWithin`:
					for (const item of unpacked.prev) {
						if (!currentList.includes(item)) {
							removedValues.add(item)
						}
					}
					break
				case `fill`:
					{
						const { value } = unpacked
						if (value !== undefined) {
							if (!disposalSubscriptions.has(value)) {
								addedValues.add(value)
							}
						}
						for (const item of unpacked.prev) {
							if (!currentList.includes(item)) {
								removedValues.add(item)
							}
						}
					}
					break
				case `splice`:
					for (const item of unpacked.deleted) {
						if (!currentList.includes(item)) {
							removedValues.add(item)
						}
					}
					for (const addedItem of unpacked.items) {
						if (!disposalSubscriptions.has(addedItem)) {
							addedValues.add(addedItem)
						}
					}
					break
			}
			updateSubscriptions()
			addedValues.clear()
			removedValues.clear()
		},
		`set-auto-deletion-triggers`,
	)
}
