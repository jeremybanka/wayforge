import * as AtomIO from "atom.io"
import type { Json } from "atom.io/json"

import { createAtom, deleteAtom } from "../atom"
import { target } from "../transaction"
import type { Transceiver } from "./tracker-transceiver"

console.log({ AtomIO })

/**
 * @internal Give the tracker a transceiver state and a store, and it will
 * subscribe to the transceiver's inner value. When the inner value changes,
 * the tracker will update its own state to reflect the change.
 */
export class Tracker<Mutable extends Transceiver<any>> {
	private Update: Mutable extends Transceiver<infer Signal> ? Signal : never

	private initializeState(
		mutableState: AtomIO.MutableAtomToken<Mutable, Json.Serializable>,
		store: AtomIO.__INTERNAL__.Store = AtomIO.__INTERNAL__.IMPLICIT.STORE,
	): AtomIO.AtomToken<typeof this.Update | null> {
		const latestUpdateStateKey = `*${mutableState.key}`
		deleteAtom(latestUpdateStateKey, target(store))
		const latestUpdateState = createAtom<
			(Mutable extends Transceiver<infer Signal> ? Signal : never) | null
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
		mutableState: AtomIO.MutableAtomToken<Mutable, Json.Serializable>,
		latestUpdateState: AtomIO.AtomToken<typeof this.Update | null>,
		store: AtomIO.__INTERNAL__.Store = AtomIO.__INTERNAL__.IMPLICIT.STORE,
	): void {
		const originalInnerValue = AtomIO.getState(mutableState, store)
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
						AtomIO.setState(latestUpdateState, update, store)
					},
				)
			},
		)
		AtomIO.subscribe(
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
									AtomIO.setState(latestUpdateState, update, store)
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
		mutableState: AtomIO.MutableAtomToken<Core, Json.Serializable>,
		latestUpdateState: AtomIO.AtomToken<typeof this.Update | null>,
		store: AtomIO.__INTERNAL__.Store = AtomIO.__INTERNAL__.IMPLICIT.STORE,
	): void {
		AtomIO.subscribe(
			latestUpdateState,
			({ newValue, oldValue }) => {
				console.log(`💥💥💥💥💥`, store.config.name, `latest update changed`)
				const timelineId = store.timelineAtoms.getRelatedKey(
					latestUpdateState.key,
				)
				if (timelineId) {
					const timelineData = store.timelines.get(timelineId)
					if (timelineData?.timeTraveling) {
						const unsubscribe = AtomIO.subscribeToTimeline(
							{ key: timelineId, type: `timeline` },
							(update) => {
								unsubscribe()
								AtomIO.setState(
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
						console.log(`💥💥💥💥💥💥`, store.config.name, `update core`)
						if (newValue) {
							AtomIO.setState(
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

	public mutableState: AtomIO.MutableAtomToken<Mutable, Json.Serializable>
	public latestUpdateState: AtomIO.AtomToken<typeof this.Update | null>

	public constructor(
		mutableState: AtomIO.MutableAtomToken<Mutable, Json.Serializable>,
		store: AtomIO.__INTERNAL__.Store = AtomIO.__INTERNAL__.IMPLICIT.STORE,
	) {
		this.mutableState = mutableState
		this.latestUpdateState = this.initializeState(mutableState, store)
		this.observeCore(mutableState, this.latestUpdateState, store)
		this.updateCore(mutableState, this.latestUpdateState, store)
		const core = target(store)
		core.trackers.set(mutableState.key, this)
	}
}
