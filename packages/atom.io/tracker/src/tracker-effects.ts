import * as AtomIO from "atom.io"
import type { Json } from "atom.io/json"

import type { Transceiver } from "."

export const observeCore =
	<Core extends Transceiver<any>>(
		coreState: AtomIO.AtomToken<Core>,
		store: AtomIO.__INTERNAL__.Store = AtomIO.__INTERNAL__.IMPLICIT.STORE,
	): AtomIO.AtomEffect<Json.Serializable> =>
	({ setSelf }) => {
		const innerValue = AtomIO.getState(coreState, store)
		innerValue.subscribe(`tracker`, (update) => {
			const unsubscribe = store.subject.operationStatus.subscribe(
				coreState.key,
				() => {
					unsubscribe()
					setSelf(update)
				},
			)
		})
	}

export const updateCore =
	<Core extends Transceiver<any>>(
		trackerKey: string,
		coreState: AtomIO.AtomToken<Core>,
		store: AtomIO.__INTERNAL__.Store = AtomIO.__INTERNAL__.IMPLICIT.STORE,
	): AtomIO.AtomEffect<Json.Serializable> =>
	({ onSet }) => {
		onSet(({ newValue, oldValue }) => {
			const timelineId = store.timelineAtoms.getRelatedKey(trackerKey)
			if (timelineId) {
				const timelineData = store.timelines.get(timelineId)
				if (timelineData?.timeTraveling) {
					const unsubscribe = AtomIO.subscribeToTimeline(
						{ key: timelineId, type: `timeline` },
						(update) => {
							unsubscribe()
							AtomIO.setState(
								coreState,
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
				trackerKey,
				() => {
					unsubscribe()
					if (newValue) {
						AtomIO.setState(coreState, (core) => (core.do(newValue), core))
					}
				},
			)
		})
	}
