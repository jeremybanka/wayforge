import type {
	AtomFamilyToken,
	AtomToken,
	FamilyMetadata,
	Flat,
	Func,
	MoleculeConstructor,
	MoleculeCreation,
	MoleculeDisposal,
	MoleculeFamilyToken,
	ReadableToken,
	StateCreation,
	StateDisposal,
	StateUpdate,
	TimelineManageable,
	TimelineOptions,
	TimelineToken,
	TimelineUpdate,
	TokenType,
	TransactionToken,
	TransactionUpdate,
	TransactionUpdateContent,
} from "atom.io"
import { stringifyJson } from "atom.io/json"

import { newest } from "../lineage"
import { getUpdateToken } from "../mutable"
import { type Store, withdraw } from "../store"
import { Subject } from "../subject"

export type TimelineAtomUpdate<ManagedAtom extends TimelineManageable> = Flat<
	StateUpdate<TokenType<ManagedAtom>> & {
		key: string
		type: `atom_update`
		timestamp: number
		family?: FamilyMetadata
	}
>
export type TimelineSelectorUpdate<ManagedAtom extends TimelineManageable> = {
	key: string
	type: `selector_update`
	timestamp: number
	atomUpdates: Omit<TimelineAtomUpdate<ManagedAtom>, `timestamp`>[]
}
export type TimelineTransactionUpdate = Flat<
	TransactionUpdate<Func> & {
		key: string
		type: `transaction_update`
		timestamp: number
	}
>
export type TimelineStateCreation<T extends ReadableToken<any>> = Flat<
	StateCreation<T> & { timestamp: number }
>
export type TimelineStateDisposal<T extends ReadableToken<any>> = Flat<
	StateDisposal<T> & { timestamp: number }
>
export type TimelineMoleculeCreation<M extends MoleculeConstructor> = Flat<
	MoleculeCreation<M> & { timestamp: number }
>
export type TimelineMoleculeDisposal = Flat<
	MoleculeDisposal & { timestamp: number }
>

export type Timeline<ManagedAtom extends TimelineManageable> = {
	type: `timeline`
	key: string
	at: number
	shouldCapture?: (
		update: TimelineUpdate<ManagedAtom>,
		timeline: Timeline<ManagedAtom>,
	) => boolean
	timeTraveling: `into_future` | `into_past` | null
	history: TimelineUpdate<ManagedAtom>[]
	selectorTime: number | null
	transactionKey: string | null
	install: (store: Store) => void
	subject: Subject<TimelineUpdate<ManagedAtom> | `redo` | `undo`>
	subscriptions: Map<string, () => void>
}

export function createTimeline<ManagedAtom extends TimelineManageable>(
	options: TimelineOptions<ManagedAtom>,
	store: Store,
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
		install: (s) => createTimeline(options, s, tl),
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
					addAtomToTimeline(atomToken, tl, store)
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
					addAtomFamilyToTimeline(familyToken, tl, store)
				}
				break

			case `molecule_family`:
				{
					const familyToken: MoleculeFamilyToken<any> = initialTopic
					const familyKey = familyToken.key
					const existingTimelineKey =
						target.timelineTopics.getRelatedKey(familyKey)
					if (existingTimelineKey) {
						store.logger.error(
							`❌`,
							`timeline`,
							options.key,
							`Failed to add molecule family "${familyKey}" because it already belongs to timeline "${existingTimelineKey}"`,
						)
						continue
					}
					addMoleculeFamilyToTimeline(familyToken, tl, store)
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
	atomToken: AtomToken<any>,
	tl: Timeline<any>,
	store: Store,
): void {
	let maybeAtom = withdraw(atomToken, store)
	if (maybeAtom.type === `mutable_atom`) {
		const updateToken = getUpdateToken(maybeAtom)
		maybeAtom = withdraw(updateToken, store)
	}
	const atom = maybeAtom
	store.timelineTopics.set(
		{ topicKey: atom.key, timelineKey: tl.key },
		{ topicType: `atom` },
	)

	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	const timelineTopics = store.timelineTopics.getRelatedKeys(tl.key)!

	tl.subscriptions.set(
		atom.key,
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
					joinTransaction(tl, txUpdateInProgress, store)
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
		}),
	)
}

function addAtomFamilyToTimeline(
	atomFamilyToken: AtomFamilyToken<any, any>,
	tl: Timeline<any>,
	store: Store,
): void {
	const family = withdraw(atomFamilyToken, store)
	store.timelineTopics.set(
		{ topicKey: family.key, timelineKey: tl.key },
		{ topicType: `atom_family` },
	)
	tl.subscriptions.set(
		family.key,
		family.subject.subscribe(`timeline`, (creationOrDisposal) => {
			handleStateLifecycleEvent(creationOrDisposal, tl, store)
		}),
	)
	for (const atom of store.atoms.values()) {
		if (atom.family?.key === family.key) {
			addAtomToTimeline(atom, tl, store)
		}
	}
}

