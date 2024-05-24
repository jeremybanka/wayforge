import type {
	AtomFamilyToken,
	FamilyMetadata,
	Flat,
	Func,
	MoleculeCreation,
	MoleculeDisposal,
	ReadableToken,
	StateCreation,
	StateDisposal,
	StateUpdate,
	TimelineManageable,
	TimelineOptions,
	TimelineToken,
	TimelineUpdate,
	TokenType,
	TransactionUpdate,
} from "atom.io"
import { type Json, stringifyJson } from "atom.io/json"

import { newest } from "../lineage"
import { getUpdateToken, isMutable } from "../mutable"
import { type Store, withdraw } from "../store"
import { Subject } from "../subject"
import { addAtomToTimeline } from "./add-atom-to-timeline"

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
export type TimelineMoleculeCreation<Key extends Json.Serializable> = Flat<
	MoleculeCreation<Key, any> & { timestamp: number }
>
export type TimelineMoleculeDisposal<Key extends Json.Serializable> = Flat<
	MoleculeDisposal<Key> & { timestamp: number }
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
	for (const tokenOrFamily of options.scope) {
		let atomKey = tokenOrFamily.key
		switch (tokenOrFamily.type) {
			case `atom_family`:
			case `mutable_atom_family`:
				{
					const familyToken: AtomFamilyToken<any> = tokenOrFamily
					const family = withdraw(familyToken, store)
					const familyKey = family.key
					target.timelineAtoms.set({ atomKey: familyKey, timelineKey })
					tl.subscriptions.set(
						family.key,
						family.subject.subscribe(
							`timeline:${options.key}`,
							(creationOrDisposal) => {
								handleStateLifecycleEvent(creationOrDisposal, tl, store)
							},
						),
					)
					for (const atom of target.atoms.values()) {
						if (atom.family?.key === familyKey) {
							addAtomToTimeline(atom, tl, store)
						}
					}
				}
				break
			case `atom`:
			case `mutable_atom`:
				{
					let atom = withdraw(tokenOrFamily, store)
					if (isMutable(atom)) {
						const updateAtom = withdraw(getUpdateToken(atom), store)
						atom = updateAtom
						atomKey = atom.key
					}
					if (`family` in atom) {
						const familyTimelineKey = target.timelineAtoms.getRelatedKey(
							atom.family.key,
						)
						if (familyTimelineKey) {
							store.logger.error(
								`❌`,
								`timeline`,
								options.key,
								`Failed to add atom "${atom.key}" because its family "${atom.family.key}" already belongs to timeline "${familyTimelineKey}"`,
							)
							continue
						}
					}
					const existingTimelineKey = target.timelineAtoms.getRelatedKey(atomKey)
					if (existingTimelineKey) {
						store.logger.error(
							`❌`,
							`timeline`,
							options.key,
							`Failed to add atom "${atomKey}" because it already belongs to timeline "${existingTimelineKey}"`,
						)
						continue
					}
					addAtomToTimeline(atom, tl, store)
				}
				break
			case `molecule_family`:
				{
					const family = store.moleculeFamilies.get(tokenOrFamily.key)
					if (family) {
						tl.subscriptions.set(
							tokenOrFamily.key,
							family.subject.subscribe(
								`timeline:${options.key}`,
								(creationOrDisposal) => {
									switch (creationOrDisposal.type) {
										case `molecule_creation`:
											{
												const molecule = store.molecules.get(
													stringifyJson(creationOrDisposal.token.key),
												)
												if (molecule) {
													const event = Object.assign(creationOrDisposal, {
														timestamp: Date.now(),
													})
													tl.history.push(event)
													tl.at = tl.history.length
													tl.subject.next(event)

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
															`timeline:${options.key}`,
															(stateCreationOrDisposal) => {
																handleStateLifecycleEvent(
																	stateCreationOrDisposal,
																	tl,
																	store,
																)
															},
														),
													)
												}
											}
											break
										case `molecule_disposal`:
											tl.subscriptions.get(creationOrDisposal.token.key)?.()
											tl.subscriptions.delete(creationOrDisposal.token.key)
											for (const familyKey of creationOrDisposal.familyKeys) {
												const stateKey = `${familyKey}(${stringifyJson(
													creationOrDisposal.token.key,
												)})`
												tl.subscriptions.get(stateKey)?.()
												tl.subscriptions.delete(stateKey)
											}
											break
									}
								},
							),
						)
					}
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
		tl.history.push(timelineEvent)
		tl.at = tl.history.length
		tl.subject.next(timelineEvent)
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
