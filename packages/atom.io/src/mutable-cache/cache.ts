import * as AtomIO from "atom.io"

import type { TransmitterReceiver } from "~/packages/anvl/reactivity"

export type CacheOptions<Core extends TransmitterReceiver<any>> = {
	key: string
	default: Core
}

export const cache = <Core extends TransmitterReceiver<any>>(
	options: CacheOptions<Core>,
	store: AtomIO.__INTERNAL__.Store = AtomIO.__INTERNAL__.IMPLICIT.STORE,
): [
	mutableCore: AtomIO.AtomToken<Core>,
	immutableProxy: AtomIO.AtomToken<
		(Core extends TransmitterReceiver<infer Signal> ? Signal : never) | null
	>,
] => {
	const mutableCore = AtomIO.atom<Core>(options)
	const signalKey = `${options.key}:signal`
	const immutableProxy = AtomIO.atom<
		(Core extends TransmitterReceiver<infer Signal> ? Signal : never) | null
	>({
		key: signalKey,
		default: null,
		effects: [
			({ setSelf }) => {
				AtomIO.getState(mutableCore).observe((update) => setSelf(update))
			},
			({ onSet }) => {
				onSet(({ newValue, oldValue }) => {
					const timelineId = store.timelineAtoms.getRelatedId(signalKey)
					if (timelineId) {
						const timelineData = store.timelines.get(timelineId)
						if (timelineData?.timeTraveling) {
							const unsubscribe = AtomIO.subscribeToTimeline(
								{ key: timelineId, type: `timeline` },
								(update) => {
									unsubscribe()
									AtomIO.setState(mutableCore, (core) => {
										if (update === `redo` && newValue) {
											core.do(newValue)
										} else if (update === `undo` && oldValue) {
											core.undo(oldValue)
										}
										return core
									})
								},
							)
							return
						}
					}

					const { unsubscribe } = store.subject.operationStatus.subscribe(() => {
						unsubscribe()
						if (newValue) {
							AtomIO.setState(mutableCore, (core) => (core.do(newValue), core))
						}
					})
				})
			},
		],
	})
	return [mutableCore, immutableProxy]
}
