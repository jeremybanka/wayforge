import type { AtomEffect } from "atom.io"
import { getUpdateToken, subscribeInStore } from "atom.io/internal"
import { type primitive, stringifyJson } from "atom.io/json"

import { UList } from "./u-list"

export const uListAutoDeleteOnDispose: AtomEffect<UList<primitive>> = ({
	token,
	setSelf,
	store,
}) => {
	const disposalSubscriptions = new Map<primitive, () => void>()
	const updateToken = getUpdateToken(token)
	subscribeInStore(
		store,
		updateToken,
		function setAutoDeletionTriggers({ newValue }) {
			const unpacked = UList.unpackUpdate(newValue)
			switch (unpacked.type) {
				case `add`:
					{
						const molecule = store.molecules.get(stringifyJson(unpacked.value))
						if (molecule) {
							disposalSubscriptions.set(
								unpacked.value,
								molecule.subject.subscribe(token.key, () => {
									setSelf((self) => {
										self.delete(unpacked.value)
										return self
									})
								}),
							)
						}
					}
					break
				case `delete`:
					disposalSubscriptions.get(unpacked.value)?.()
					disposalSubscriptions.delete(unpacked.value)
					break
				case `clear`:
					for (const unsub of disposalSubscriptions.values()) unsub()
					disposalSubscriptions.clear()
			}
		},
		`set-auto-deletion-triggers`,
	)
}