function addMoleculeFamilyToTimeline(
	familyToken: MoleculeFamilyToken<any>,
	tl: Timeline<any>,
	store: Store,
): void {
	store.timelineTopics.set(
		{ topicKey: familyToken.key, timelineKey: tl.key },
		{ topicType: `molecule_family` },
	)
	const family = store.moleculeFamilies.get(familyToken.key)
	if (family) {
		tl.subscriptions.set(
			familyToken.key,
			family.subject.subscribe(`timeline:${tl.key}`, (creationOrDisposal) => {
				store.logger.info(
					`🐞`,
					`timeline`,
					tl.key,
					`got a molecule creation or disposal`,
					creationOrDisposal,
				)
				switch (creationOrDisposal.type) {
					case `molecule_creation`:
						{
							store.timelineTopics.set(
								{
									topicKey: creationOrDisposal.token.key,
									timelineKey: tl.key,
								},
								{ topicType: `molecule` },
							)
							const txUpdateInProgress =
								newest(store).on.transactionApplying.state?.update
							if (txUpdateInProgress) {
								joinTransaction(tl, txUpdateInProgress, store)
							} else if (tl.timeTraveling === null) {
								const event = Object.assign(creationOrDisposal, {
									timestamp: Date.now(),
								})
								tl.history.push(event)
								tl.at = tl.history.length
								tl.subject.next(event)
							}
							const molecule = withdraw(creationOrDisposal.token, store)

							for (const token of molecule.tokens.values()) {
								switch (token.type) {
									case `atom`:
									case `mutable_atom`:
										addAtomToTimeline(token, tl, store)
										break
								}
							}
							tl.subscriptions.set(
								molecule.key,
								molecule.subject.subscribe(
									`timeline:${tl.key}`,
									(stateCreationOrDisposal) => {
										handleStateLifecycleEvent(stateCreationOrDisposal, tl, store)
									},
								),
							)
						}
						break
					case `molecule_disposal`:
						{
							const txUpdateInProgress =
								newest(store).on.transactionApplying.state?.update
							if (txUpdateInProgress) {
								joinTransaction(tl, txUpdateInProgress, store)
							} else if (tl.timeTraveling === null) {
								const event = Object.assign(creationOrDisposal, {
									timestamp: Date.now(),
								})
								tl.history.push(event)
								tl.at = tl.history.length
								tl.subject.next(event)
							}
							const moleculeKey = creationOrDisposal.token.key
							tl.subscriptions.get(moleculeKey)?.()
							tl.subscriptions.delete(moleculeKey)
							for (const [familyKey] of creationOrDisposal.values) {
								const stateKey = `${familyKey}(${stringifyJson(moleculeKey)})`
								tl.subscriptions.get(stateKey)?.()
								tl.subscriptions.delete(stateKey)
								store.timelineTopics.delete(stateKey)
							}
						}
						break
				}
			}),
		)
	}
}

function joinTransaction(
	tl: Timeline<any>,
	txUpdateInProgress: TransactionUpdate<Func>,
	store: Store,
) {
	const currentTxKey = txUpdateInProgress.key
	const currentTxInstanceId = txUpdateInProgress.id
	const currentTxToken: TransactionToken<any> = {
		key: currentTxKey,
		type: `transaction`,
	}
	const currentTransaction = withdraw(currentTxToken, store)
	if (tl.transactionKey !== currentTxKey) {
		if (tl.transactionKey) {
			store.logger.error(
				`🐞`,
				`timeline`,
				tl.key,
				`unable to resolve transaction "${tl.transactionKey}. This is probably a bug in AtomIO.`,
			)
		}
	}
	tl.transactionKey = currentTxKey
	const unsubscribe = currentTransaction.subject.subscribe(
		`timeline:${tl.key}`,
		(transactionUpdate) => {
			unsubscribe()
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

				const timelineTransactionUpdate: TimelineTransactionUpdate = {
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

function filterTransactionUpdates(
	updates: TransactionUpdateContent[],
	timelineTopics: Set<string>,
): TransactionUpdateContent[] {
	return updates
		.filter((updateFromTx) => {
			if (updateFromTx.type === `transaction_update`) {
				return true
			}

			let key: string
			switch (updateFromTx.type) {
				case `state_creation`:
				case `state_disposal`:
				case `molecule_creation`:
				case `molecule_disposal`:
					key = updateFromTx.token.key
					break
				default:
					key = updateFromTx.key
					break
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
	event: StateCreation<any> | StateDisposal<any>,
	tl: Timeline<any>,
	store: Store,
): void {
	const timestamp = Date.now()
	const timelineEvent = Object.assign(event, {
		timestamp,
	}) as TimelineUpdate<any>
	if (!tl.timeTraveling) {
		const txUpdateInProgress = newest(store).on.transactionApplying.state?.update
		if (txUpdateInProgress) {
			joinTransaction(tl, txUpdateInProgress, store)
		} else {
			tl.history.push(timelineEvent)
			tl.at = tl.history.length
			tl.subject.next(timelineEvent)
		}
	}
	switch (event.type) {
		case `state_creation`:
			addAtomToTimeline(event.token, tl, store)
			break
		case `state_disposal`:
			tl.subscriptions.get(event.token.key)?.()
			tl.subscriptions.delete(event.token.key)
			break
	}
}
