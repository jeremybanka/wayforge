import * as AtomIO from "atom.io"

import type { Transceiver } from "."

export type CacheOptions<Core extends Transceiver<any>> = {
	key: string
	default: Core
}

export const tracker = <Core extends Transceiver<any>>(
	coreState: AtomIO.AtomToken<Core>,
	store: AtomIO.__INTERNAL__.Store = AtomIO.__INTERNAL__.IMPLICIT.STORE,
): AtomIO.AtomToken<
	(Core extends Transceiver<infer Signal> ? Signal : never) | null
> => {
	const trackerKey = `${coreState.key}:signal`
	const trackerState = AtomIO.atom<
		(Core extends Transceiver<infer Signal> ? Signal : never) | null
	>({
		key: trackerKey,
		default: null,
		effects: [
			({ setSelf }) => {
				AtomIO.getState(coreState).observe((update) => setSelf(update))
			},
			({ onSet }) => {
				onSet(({ newValue, oldValue }) => {
					const timelineId = store.timelineAtoms.getRelatedId(trackerKey)
					if (timelineId) {
						const timelineData = store.timelines.get(timelineId)
						if (timelineData?.timeTraveling) {
							const unsubscribe = AtomIO.subscribeToTimeline(
								{ key: timelineId, type: `timeline` },
								(update) => {
									unsubscribe()
									AtomIO.setState(coreState, (core) => {
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
							AtomIO.setState(coreState, (core) => (core.do(newValue), core))
						}
					})
				})
			},
		],
	})
	return trackerState
}
