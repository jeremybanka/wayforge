import type {
	FamilyMetadata,
	StateUpdate,
	TimelineOptions,
	TimelineToken,
	TimelineUpdate,
	TransactionUpdate,
	ƒn,
} from "atom.io"

import { newest } from "../lineage"
import { getUpdateToken } from "../mutable"
import { getUpdateFamily } from "../mutable/get-update-family"
import { isMutable } from "../mutable/is-mutable"
import { type Store, withdraw } from "../store"
import { Subject } from "../subject"
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

export function createTimeline(
	options: TimelineOptions,
	store: Store,
	data?: Timeline,
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
		install: (store) => createTimeline(options, store, tl),
		subject: new Subject(),
	}
	if (options.shouldCapture) {
		tl.shouldCapture = options.shouldCapture
	}
	const timelineKey = options.key
	const target = newest(store)
	for (const tokenOrFamily of options.atoms) {
		let atomKey = tokenOrFamily.key
		const existingTimelineKey = target.timelineAtoms.getRelatedKey(atomKey)
		if (existingTimelineKey) {
			store.logger.error(
				`❌`,
				`timeline`,
				options.key,
				`Failed to add atom "${atomKey}" because it already belongs to timeline "${existingTimelineKey}"`,
			)
			continue
		}
		if (tokenOrFamily.type === `atom_family`) {
			let family = tokenOrFamily
			if (isMutable(family)) {
				family = getUpdateFamily(family, store)
				atomKey = family.key
			}
			family.subject.subscribe(`timeline:${options.key}`, (token) => {
				addAtomToTimeline(token, tl, store)
			})
			for (const atom of target.atoms.values()) {
				if (atom.family?.key === family.key) {
					addAtomToTimeline(atom, tl, store)
				}
			}
		} else {
			let atom = withdraw(tokenOrFamily, store)
			if (atom === undefined) {
				store.logger.error(
					`❌`,
					`timeline`,
					options.key,
					`Failed to add atom "${atomKey}" because it does not exist in the store`,
				)
				continue
			}
			if (isMutable(atom)) {
				const updateAtom = withdraw(getUpdateToken(atom), store)
				if (updateAtom === undefined) {
					store.logger.error(
						`❌`,
						`timeline`,
						options.key,
						`Failed to add update atom "${atomKey}" because it does not exist in the store`,
					)
					continue
				}
				atom = updateAtom
				atomKey = atom.key
			}
			if (`family` in atom) {
				const familyTimelineKey = target.timelineAtoms.getRelatedKey(
					atom.family.key,
				)
				if (familyTimelineKey) {
					store.logger.error(
						`❌`,
						`timeline`,
						options.key,
						`Failed to add atom "${atom.key}" because its family "${atom.family.key}" already belongs to timeline "${familyTimelineKey}"`,
					)
					continue
				}
			}
			addAtomToTimeline(atom, tl, store)
		}
		target.timelineAtoms.set({ atomKey, timelineKey })
	}

	store.timelines.set(options.key, tl)
	const token: TimelineToken = {
		key: timelineKey,
		type: `timeline`,
	}
	store.on.timelineCreation.next(token)
	return token
}
