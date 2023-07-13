import HAMT from "hamt_plus"
import * as Rx from "rxjs"

import type { ƒn } from "~/packages/anvl/src/function"

import type { Store } from "."
import { target, IMPLICIT } from "."
import { addAtomToTimeline } from "./timeline/add-atom-to-timeline"
import type {
	StateUpdate,
	TimelineOptions,
	TimelineToken,
	TimelineUpdate,
	TransactionUpdate,
} from ".."

export type TimelineAtomUpdate = StateUpdate<unknown> & {
	key: string
	type: `atom_update`
	timestamp: number
}
export type TimelineSelectorUpdate = {
	key: string
	type: `selector_update`
	timestamp: number
	atomUpdates: Omit<TimelineAtomUpdate, `timestamp`>[]
}
export type TimelineTransactionUpdate = TransactionUpdate<ƒn> & {
	key: string
	type: `transaction_update`
	timestamp: number
}

export type Timeline = {
	key: string
	at: number
	timeTraveling: boolean
	history: TimelineUpdate[]
	selectorTime: number | null
	transactionKey: string | null
	install: (store: Store) => void
	subject: Rx.Subject<
		TimelineAtomUpdate | TimelineSelectorUpdate | TimelineTransactionUpdate
	>
}

export function timeline__INTERNAL(
	options: TimelineOptions,
	store: Store = IMPLICIT.STORE,
	data: Timeline | null = null,
): TimelineToken {
	const tl: Timeline = {
		key: options.key,
		at: 0,
		timeTraveling: false,
		selectorTime: null,
		transactionKey: null,
		...data,
		history: data?.history.map((update) => ({ ...update })) ?? [],
		install: (store) => timeline__INTERNAL(options, store, tl),
		subject: new Rx.Subject(),
	}

	const core = target(store)
	for (const tokenOrFamily of options.atoms) {
		const timelineKey = core.timelineAtoms.getRelatedId(tokenOrFamily.key)
		if (timelineKey) {
			store.config.logger?.error(
				`❌ Failed to add atom "${tokenOrFamily.key}" to timeline "${options.key}" because it belongs to timeline "${timelineKey}"`,
			)
			continue
		}
		if (tokenOrFamily.type === `atom_family`) {
			const family = tokenOrFamily
			family.subject.subscribe((token) =>
				addAtomToTimeline(token, options.atoms, tl, store),
			)
		} else {
			const token = tokenOrFamily
			if (`family` in token && token.family) {
				const familyTimelineKey = core.timelineAtoms.getRelatedId(
					token.family.key,
				)
				if (familyTimelineKey) {
					store.config.logger?.error(
						`❌ Failed to add atom "${token.key}" to timeline "${options.key}" because its family "${token.family.key}" belongs to timeline "${familyTimelineKey}"`,
					)
					continue
				}
			}
			addAtomToTimeline(token, options.atoms, tl, store)
		}
		core.timelineAtoms = core.timelineAtoms.set({
			atomKey: tokenOrFamily.key,
			timelineKey: options.key,
		})
	}

	store.timelines = HAMT.set(options.key, tl, store.timelines)
	const token: TimelineToken = {
		key: options.key,
		type: `timeline`,
	}
	store.subject.timelineCreation.next(token)
	return token
}
