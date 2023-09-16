import * as AtomIO from "atom.io"
import type { Json } from "atom.io/json"

import { createAtom, deleteAtom } from "../atom"
import type { Transceiver } from "./tracker-transceiver"

/**
 * @internal Give the tracker a transceiver state and a store, and it will
 * subscribe to the transceiver's inner value. When the inner value changes,
 * the tracker will update its own state to reflect the change.
 */
export class Tracker<Core extends Transceiver<any>> {
	private Update: Core extends Transceiver<infer Signal> ? Signal : never

	private initializeState(
		mutableState: AtomIO.MutableAtomToken<Core, Json.Serializable>,
		store: AtomIO.__INTERNAL__.Store = AtomIO.__INTERNAL__.IMPLICIT.STORE,
	): AtomIO.AtomToken<typeof this.Update | null> {
		const latestUpdateStateKey = `*${mutableState.key}`
		deleteAtom(latestUpdateStateKey, store)
		const latestUpdateState = createAtom<
			(Core extends Transceiver<infer Signal> ? Signal : never) | null
		>(
			{
				key: latestUpdateStateKey,
				default: null,
			},
			undefined,
			store,
		)

		return latestUpdateState
	}

	private unsubscribeFromInnerValue: (() => void) | null = null
	private observeCore(
		mutableState: AtomIO.MutableAtomToken<Core, Json.Serializable>,
		latestUpdateState: AtomIO.AtomToken<typeof this.Update | null>,
		store: AtomIO.__INTERNAL__.Store = AtomIO.__INTERNAL__.IMPLICIT.STORE,
	): void {
		const originalInnerValue = AtomIO.getState(mutableState, store)
		this.unsubscribeFromInnerValue = originalInnerValue.subscribe(
			`tracker`,
			(update) => {
				const unsubscribe = store.subject.operationStatus.subscribe(
					mutableState.key,
					() => {
						unsubscribe()
						AtomIO.setState(latestUpdateState, update)
					},
				)
			},
		)
		AtomIO.subscribe(mutableState, (update) => {
			if (update.newValue !== update.oldValue) {
				this.unsubscribeFromInnerValue?.()
				this.unsubscribeFromInnerValue = update.newValue.subscribe(
					`tracker`,
					(update) => {
						const unsubscribe = store.subject.operationStatus.subscribe(
							mutableState.key,
							() => {
								unsubscribe()
								AtomIO.setState(latestUpdateState, update)
							},
						)
					},
				)
			}
		})
	}

	private updateCore<Core extends Transceiver<any>>(
		mutableState: AtomIO.MutableAtomToken<Core, Json.Serializable>,
		latestUpdateState: AtomIO.AtomToken<typeof this.Update | null>,
		store: AtomIO.__INTERNAL__.Store = AtomIO.__INTERNAL__.IMPLICIT.STORE,
	): void {
		AtomIO.subscribe(latestUpdateState, ({ newValue, oldValue }) => {
			const timelineId = store.timelineAtoms.getRelatedKey(latestUpdateState.key)
			if (timelineId) {
				const timelineData = store.timelines.get(timelineId)
				if (timelineData?.timeTraveling) {
					const unsubscribe = AtomIO.subscribeToTimeline(
						{ key: timelineId, type: `timeline` },
						(update) => {
							unsubscribe()
							AtomIO.setState(
								mutableState,
								(core) => {
									if (update === `redo` && newValue) {
										core.do(newValue)
									} else if (update === `undo` && oldValue) {
										core.undo(oldValue)
									}
									return core
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
						AtomIO.setState(mutableState, (core) => (core.do(newValue), core))
					}
				},
			)
		})
	}

	public mutableState: AtomIO.MutableAtomToken<Core, Json.Serializable>
	public latestUpdateState: AtomIO.AtomToken<typeof this.Update | null>

	public constructor(
		mutableState: AtomIO.MutableAtomToken<Core, Json.Serializable>,
		store: AtomIO.__INTERNAL__.Store = AtomIO.__INTERNAL__.IMPLICIT.STORE,
	) {
		this.mutableState = mutableState
		this.latestUpdateState = this.initializeState(mutableState, store)
		this.observeCore(mutableState, this.latestUpdateState, store)
		this.updateCore(mutableState, this.latestUpdateState, store)
		store.trackers.set(mutableState.key, this)
	}
}
