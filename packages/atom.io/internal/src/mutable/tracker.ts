import type { AtomToken, FamilyMetadata, MutableAtomToken } from "atom.io"
import { getState, setState, subscribe, subscribeToTimeline } from "atom.io"
import type { Json } from "atom.io/json"

import type { Store } from ".."
import { IMPLICIT } from ".."
import { createAtom, deleteAtom } from "../atom"
import { target } from "../transaction"
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
		store: Store = IMPLICIT.STORE,
	): AtomToken<typeof this.Update | null> {
		const latestUpdateStateKey = `*${mutableState.key}`
		deleteAtom(latestUpdateStateKey, store)
		const familyMetaData: FamilyMetadata | undefined = mutableState.family
			? {
					key: `*${mutableState.family.key}`,
					subKey: mutableState.family.subKey,
			  }
			: undefined
		const latestUpdateState = createAtom<
			(Mutable extends Transceiver<infer Signal> ? Signal : never) | null
		>(
			{
				key: latestUpdateStateKey,
				default: null,
			},
			familyMetaData,
			store,
		)

		return latestUpdateState
	}

	private unsubscribeFromInnerValue: (() => void) | null = null
	private observeCore(
		mutableState: MutableAtomToken<Mutable, Json.Serializable>,
		latestUpdateState: AtomToken<typeof this.Update | null>,
		store: Store = IMPLICIT.STORE,
	): void {
		const originalInnerValue = getState(mutableState, store)
		this.unsubscribeFromInnerValue = originalInnerValue.subscribe(
			`tracker:${store.config.name}:${
				store.transactionStatus.phase === `idle`
					? `main`
					: store.transactionStatus.key
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
		subscribe(
			mutableState,
			(update) => {
				if (update.newValue !== update.oldValue) {
					this.unsubscribeFromInnerValue?.()
					this.unsubscribeFromInnerValue = update.newValue.subscribe(
						`tracker:${store.config.name}:${
							store.transactionStatus.phase === `idle`
								? `main`
								: store.transactionStatus.key
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
		store: Store = IMPLICIT.STORE,
	): void {
		subscribe(
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
						)
						return
					}
				}

				const unsubscribe = store.subject.operationStatus.subscribe(
					latestUpdateState.key,
					() => {
						unsubscribe()
						if (newValue) {
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
		store: Store = IMPLICIT.STORE,
	) {
		this.mutableState = mutableState
		this.latestUpdateState = this.initializeState(mutableState, store)
		this.observeCore(mutableState, this.latestUpdateState, store)
		this.updateCore(mutableState, this.latestUpdateState, store)
		const core = target(store)
		core.trackers.set(mutableState.key, this)
	}
}
