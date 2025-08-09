import type { FamilyMetadata, MutableAtomToken, RegularAtomToken } from "atom.io"

import type { Store } from ".."
import {
	getFromStore,
	newest,
	setIntoStore,
	subscribeToState,
	subscribeToTimeline,
} from ".."
import { createRegularAtom } from "../atom"
import { isChildStore } from "../transaction/is-root-store"
import type { SignalFrom, Transceiver } from "./transceiver"

/**
 * @internal Give the tracker a transceiver state and a store, and it will
 * subscribe to the transceiver's inner value. When the inner value changes,
 * the tracker will update its own state to reflect the change.
 */
export class Tracker<T extends Transceiver<any, any>> {
	private initializeState(
		mutableState: MutableAtomToken<T>,
		store: Store,
	): RegularAtomToken<SignalFrom<T> | null> {
		const latestUpdateStateKey = `*${mutableState.key}`
		store.atoms.delete(latestUpdateStateKey)
		store.valueMap.delete(latestUpdateStateKey)
		const familyMetaData: FamilyMetadata | undefined = mutableState.family
			? {
					key: `*${mutableState.family.key}`,
					subKey: mutableState.family.subKey,
				}
			: undefined
		const latestUpdateState = createRegularAtom<SignalFrom<T> | null>(
			store,
			{
				key: latestUpdateStateKey,
				default: null,
			},
			familyMetaData,
		)
		if (store.parent?.valueMap.has(latestUpdateStateKey)) {
			const parentValue = store.parent.valueMap.get(latestUpdateStateKey)
			store.valueMap.set(latestUpdateStateKey, parentValue)
		}

		return latestUpdateState
	}

	private unsubscribeFromInnerValue!: () => void
	private unsubscribeFromState!: () => void
	private captureSignalsFromCore(
		mutableState: MutableAtomToken<T, any>,
		latestUpdateState: RegularAtomToken<SignalFrom<T> | null>,
		target: Store,
	): void {
		const subscriptionKey = `tracker:${target.config.name}:${
			isChildStore(target) ? target.transactionMeta.update.key : `main`
		}:${mutableState.key}`
		const originalInnerValue = getFromStore(target, mutableState)
		this.unsubscribeFromInnerValue = originalInnerValue.subscribe(
			subscriptionKey,
			function trackerCapturesOutboundSignal(update) {
				setIntoStore(target, latestUpdateState, update)
			},
		)
		this.unsubscribeFromState = subscribeToState(
			target,
			mutableState,
			subscriptionKey,
			function trackerLooksForNewReference(update) {
				if (update.newValue !== update.oldValue) {
					this.unsubscribeFromInnerValue()
					this.unsubscribeFromInnerValue = update.newValue.subscribe(
						subscriptionKey,
						(transceiverUpdate) => {
							setIntoStore(target, latestUpdateState, transceiverUpdate)
						},
					)
				}
			},
		)
	}

	private supplySignalsToCore(
		mutableState: MutableAtomToken<T>,
		latestUpdateState: RegularAtomToken<SignalFrom<T> | null>,
		target: Store,
	): void {
		const subscriptionKey = `tracker:${target.config.name}:${
			isChildStore(target) ? target.transactionMeta.update.key : `main`
		}:${mutableState.key}`
		subscribeToState(
			target,
			latestUpdateState,
			subscriptionKey,
			function trackerCapturesInboundSignal({ newValue, oldValue }) {
				const timelineId = target.timelineTopics.getRelatedKey(
					latestUpdateState.key,
				)

				if (timelineId) {
					const timelineData = target.timelines.get(timelineId)
					if (timelineData?.timeTraveling) {
						const unsubscribe = subscribeToTimeline(
							target,
							{ key: timelineId, type: `timeline` },
							subscriptionKey,
							(update) => {
								unsubscribe()
								setIntoStore(target, mutableState, (transceiver) => {
									if (update === `redo` && newValue) {
										transceiver.do(newValue)
									} else if (update === `undo` && oldValue) {
										transceiver.undo(oldValue)
									}
									return transceiver
								})
							},
						)
						return
					}
				}

				const unsubscribe = target.on.operationClose.subscribe(
					subscriptionKey,
					() => {
						unsubscribe()
						const mutable = getFromStore(target, mutableState)
						const updateNumber =
							newValue === null ? -1 : mutable.getUpdateNumber(newValue)
						const eventOffset = updateNumber - mutable.cacheUpdateNumber
						if (newValue && eventOffset === 1) {
							setIntoStore(
								target,
								mutableState,
								(transceiver) => (transceiver.do(newValue), transceiver),
							)
						} else {
							target.logger.info(
								`❌`,
								`mutable_atom`,
								mutableState.key,
								`could not be updated. Expected update number ${
									mutable.cacheUpdateNumber + 1
								}, but got ${updateNumber}`,
							)
						}
					},
				)
			},
		)
	}

	public mutableState: MutableAtomToken<T>
	public latestUpdateState: RegularAtomToken<SignalFrom<T> | null>

	public [Symbol.dispose]!: () => void

	public constructor(mutableState: MutableAtomToken<T>, store: Store) {
		this.mutableState = mutableState
		const target = newest(store)
		this.latestUpdateState = this.initializeState(mutableState, target)
		this.captureSignalsFromCore(mutableState, this.latestUpdateState, target)
		this.supplySignalsToCore(mutableState, this.latestUpdateState, target)
		target.trackers.set(mutableState.key, this)
		this[Symbol.dispose] = () => {
			this.unsubscribeFromInnerValue()
			this.unsubscribeFromState()
			target.trackers.delete(mutableState.key)
		}
	}
}
