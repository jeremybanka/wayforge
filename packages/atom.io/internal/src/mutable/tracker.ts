import type { AtomToken, FamilyMetadata, MutableAtomToken } from "atom.io"
import { getState, setState } from "atom.io"
import type { Json } from "atom.io/json"

import type { Store } from ".."
import { newest, subscribeToState, subscribeToTimeline } from ".."
import { createRegularAtom, deleteAtom } from "../atom"
import type { Transceiver } from "./transceiver"

/**
 * @internal Give the tracker a transceiver state and a store, and it will
 * subscribe to the transceiver's inner value. When the inner value changes,
 * the tracker will update its own state to reflect the change.
 */
export class Tracker<Mutable extends Transceiver<any>> {
	private Update: Mutable extends Transceiver<infer Signal> ? Signal : never

	private initializeState(
		mutableState: MutableAtomToken<Mutable, Json.Serializable>,
		store: Store,
	): AtomToken<typeof this.Update | null> {
		const latestUpdateStateKey = `*${mutableState.key}`
		store.atoms.delete(latestUpdateStateKey)
		store.valueMap.delete(latestUpdateStateKey)
		const familyMetaData: FamilyMetadata | undefined = mutableState.family
			? {
					key: `*${mutableState.family.key}`,
					subKey: mutableState.family.subKey,
			  }
			: undefined
		const latestUpdateState = createRegularAtom<
			(Mutable extends Transceiver<infer Signal> ? Signal : never) | null
		>(
			{
				key: latestUpdateStateKey,
				default: null,
			},
			familyMetaData,
			store,
		)
		if (store.parent?.valueMap.has(latestUpdateStateKey)) {
			const parentValue = store.parent.valueMap.get(latestUpdateStateKey)
			store.valueMap.set(latestUpdateStateKey, parentValue)
		}

		return latestUpdateState
	}

	private unsubscribeFromInnerValue: (() => void) | null = null
	private observeCore(
		mutableState: MutableAtomToken<Mutable, Json.Serializable>,
		latestUpdateState: AtomToken<typeof this.Update | null>,
		store: Store,
	): void {
		const originalInnerValue = getState(mutableState, store)
		const target = newest(store)
		this.unsubscribeFromInnerValue = originalInnerValue.subscribe(
			`tracker:${store.config.name}:${
				target.transactionMeta === null
					? `main`
					: target.transactionMeta.update.key
			}`,
			(update) => {
				const unsubscribe = store.subject.operationStatus.subscribe(
					mutableState.key,
					() => {
						unsubscribe()
						setState(latestUpdateState, update, store)
					},
				)
			},
		)
		subscribeToState(
			mutableState,
			(update) => {
				if (update.newValue !== update.oldValue) {
					this.unsubscribeFromInnerValue?.()
					const target = newest(store)
					this.unsubscribeFromInnerValue = update.newValue.subscribe(
						`tracker:${store.config.name}:${
							target.transactionMeta === null
								? `main`
								: target.transactionMeta.update.key
						}`,
						(update) => {
							const unsubscribe = store.subject.operationStatus.subscribe(
								mutableState.key,
								() => {
									unsubscribe()
									setState(latestUpdateState, update, store)
								},
							)
						},
					)
				}
			},
			`${store.config.name}: tracker observing inner value`,
			store,
		)
	}

	private updateCore<Core extends Transceiver<any>>(
		mutableState: MutableAtomToken<Core, Json.Serializable>,
		latestUpdateState: AtomToken<typeof this.Update | null>,
		store: Store,
	): void {
		subscribeToState(
			latestUpdateState,
			({ newValue, oldValue }) => {
				const timelineId = store.timelineAtoms.getRelatedKey(
					latestUpdateState.key,
				)
				if (timelineId) {
					const timelineData = store.timelines.get(timelineId)
					if (timelineData?.timeTraveling) {
						const unsubscribe = subscribeToTimeline(
							{ key: timelineId, type: `timeline` },
							(update) => {
								unsubscribe()
								setState(
									mutableState,
									(transceiver) => {
										if (update === `redo` && newValue) {
											transceiver.do(newValue)
										} else if (update === `undo` && oldValue) {
											transceiver.undo(oldValue)
										}
										return transceiver
									},
									store,
								)
							},
							`${mutableState.key}: tracker observing timeline`,
							store,
						)
						return
					}
				}

				const unsubscribe = store.subject.operationStatus.subscribe(
					latestUpdateState.key,
					() => {
						unsubscribe()
						const mutable = getState(mutableState, store)
						// debugger
						const updateNumber =
							newValue === null ? -1 : mutable.getUpdateNumber(newValue)
						const eventOffset = updateNumber - mutable.cacheUpdateNumber
						if (newValue && eventOffset === 1) {
							// ❗ new:"0=add:\"myHand\"",old:"0=add:\"deckId\""
							setState(
								mutableState,
								(transceiver) => (transceiver.do(newValue), transceiver),
								store,
							)
						}
					},
				)
			},
			`${store.config.name}: tracker observing latest update`,
			store,
		)
	}

	public mutableState: MutableAtomToken<Mutable, Json.Serializable>
	public latestUpdateState: AtomToken<typeof this.Update | null>

	public constructor(
		mutableState: MutableAtomToken<Mutable, Json.Serializable>,
		store: Store,
	) {
		this.mutableState = mutableState
		const target = newest(store)
		this.latestUpdateState = this.initializeState(mutableState, target)
		this.observeCore(mutableState, this.latestUpdateState, target)
		this.updateCore(mutableState, this.latestUpdateState, target)
		target.trackers.set(mutableState.key, this)
	}
}
