import type { AtomToken, TransactionToken, TransactionUpdate, ƒn } from "atom.io"
import type { TimelineUpdate } from "atom.io"

import { newest } from "../lineage"
import { getUpdateToken } from "../mutable"
import type { Store } from "../store"
import { withdraw } from "../store"
import type {
	Timeline,
	TimelineAtomUpdate,
	TimelineTransactionUpdate,
} from "./create-timeline"

export const addAtomToTimeline = (
	atomToken: AtomToken<any>,
	tl: Timeline<any>,
	store: Store,
): void => {
	let maybeAtom = withdraw(atomToken, store) // WITHDRAW_ANALYSIS 😡 THROWN ERROR
	if (maybeAtom?.type === `mutable_atom`) {
		const updateToken = getUpdateToken(maybeAtom)
		maybeAtom = withdraw(updateToken, store) // WITHDRAW_ANALYSIS 😡 THROWN ERROR
	}
	const atom = maybeAtom
	if (atom === undefined) {
		throw new Error(
			`Cannot subscribe to atom "${atomToken.key}" because it has not been initialized in store "${store.config.name}"`,
		)
	}
	store.timelineAtoms.set({ atomKey: atom.key, timelineKey: tl.key })

	atom.subject.subscribe(`timeline`, (update) => {
		const target = newest(store)
		const currentSelectorKey =
			store.operation.open && store.operation.token.type === `selector`
				? store.operation.token.key
				: null
		const currentSelectorTime =
			store.operation.open && store.operation.token.type === `selector`
				? store.operation.time
				: null
		const { transactionApplying } = target.on
		const currentTransactionKey = transactionApplying.state?.update.key
		const currentTransactionInstanceId = transactionApplying.state?.update.id

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
				const mostRecentUpdate: TimelineUpdate<any> | undefined =
					tl.history.at(-1)
				if (mostRecentUpdate === undefined) {
					throw new Error(
						`Timeline "${tl.key}" has a selectorTime, but no history. This is most likely a bug in AtomIO.`,
					)
				}
			}
			if (currentTransactionKey) {
				const txToken: TransactionToken<any> = {
					key: currentTransactionKey,
					type: `transaction`,
				}
				const currentTransaction = withdraw(txToken, store) // WITHDRAW_ANALYSIS 😡 THROWN ERROR
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
							if (tl.timeTraveling === null && currentTransactionInstanceId) {
								if (tl.at !== tl.history.length) {
									tl.history.splice(tl.at)
								}

								const filterUpdates = (
									updates: TransactionUpdate<ƒn>[`updates`],
								) =>
									updates
										.filter((updateFromTx) => {
											const target = newest(store)
											if (`updates` in updateFromTx) {
												return true
											}
											const atomOrFamilyKeys =
												target.timelineAtoms.getRelatedKeys(tl.key)

											return atomOrFamilyKeys
												? [...atomOrFamilyKeys].some(
														(key) =>
															key === updateFromTx.key ||
															key === updateFromTx.family?.key,
												  )
												: false
										})
										.map((updateFromTx) => {
											if (`updates` in updateFromTx) {
												return {
													...updateFromTx,
													updates: filterUpdates(updateFromTx.updates),
												}
											}
											return updateFromTx
										})

								const updates = filterUpdates(update.updates)

								const timelineTransactionUpdate: TimelineTransactionUpdate = {
									type: `transaction_update`,
									timestamp: Date.now(),
									...update,
									updates,
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
				let latestUpdate: TimelineUpdate<any> | undefined = tl.history.at(-1)

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
				const atomUpdate: TimelineAtomUpdate<any> = {
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
