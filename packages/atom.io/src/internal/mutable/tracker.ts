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
		const trackerCapturesOutboundSignal = (update: SignalFrom<T>) => {
			setIntoStore(target, latestUpdateState, update)
		}
		const originalInnerValue = getFromStore(target, mutableState)
		this.unsubscribeFromInnerValue = originalInnerValue.subscribe(
			subscriptionKey,
			trackerCapturesOutboundSignal,
		)
		this.unsubscribeFromState = subscribeToState(
			target,
			mutableState,
			subscriptionKey,
			function trackerLooksForNewReference(update: SignalFrom<T>) {
				if (update.newValue !== update.oldValue) {
					this.unsubscribeFromInnerValue()
					this.unsubscribeFromInnerValue = update.newValue.subscribe(
						subscriptionKey,
						trackerCapturesOutboundSignal,
					)
				}
			}.bind(this),
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

				if (timelineId && target.timelines.get(timelineId)?.timeTraveling) {
					const unsubscribe = subscribeToTimeline(
						target,
						{ key: timelineId, type: `timeline` },
						subscriptionKey,
						function trackerWaitsForTimeTravelToFinish(update) {
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

				const mutable = getFromStore(target, mutableState)
				const updateNumber = mutable.getUpdateNumber(newValue)
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
	}

	public mutableAtomToken: MutableAtomToken<T>
	public latestSignalToken: RegularAtomToken<SignalFrom<T> | null>

	public [Symbol.dispose]!: () => void

	public constructor(mutableAtomToken: MutableAtomToken<T>, store: Store) {
		const target = newest(store)
		const latestSignalToken = this.initializeState(mutableAtomToken, target)
		this.mutableAtomToken = mutableAtomToken
		this.latestSignalToken = latestSignalToken
		this.captureSignalsFromCore(mutableAtomToken, latestSignalToken, target)
		this.supplySignalsToCore(mutableAtomToken, latestSignalToken, target)
		target.trackers.set(mutableAtomToken.key, this)
		this[Symbol.dispose] = () => {
			this.unsubscribeFromInnerValue()
			this.unsubscribeFromState()
			target.trackers.delete(mutableAtomToken.key)
		}
	}
}
