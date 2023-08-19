import type { ƒn } from "~/packages/anvl/src/function"

import { addAtomToTimeline } from "./add-atom-to-timeline"
import { Subject, target, IMPLICIT } from ".."
import type { Store } from ".."
import type {
	StateUpdate,
	TimelineOptions,
	TimelineToken,
	TimelineUpdate,
	TransactionUpdate,
} from "../.."

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
	timeTraveling: `into_future` | `into_past` | null
	history: TimelineUpdate[]
	selectorTime: number | null
	transactionKey: string | null
	install: (store: Store) => void
	subject: Subject<
		| TimelineAtomUpdate
		| TimelineSelectorUpdate
		| TimelineTransactionUpdate
		| `redo`
		| `undo`
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
		timeTraveling: null,
		selectorTime: null,
		transactionKey: null,
		...data,
		history: data?.history.map((update) => ({ ...update })) ?? [],
		install: (store) => timeline__INTERNAL(options, store, tl),
		subject: new Subject(),
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

	store.timelines.set(options.key, tl)
	const token: TimelineToken = {
		key: options.key,
		type: `timeline`,
	}
	store.subject.timelineCreation.next(token)
	return token
}
