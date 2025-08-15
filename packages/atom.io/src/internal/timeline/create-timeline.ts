import type {
	AtomFamilyToken,
	AtomToken,
	AtomUpdateEvent,
	StateCreationEvent,
	StateDisposalEvent,
	TimelineEvent,
	TimelineManageable,
	TimelineOptions,
	TimelineToken,
	TransactionOutcomeEvent,
	TransactionToken,
	TransactionUpdateContent,
} from "atom.io"

import { newest } from "../lineage"
import { getUpdateToken } from "../mutable"
import { type Store, withdraw } from "../store"
import { Subject } from "../subject"
import { isChildStore } from "../transaction"
import type { Fn } from "../utility-types"

export type Timeline<ManagedAtom extends TimelineManageable> = {
	type: `timeline`
	key: string
	at: number
	shouldCapture?: (
		update: TimelineEvent<ManagedAtom>,
		timeline: Timeline<ManagedAtom>,
	) => boolean
	timeTraveling: `into_future` | `into_past` | null
	history: TimelineEvent<ManagedAtom>[]
	selectorTime: number | null
	transactionKey: string | null
	install: (store: Store) => void
	subject: Subject<TimelineEvent<ManagedAtom> | `redo` | `undo`>
	subscriptions: Map<string, () => void>
}

export function createTimeline<ManagedAtom extends TimelineManageable>(
	store: Store,
	options: TimelineOptions<ManagedAtom>,
	data?: Timeline<ManagedAtom>,
): TimelineToken<ManagedAtom> {
	const tl: Timeline<ManagedAtom> = {
		type: `timeline`,
		key: options.key,
		at: 0,

		timeTraveling: null,
		selectorTime: null,
		transactionKey: null,
		...data,
		history: data?.history.map((update) => ({ ...update })) ?? [],
		install: (s) => createTimeline(s, options, tl),
		subject: new Subject(),
		subscriptions: new Map(),
	}
	if (options.shouldCapture) {
		tl.shouldCapture = options.shouldCapture
	}
	const timelineKey = options.key
	const target = newest(store)
	for (const initialTopic of options.scope) {
		switch (initialTopic.type) {
			case `atom`:
			case `mutable_atom`:
				{
					const atomToken: AtomToken<ManagedAtom> = initialTopic
					const atomKey = atomToken.key
					let existingTimelineKey = target.timelineTopics.getRelatedKey(atomKey)
					if (`family` in atomToken) {
						const familyKey = atomToken.family.key
						existingTimelineKey = target.timelineTopics.getRelatedKey(familyKey)
						if (existingTimelineKey) {
							store.logger.error(
								`❌`,
								`timeline`,
								options.key,
								`Failed to add atom "${atomKey}" because its family "${familyKey}" already belongs to timeline "${existingTimelineKey}"`,
							)
							continue
						}
					}
					if (existingTimelineKey) {
						store.logger.error(
							`❌`,
							`timeline`,
							options.key,
							`Failed to add atom "${atomKey}" because it already belongs to timeline "${existingTimelineKey}"`,
						)
						continue
					}
					addAtomToTimeline(store, atomToken, tl)
				}
				break

			case `atom_family`:
			case `mutable_atom_family`:
				{
					const familyToken: AtomFamilyToken<any, any> = initialTopic
					const familyKey = familyToken.key
					const existingTimelineKey =
						target.timelineTopics.getRelatedKey(familyKey)
					if (existingTimelineKey) {
						store.logger.error(
							`❌`,
							`timeline`,
							options.key,
							`Failed to add atom family "${familyKey}" because it already belongs to timeline "${existingTimelineKey}"`,
						)
						continue
					}
					addAtomFamilyToTimeline(store, familyToken, tl)
				}
				break
		}
	}

	store.timelines.set(options.key, tl)
	const token: TimelineToken<ManagedAtom> = {
		key: timelineKey,
		type: `timeline`,
	}
	store.on.timelineCreation.next(token)
	return token
}

