import type {
	AtomFamily,
	AtomFamilyToken,
	FamilyMetadata,
	StateUpdate,
	TimelineManageable,
	TimelineOptions,
	TimelineToken,
	TimelineUpdate,
	TokenType,
	TransactionUpdate,
	ƒn,
} from "atom.io"

import { newest } from "../lineage"
import { getUpdateToken, isMutable } from "../mutable"
import { type Store, withdraw } from "../store"
import { Subject } from "../subject"
import { addAtomToTimeline } from "./add-atom-to-timeline"

export type TimelineAtomUpdate<ManagedAtom extends TimelineManageable> =
	StateUpdate<TokenType<ManagedAtom>> & {
		key: string
		type: `atom_update`
		timestamp: number
		family?: FamilyMetadata
	}
export type TimelineSelectorUpdate<ManagedAtom extends TimelineManageable> = {
	key: string
	type: `selector_update`
	timestamp: number
	atomUpdates: Omit<TimelineAtomUpdate<ManagedAtom>, `timestamp`>[]
}
export type TimelineTransactionUpdate = TransactionUpdate<ƒn> & {
	key: string
	type: `transaction_update`
	timestamp: number
}

export type Timeline<ManagedAtom extends TimelineManageable> = {
	type: `timeline`
	key: string
	at: number
	shouldCapture?: (
		update: TimelineUpdate<TimelineManageable>,
		timeline: Timeline<ManagedAtom>,
	) => boolean
	timeTraveling: `into_future` | `into_past` | null
	history: TimelineUpdate<ManagedAtom>[]
	selectorTime: number | null
	transactionKey: string | null
	install: (store: Store) => void
	subject: Subject<
		| TimelineAtomUpdate<ManagedAtom>
		| TimelineSelectorUpdate<ManagedAtom>
		| TimelineTransactionUpdate
		| `redo`
		| `undo`
	>
}

export function createTimeline<ManagedAtom extends TimelineManageable>(
	options: TimelineOptions<ManagedAtom>,
	store: Store,
	data?: Timeline<ManagedAtom>,
): TimelineToken<ManagedAtom> {
	const tl: Timeline<ManagedAtom> = {
		type: `timeline`,
		key: options.key,
		at: 0,
		timeTraveling: null,
		selectorTime: null,
		transactionKey: null,
		...data,
		history: data?.history.map((update) => ({ ...update })) ?? [],
		install: (s) => createTimeline(options, s, tl),
		subject: new Subject(),
	}
	if (options.shouldCapture) {
		tl.shouldCapture = options.shouldCapture
	}
	const timelineKey = options.key
	const target = newest(store)
	for (const tokenOrFamily of options.atoms) {
		let atomKey = tokenOrFamily.key
		if (
			tokenOrFamily.type === `atom_family` ||
			tokenOrFamily.type === `mutable_atom_family`
		) {
			const familyToken: AtomFamilyToken<any> = tokenOrFamily
			const family = withdraw(familyToken, store)
			const familyKey = family.key
			target.timelineAtoms.set({ atomKey: familyKey, timelineKey })
			family.subject.subscribe(`timeline:${options.key}`, (token) => {
				addAtomToTimeline(token, tl, store)
			})
			for (const atom of target.atoms.values()) {
				if (atom.family?.key === familyKey) {
					addAtomToTimeline(atom, tl, store)
				}
			}
		} else {
			let atom = withdraw(tokenOrFamily, store)
			if (isMutable(atom)) {
				const updateAtom = withdraw(getUpdateToken(atom), store)
				atom = updateAtom
				atomKey = atom.key
			}
			if (`family` in atom) {
				const familyTimelineKey = target.timelineAtoms.getRelatedKey(
					atom.family.key,
				)
				if (familyTimelineKey !== undefined) {
					store.logger.error(
						`❌`,
						`timeline`,
						options.key,
						`Failed to add atom "${atom.key}" because its family "${atom.family.key}" already belongs to timeline "${familyTimelineKey}"`,
					)
					continue
				}
			}
			const existingTimelineKey = target.timelineAtoms.getRelatedKey(atomKey)
			if (existingTimelineKey !== undefined) {
				store.logger.error(
					`❌`,
					`timeline`,
					options.key,
					`Failed to add atom "${atomKey}" because it already belongs to timeline "${existingTimelineKey}"`,
				)
				continue
			}
			addAtomToTimeline(atom, tl, store)
		}
	}

	store.timelines.set(options.key, tl)
	const token: TimelineToken<ManagedAtom> = {
		key: timelineKey,
		type: `timeline`,
	}
	store.on.timelineCreation.next(token)
	return token
}
