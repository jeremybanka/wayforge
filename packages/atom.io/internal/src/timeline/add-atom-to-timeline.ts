import type { AtomToken, TimelineUpdate } from "atom.io"

import type {
	Timeline,
	TimelineAtomUpdate,
	TimelineTransactionUpdate,
} from "./timeline-internal"
import type { Store } from "../store"
import { IMPLICIT, withdraw } from "../store"
import { target } from "../transaction"

export const addAtomToTimeline = (
	atomToken: AtomToken<any>,
	tl: Timeline,
	store: Store = IMPLICIT.STORE,
): void => {
	const atom = withdraw(atomToken, store)
	if (atom === null) {
		throw new Error(
			`Cannot subscribe to atom "${atomToken.key}" because it has not been initialized in store "${store.config.name}"`,
		)
	}
	atom.subject.subscribe(`timeline`, (update) => {
		const currentSelectorKey =
			store.operation.open && store.operation.token.type === `selector`
				? store.operation.token.key
				: null
		const currentSelectorTime =
			store.operation.open && store.operation.token.type === `selector`
				? store.operation.time
				: null
		const currentTransactionKey =
			store.transactionStatus.phase === `applying`
				? store.transactionStatus.key
				: null
		const currentTransactionTime =
			store.transactionStatus.phase === `applying`
				? store.transactionStatus.time
				: null

		store.config.logger?.info(
			`⏳ timeline "${tl.key}" saw atom "${atomToken.key}" go (`,
			update.oldValue,
			`->`,
			update.newValue,
			currentTransactionKey
				? `) in transaction "${currentTransactionKey}"`
				: currentSelectorKey
				? `) in selector "${currentSelectorKey}"`
				: `)`,
		)

		if (tl.timeTraveling === null) {
			if (tl.selectorTime && tl.selectorTime !== currentSelectorTime) {
				const mostRecentUpdate: TimelineUpdate | undefined = tl.history.at(-1)
				if (mostRecentUpdate === undefined) {
					throw new Error(
						`Timeline "${tl.key}" has a selectorTime, but no history. This is most likely a bug in AtomIO.`,
					)
				}
			}
			if (
				currentTransactionKey &&
				store.transactionStatus.phase === `applying`
			) {
				const currentTransaction = withdraw(
					{ key: currentTransactionKey, type: `transaction` },
					store,
				)
				if (currentTransaction === null) {
					throw new Error(
						`Transaction "${currentTransactionKey}" not found in store "${store.config.name}". This is surprising, because we are in the application phase of "${currentTransactionKey}".`,
					)
				}
				if (tl.transactionKey !== currentTransactionKey) {
					if (tl.transactionKey) {
						store.config.logger?.error(
							`Timeline "${tl.key}" was unable to resolve transaction "${tl.transactionKey}. This is probably a bug.`,
						)
					}
					tl.transactionKey = currentTransactionKey
					const unsubscribe = currentTransaction.subject.subscribe(
						`timeline:${tl.key}`,
						(update) => {
							unsubscribe()
							if (tl.timeTraveling === null && currentTransactionTime) {
								if (tl.at !== tl.history.length) {
									tl.history.splice(tl.at)
								}

								const atomUpdates = update.atomUpdates.filter((atomUpdate) => {
									const core = target(store)
									const atomOrFamilyKeys = core.timelineAtoms.getRelatedIds(
										tl.key,
									)

									return atomOrFamilyKeys.some(
										(key) =>
											key === atomUpdate.key || key === atomUpdate.family?.key,
									)
								})

								const timelineTransactionUpdate: TimelineTransactionUpdate = {
									type: `transaction_update`,
									timestamp: currentTransactionTime,
									...update,
									atomUpdates,
								}
								tl.history.push(timelineTransactionUpdate)
								tl.at = tl.history.length
								tl.subject.next(timelineTransactionUpdate)
							}
							tl.transactionKey = null
							store.config.logger?.info(
								`⌛ timeline "${tl.key}" got a transaction_update "${update.key}"`,
							)
						},
					)
				}
			} else if (currentSelectorKey && currentSelectorTime) {
				let latestUpdate: TimelineUpdate | undefined = tl.history.at(-1)

				if (currentSelectorTime !== tl.selectorTime) {
					latestUpdate = {
						type: `selector_update`,
						timestamp: currentSelectorTime,
						key: currentSelectorKey,
						atomUpdates: [],
					}
					latestUpdate.atomUpdates.push({
						key: atom.key,
						type: `atom_update`,
						...update,
					})
					if (tl.at !== tl.history.length) {
						tl.history.splice(tl.at)
					}
					tl.history.push(latestUpdate)

					store.config.logger?.info(
						`⌛ timeline "${tl.key}" got a selector_update "${currentSelectorKey}" with`,
						latestUpdate.atomUpdates.map((atomUpdate) => atomUpdate.key),
					)

					tl.at = tl.history.length
					tl.selectorTime = currentSelectorTime
				} else {
					if (latestUpdate?.type === `selector_update`) {
						latestUpdate.atomUpdates.push({
							key: atom.key,
							type: `atom_update`,
							...update,
						})
						store.config.logger?.info(
							`   ⌛ timeline "${tl.key}" set selector_update "${currentSelectorKey}" to`,
							latestUpdate?.atomUpdates.map((atomUpdate) => atomUpdate.key),
						)
					}
				}
				if (latestUpdate) tl.subject.next(latestUpdate)
			} else {
				const timestamp = Date.now()
				tl.selectorTime = null
				if (tl.at !== tl.history.length) {
					tl.history.splice(tl.at)
				}
				const atomUpdate: TimelineAtomUpdate = {
					type: `atom_update`,
					timestamp,
					key: atom.key,
					oldValue: update.oldValue,
					newValue: update.newValue,
				}
				if (atom.family) {
					atomUpdate.family = atom.family
				}
				tl.history.push(atomUpdate)
				tl.subject.next(atomUpdate)
				store.config.logger?.info(
					`⌛ timeline "${tl.key}" got an atom_update to "${atom.key}"`,
				)
				tl.at = tl.history.length
			}
		}
	})
}
