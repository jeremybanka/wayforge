import type { AtomToken, TimelineUpdate } from "atom.io"

import type { Store } from "../store"
import { withdraw } from "../store"
import { target } from "../transaction"
import type {
	Timeline,
	TimelineAtomUpdate,
	TimelineTransactionUpdate,
} from "./create-timeline"

export const addAtomToTimeline = (
	atomToken: AtomToken<any>,
	tl: Timeline,
	store: Store,
): void => {
	const atom = withdraw(atomToken, store)
	if (atom === undefined) {
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

		store.logger.info(
			`⏳`,
			`timeline`,
			tl.key,
			`atom`,
			atomToken.key,
			`went`,
			update.oldValue,
			`->`,
			update.newValue,
			currentTransactionKey
				? `in transaction "${currentTransactionKey}"`
				: currentSelectorKey
				? `in selector "${currentSelectorKey}"`
				: ``,
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
				if (currentTransaction === undefined) {
					throw new Error(
						`Transaction "${currentTransactionKey}" not found in store "${store.config.name}". This is surprising, because we are in the application phase of "${currentTransactionKey}".`,
					)
				}
				if (tl.transactionKey !== currentTransactionKey) {
					if (tl.transactionKey) {
						store.logger.error(
							`🐞`,
							`timeline`,
							tl.key,
							`unable to resolve transaction "${tl.transactionKey}. This is probably a bug in AtomIO.`,
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
									const atomOrFamilyKeys = core.timelineAtoms.getRelatedKeys(
										tl.key,
									)

									return atomOrFamilyKeys
										? [...atomOrFamilyKeys].some(
												(key) =>
													key === atomUpdate.key ||
													key === atomUpdate.family?.key,
										  )
										: false
								})

								const timelineTransactionUpdate: TimelineTransactionUpdate = {
									type: `transaction_update`,
									timestamp: currentTransactionTime,
									...update,
									atomUpdates,
								}
								const willCapture =
									tl.shouldCapture?.(timelineTransactionUpdate, tl) ?? true
								if (willCapture) {
									tl.history.push(timelineTransactionUpdate)
									tl.at = tl.history.length
									tl.subject.next(timelineTransactionUpdate)
								}
							}
							tl.transactionKey = null
							store.logger.info(
								`⌛`,
								`timeline`,
								tl.key,
								`got a transaction_update "${update.key}"`,
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

					store.logger.info(
						`⌛`,
						`timeline`,
						tl.key,
						`got a selector_update "${currentSelectorKey}" with`,
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
						store.logger.info(
							`⌛`,
							`timeline`,
							tl.key,
							`set selector_update "${currentSelectorKey}" to`,
							latestUpdate?.atomUpdates.map((atomUpdate) => atomUpdate.key),
						)
					}
				}
				if (latestUpdate) {
					const willCaptureSelectorUpdate =
						tl.shouldCapture?.(latestUpdate, tl) ?? true
					if (willCaptureSelectorUpdate) {
						tl.subject.next(latestUpdate)
					} else {
						tl.history.pop()
						tl.at = tl.history.length
					}
				}
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
				const willCapture = tl.shouldCapture?.(atomUpdate, tl) ?? true
				store.logger.info(
					`⌛`,
					`timeline`,
					tl.key,
					`got an atom_update to "${atom.key}"`,
				)
				if (willCapture) {
					tl.history.push(atomUpdate)
					tl.at = tl.history.length
					tl.subject.next(atomUpdate)
				}
			}
		}
	})
}