function addAtomToTimeline(
	store: Store,
	atomToken: AtomToken<any>,
	tl: Timeline<any>,
): void {
	let maybeAtom = withdraw(store, atomToken)
	if (maybeAtom.type === `mutable_atom`) {
		const updateToken = getUpdateToken(maybeAtom)
		maybeAtom = withdraw(store, updateToken)
	}
	const atom = maybeAtom
	store.timelineTopics.set(
		{ topicKey: atom.key, timelineKey: tl.key },
		{ topicType: `atom` },
	)

	tl.subscriptions.set(
		atom.key,
		atom.subject.subscribe(
			`timeline`,
			function timelineCapturesAtomUpdate(update) {
				const target = newest(store)
				const currentSelectorKey =
					store.operation.open &&
					store.operation.token.type === `writable_pure_selector`
						? store.operation.token.key
						: null
				const currentSelectorTime =
					store.operation.open &&
					store.operation.token.type === `writable_pure_selector`
						? store.operation.time
						: null

				const txUpdateInProgress = target.on.transactionApplying.state?.update

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
					txUpdateInProgress
						? `in transaction "${txUpdateInProgress.key}"`
						: currentSelectorKey
							? `in selector "${currentSelectorKey}"`
							: ``,
				)
				if (tl.timeTraveling === null) {
					if (txUpdateInProgress) {
						joinTransaction(store, tl, txUpdateInProgress)
					} else if (currentSelectorKey && currentSelectorTime) {
						let latestUpdate: TimelineEvent<any> | undefined = tl.history.at(-1)

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
								timestamp: Date.now(), // 👺 use store operation
								update,
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
									timestamp: Date.now(), // 👺 use store operation
									update,
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
						const atomUpdate: AtomUpdateEvent<any> = {
							type: `atom_update`,
							timestamp,
							key: atom.key,
							update,
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
			},
		),
	)
}

function addAtomFamilyToTimeline(
	store: Store,
	atomFamilyToken: AtomFamilyToken<any, any>,
	tl: Timeline<any>,
): void {
	const family = withdraw(store, atomFamilyToken)
	store.timelineTopics.set(
		{ topicKey: family.key, timelineKey: tl.key },
		{ topicType: `atom_family` },
	)
	tl.subscriptions.set(
		family.key,
		family.subject.subscribe(
			`timeline`,
			function timelineCapturesStateLifecycleEvent(creationOrDisposal) {
				handleStateLifecycleEvent(store, creationOrDisposal, tl)
			},
		),
	)
	for (const atom of store.atoms.values()) {
		if (atom.family?.key === family.key) {
			addAtomToTimeline(store, atom, tl)
		}
	}
}

function joinTransaction(
	store: Store,
	tl: Timeline<any>,
	txUpdateInProgress: TransactionOutcomeEvent<Fn>,
) {
	const currentTxKey = txUpdateInProgress.key
	const currentTxInstanceId = txUpdateInProgress.id
	const currentTxToken: TransactionToken<any> = {
		key: currentTxKey,
		type: `transaction`,
	}
	const currentTransaction = withdraw(store, currentTxToken)
	if (currentTxKey && tl.transactionKey === null) {
		tl.transactionKey = currentTxKey
		const unsubscribe = currentTransaction.subject.subscribe(
			`timeline:${tl.key}`,
			(transactionUpdate) => {
				unsubscribe()
				tl.transactionKey = null
				if (tl.timeTraveling === null && currentTxInstanceId) {
					if (tl.at !== tl.history.length) {
						tl.history.splice(tl.at)
					}

					// biome-ignore lint/style/noNonNullAssertion: we are in the context of this timeline
					const timelineTopics = store.timelineTopics.getRelatedKeys(tl.key)!

					const updates = filterTransactionUpdates(
						transactionUpdate.updates,
						timelineTopics,
					)

					const timelineTransactionUpdate: TransactionOutcomeEvent<Fn> & {
						timestamp: number
					} = {
						timestamp: Date.now(),
						...transactionUpdate,
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
			},
		)
	}
}

function filterTransactionUpdates(
	updates: TransactionUpdateContent[],
	timelineTopics: Set<string>,
): TransactionUpdateContent[] {
	return updates
		.filter((updateFromTx) => {
			if (updateFromTx.type === `transaction_outcome`) {
				return true
			}

			let key: string
			let familyKey: string | undefined
			switch (updateFromTx.type) {
				case `state_creation`:
				case `state_disposal`:
					key = updateFromTx.token.key
					familyKey = updateFromTx.token.family?.key
					break
				case `molecule_creation`:
				case `molecule_disposal`:
				case `molecule_transfer`:
					return true // always include
				case `atom_update`:
					key = updateFromTx.key
					familyKey = updateFromTx.family?.key
					break
			}
			timelineTopics.has(key)
			if (familyKey && timelineTopics.has(familyKey)) {
				return true
			}
			return timelineTopics.has(key)
		})
		.map((updateFromTx) => {
			if (`updates` in updateFromTx) {
				return {
					...updateFromTx,
					updates: filterTransactionUpdates(
						updateFromTx.updates,
						timelineTopics,
					),
				}
			}
			return updateFromTx
		})
}

function handleStateLifecycleEvent(
	store: Store,
	event: StateCreationEvent<any> | StateDisposalEvent<any>,
	tl: Timeline<any>,
): void {
	const timestamp = Date.now()
	const timelineEvent = Object.assign(event, {
		timestamp,
	}) as TimelineEvent<any>
	if (!tl.timeTraveling) {
		const target = newest(store)
		if (isChildStore(target)) {
			// we don't want to update the true timeline while we are in a transaction
		} else {
			const txUpdateInProgress = target.on.transactionApplying.state
			if (txUpdateInProgress) {
				joinTransaction(store, tl, txUpdateInProgress.update)
			} else {
				tl.history.push(timelineEvent)
				tl.at = tl.history.length
				tl.subject.next(timelineEvent)
			}
		}
	}
	switch (event.type) {
		case `state_creation`:
			addAtomToTimeline(store, event.token, tl)
			break
		case `state_disposal`:
			tl.subscriptions.get(event.token.key)?.()
			tl.subscriptions.delete(event.token.key)
			break
	}
}
