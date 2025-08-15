import type {
	AtomFamilyToken,
	AtomToken,
	AtomUpdateEvent,
	SelectorToken,
	SelectorUpdateEvent,
	StateCreationEvent,
	StateDisposalEvent,
	StateUpdate,
	TimelineEvent,
	TimelineManageable,
	TimelineOptions,
	TimelineToken,
	Timestamped,
	TransactionEvent,
	TransactionOutcomeEvent,
	TransactionToken,
} from "atom.io"

import type { Atom } from ".."
import { newest } from "../lineage"
import { getUpdateToken } from "../mutable"
import type { OperationCurrentlyInProgress } from "../operation"
import { deposit, type Store, withdraw } from "../store"
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
					const atomToken: AtomToken<any> = initialTopic
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

				let selectorOperation:
					| OperationCurrentlyInProgress<SelectorToken<any>>
					| undefined
				if (
					store.operation.open &&
					(store.operation.token.type === `writable_pure_selector` ||
						store.operation.token.type === `writable_held_selector`)
				) {
					selectorOperation = store.operation
				}

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
						: selectorOperation
							? `in selector "${selectorOperation.token.key}"`
							: ``,
				)
				if (tl.timeTraveling !== null) {
					return
				}

				if (txUpdateInProgress) {
					timelineJoinsTransaction(store, tl, txUpdateInProgress)
					return
				}

				if (selectorOperation) {
					timelineBuildsSelectorUpdate(
						store,
						selectorOperation,
						atom,
						update,
						tl,
					)
					return
				}

				const timestamp = Date.now()
				tl.selectorTime = null
				if (tl.at !== tl.history.length) {
					tl.history.splice(tl.at)
				}
				const atomUpdate: AtomUpdateEvent<any> & { timestamp: number } = {
					type: `update`,
					subType: `atom`,
					token: atomToken,
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

function timelineBuildsSelectorUpdate<T>(
	store: Store,
	selectorOperation: OperationCurrentlyInProgress<SelectorToken<any>>,
	atom: Atom<T>,
	update: { oldValue: T; newValue: T },
	tl: Timeline<any>,
) {
	const selectorKey = selectorOperation.token.key
	const resumingCapture = selectorOperation.time === tl.selectorTime
	let selectorUpdate = tl.history.at(-1) as Timestamped<SelectorUpdateEvent<any>>
	const atomUpdateEvent = {
		type: `update`,
		subType: `atom`,
		token: deposit(atom),
		update,
	} satisfies AtomUpdateEvent<any>
	if (resumingCapture) {
		selectorUpdate.events.push(atomUpdateEvent)
		store.logger.info(
			`⌛`,
			`timeline`,
			tl.key,
			`set selector_update "${selectorKey}" to`,
			selectorUpdate?.events.map(({ token }) => token.key),
		)
	} else {
		selectorUpdate = {
			type: `update`,
			subType: `selector`,
			token: selectorOperation.token,
			update: null as unknown as StateUpdate<any>, // ❗❗❗
			events: [atomUpdateEvent],
			timestamp: selectorOperation.time,
		}
		if (tl.at !== tl.history.length) {
			tl.history.splice(tl.at)
		}

		tl.history.push(selectorUpdate)

		store.logger.info(
			`⌛`,
			`timeline`,
			tl.key,
			`got a selector_update "${selectorKey}" with`,
			selectorUpdate.events.map(({ token }) => token.key),
		)

		tl.at = tl.history.length
		tl.selectorTime = selectorOperation.time
	}
	const willCapture = tl.shouldCapture?.(selectorUpdate, tl) ?? true
	if (willCapture) {
		tl.subject.next(selectorUpdate)
	} else {
		tl.history.pop() // ❗ Cover case where a selector update is not captured
		// but is it even reasonable?
		// not capturing a selector update means discarding all of its atom updaes...
		tl.at = tl.history.length
	}
}

function timelineJoinsTransaction(
	store: Store,
	tl: Timeline<any>,
	txUpdateInProgress: TransactionOutcomeEvent<Fn>,
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

					const updates = filterTransactionUpdates(
						transactionUpdate.events,
						timelineTopics,
					)

					const timelineTransactionUpdate: Timestamped<
						TransactionOutcomeEvent<any>
					> = {
						timestamp: Date.now(),
						...transactionUpdate,
						events: updates,
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
	updates: TransactionEvent[],
	timelineTopics: Set<string>,
): TransactionEvent[] {
	return updates
		.filter((updateFromTx) => {
			if (updateFromTx.type === `transaction_update`) {
				return true
			}

			let key: string
			let familyKey: string | undefined
			switch (updateFromTx.type) {
				case `creation`:
				case `disposal`:
					key = updateFromTx.token.key
					familyKey = updateFromTx.token.family?.key
					break
				case `molecule_creation`:
				case `molecule_disposal`:
				case `molecule_transfer`:
					return true // always include
				case `update`:
					key = updateFromTx.token.key
					familyKey = updateFromTx.token.family?.key
					break
			}
			timelineTopics.has(key)
			if (familyKey && timelineTopics.has(familyKey)) {
				return true
			}
			return timelineTopics.has(key)
		})
		.map((updateFromTx) => {
			if (updateFromTx.type === `transaction_update`) {
				return {
					...updateFromTx,
					updates: filterTransactionUpdates(updateFromTx.events, timelineTopics),
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
				timelineJoinsTransaction(store, tl, txUpdateInProgress.update)
			} else {
				tl.history.push(timelineEvent)
				tl.at = tl.history.length
				tl.subject.next(timelineEvent)
			}
		}
	}
	switch (event.type) {
		case `creation`:
			if (event.subType === `atom`) {
				addAtomToTimeline(store, event.token, tl)
			}
			break
		case `disposal`:
			tl.subscriptions.get(event.token.key)?.()
			tl.subscriptions.delete(event.token.key)
			break
	}
}
