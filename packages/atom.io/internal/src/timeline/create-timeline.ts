import type {
	AtomFamily,
	AtomToken,
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

export type TimelineAtomUpdate<
	Value,
	Key extends string = string,
> = StateUpdate<Value> & {
	key: Key
	type: `atom_update`
	timestamp: number
	family?: FamilyMetadata
}
export type TimelineSelectorUpdate = {
	key: string
	type: `selector_update`
	timestamp: number
	atomUpdates: Omit<TimelineAtomUpdate<unknown, string>, `timestamp`>[]
}
export type TimelineTransactionUpdate = TransactionUpdate<ƒn> & {
	key: string
	type: `transaction_update`
	timestamp: number
}

export type Timeline<
	TimelineAtom extends AtomFamily<any, any, any> | AtomToken<any, any>,
> = {
	type: `timeline`
	key: string
	at: number
	shouldCapture?: (
		update: TimelineUpdate<TimelineAtom>,
		timeline: Timeline<TimelineAtom>,
	) => boolean
	timeTraveling: `into_future` | `into_past` | null
	history: TimelineUpdate<TimelineAtom>[]
	selectorTime: number | null
	transactionKey: string | null
	install: (store: Store) => void
	subject: Subject<TimelineUpdate<TimelineAtom> | `redo` | `undo`>
}

export function createTimeline<
	TimelineAtoms extends (
		| AtomFamily<any, any, string>
		| AtomToken<any, string>
	)[],
>(
	options: TimelineOptions<TimelineAtoms>,
	store: Store,
	data?: Timeline<TimelineAtom>,
): TimelineToken {
	const tl: Timeline<TimelineAtom> = {
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
	store.subject.timelineCreation.next(token)
	return token
}
