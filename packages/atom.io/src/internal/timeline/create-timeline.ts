import type {
	AtomFamilyToken,
	AtomToken,
	AtomUpdateEvent,
	StateCreationEvent,
	StateDisposalEvent,
	StateUpdate,
	TimelineEvent,
	TimelineManageable,
	TimelineOptions,
	TimelineToken,
	TransactionOutcomeEvent,
	TransactionSubEvent,
	TransactionToken,
	WritablePureSelectorToken,
} from "atom.io"

import { reduceReference } from "../get-state/reduce-reference"
import { newest } from "../lineage"
import { getUpdateToken } from "../mutable"
import { deposit, type Store, withdraw } from "../store"
import { Subject } from "../subject"
import { isChildStore } from "../transaction"

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
	reduceReference(store, atomToken)
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
				const currentSelectorToken =
					store.operation.open &&
					store.operation.token.type === `writable_pure_selector`
						? store.operation.token
						: null
				const currentSelectorTime =
					store.operation.open &&
					store.operation.token.type === `writable_pure_selector`
						? store.operation.timestamp
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
						? `in transaction "${txUpdateInProgress.token.key}"`
						: currentSelectorToken
							? `in selector "${currentSelectorToken.key}"`
							: ``,
				)
				if (tl.timeTraveling === null) {
					if (txUpdateInProgress) {
						joinTransaction(store, tl, txUpdateInProgress)
					} else if (currentSelectorToken && currentSelectorTime) {
						buildSelectorUpdate(
							store,
							tl,
							atomToken,
							update,
							currentSelectorToken,
							currentSelectorTime,
						)
					} else {
						const timestamp = Date.now()
						tl.selectorTime = null
						if (tl.at !== tl.history.length) {
							tl.history.splice(tl.at)
						}
						const atomUpdate: AtomUpdateEvent<any> = {
							type: `atom_update`,
							token: deposit(atom),
							update,
							timestamp,
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
	txUpdateInProgress: TransactionOutcomeEvent<TransactionToken<any>>,
) {
	const currentTxKey = txUpdateInProgress.token.key
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

					const subEventsFiltered = filterTransactionSubEvents(
						transactionUpdate.subEvents,
						timelineTopics,
					)

					const timelineTransactionUpdate: TransactionOutcomeEvent<
						TransactionToken<any>
					> = {
						...transactionUpdate,
						subEvents: subEventsFiltered,
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

function buildSelectorUpdate(
	store: Store,
	tl: Timeline<any>,
	atomToken: AtomToken<any>,
	eventOrUpdate: StateCreationEvent<any> | StateUpdate<any>,
	currentSelectorToken: WritablePureSelectorToken<any>,
	currentSelectorTime: number,
) {
	let latestUpdate: TimelineEvent<any> | undefined = tl.history.at(-1)
	if (currentSelectorTime !== tl.selectorTime) {
		latestUpdate = {
			type: `selector_update`,
			timestamp: currentSelectorTime,
			token: currentSelectorToken,
			atomUpdates: [],
		}
		if (`type` in eventOrUpdate) {
			latestUpdate.atomUpdates.push(eventOrUpdate)
		} else {
			latestUpdate.atomUpdates.push({
				type: `atom_update`,
				token: atomToken,
				update: eventOrUpdate,
				timestamp: Date.now(), // 👺 use store operation
			})
		}
		if (tl.at !== tl.history.length) {
			tl.history.splice(tl.at)
		}

		tl.history.push(latestUpdate)

		store.logger.info(
			`⌛`,
			`timeline`,
			tl.key,
			`got a selector_update "${currentSelectorToken.key}" with`,
			latestUpdate.atomUpdates.map((atomUpdate) => atomUpdate.token.key),
		)

		tl.at = tl.history.length
		tl.selectorTime = currentSelectorTime
	} else {
		if (latestUpdate?.type === `selector_update`) {
			if (`type` in eventOrUpdate) {
				latestUpdate.atomUpdates.push(eventOrUpdate)
			} else {
				latestUpdate.atomUpdates.push({
					type: `atom_update`,
					token: atomToken,
					update: eventOrUpdate,
					timestamp: Date.now(), // 👺 use store operation
				})
			}
			store.logger.info(
				`⌛`,
				`timeline`,
				tl.key,
				`set selector_update "${currentSelectorToken.key}" to`,
				latestUpdate?.atomUpdates.map((atomUpdate) => atomUpdate.token.key),
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
}

function filterTransactionSubEvents(
	updates: TransactionSubEvent[],
	timelineTopics: Set<string>,
): TransactionSubEvent[] {
	return updates
		.filter((updateFromTx) => {
			if (updateFromTx.type === `transaction_outcome`) {
				return true
			}

			let key: string
			let familyKey: string | undefined
			switch (updateFromTx.type) {
				case `atom_update`:
				case `state_creation`:
				case `state_disposal`:
					key = updateFromTx.token.key
					familyKey = updateFromTx.token.family?.key
					break
				case `molecule_creation`:
				case `molecule_disposal`:
				case `molecule_transfer`:
					return true // always include
			}
			timelineTopics.has(key)
			if (familyKey && timelineTopics.has(familyKey)) {
				return true
			}
			return timelineTopics.has(key)
		})
		.map((updateFromTx): TransactionSubEvent => {
			if (`subEvents` in updateFromTx) {
				return {
					...updateFromTx,
					subEvents: filterTransactionSubEvents(
						updateFromTx.subEvents,
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
	const currentSelectorToken =
		store.operation.open &&
		store.operation.token.type === `writable_pure_selector`
			? store.operation.token
			: null
	const currentSelectorTime =
		store.operation.open &&
		store.operation.token.type === `writable_pure_selector`
			? store.operation.timestamp
			: null
	if (!tl.timeTraveling) {
		const target = newest(store)
		if (isChildStore(target)) {
			// we don't want to update the true timeline while we are in a transaction
		} else {
			const txUpdateInProgress = target.on.transactionApplying.state
			if (txUpdateInProgress) {
				joinTransaction(store, tl, txUpdateInProgress.update)
			} else if (
				currentSelectorToken &&
				currentSelectorTime &&
				event.type === `state_creation`
			) {
				buildSelectorUpdate(
					store,
					tl,
					event.token,
					event,
					currentSelectorToken,
					currentSelectorTime,
				)
			} else {
				tl.history.push(event)
				tl.at = tl.history.length
				tl.subject.next(event)
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
