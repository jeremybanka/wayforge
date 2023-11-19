import type {
	FamilyMetadata,
	StateUpdate,
	TimelineOptions,
	TimelineToken,
	TimelineUpdate,
	TransactionUpdate,
	ƒn,
} from "atom.io"

import type { Store } from "../store"
import { IMPLICIT } from "../store"
import { Subject } from "../subject"
import { target } from "../transaction"
import { addAtomToTimeline } from "./add-atom-to-timeline"

export type TimelineAtomUpdate = StateUpdate<unknown> & {
	key: string
	type: `atom_update`
	timestamp: number
	family?: FamilyMetadata
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
	type: `timeline`
	key: string
	at: number
	shouldCapture?: (update: TimelineUpdate, timeline: Timeline) => boolean
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
		type: `timeline`,
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
	if (options.shouldCapture) {
		tl.shouldCapture = options.shouldCapture
	}

	const core = target(store)
	for (const tokenOrFamily of options.atoms) {
		const timelineKey = core.timelineAtoms.getRelatedKey(tokenOrFamily.key)
		if (timelineKey) {
			store.logger.error(
				`❌ Failed to add atom "${tokenOrFamily.key}" to timeline "${options.key}" because it belongs to timeline "${timelineKey}"`,
			)
			continue
		}
		if (tokenOrFamily.type === `atom_family`) {
			const family = tokenOrFamily
			family.subject.subscribe(`timeline:${options.key}`, (token) => {
				// if (!core.atoms.has(token.key)) {
				addAtomToTimeline(token, tl, store)
				// }
			})
			for (const atom of core.atoms.values()) {
				if (atom.family?.key === family.key) {
					addAtomToTimeline(atom, tl, store)
				}
			}
		} else {
			const token = tokenOrFamily
			if (`family` in token && token.family) {
				const familyTimelineKey = core.timelineAtoms.getRelatedKey(
					token.family.key,
				)
				if (familyTimelineKey) {
					store.logger.error(
						`❌ Failed to add atom "${token.key}" to timeline "${options.key}" because its family "${token.family.key}" belongs to timeline "${familyTimelineKey}"`,
					)
					continue
				}
			}
			addAtomToTimeline(token, tl, store)
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
