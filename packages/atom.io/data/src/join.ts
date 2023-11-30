import type { MutableAtomFamily, Read, Transactors, Write } from "atom.io"
import { getState, setState } from "atom.io"
import type { Store } from "atom.io/internal"
import { createAtomFamily, createMutableAtomFamily } from "atom.io/internal"
import type { Json } from "atom.io/json"
import { SetRTX } from "atom.io/transceivers/set-rtx"

import type {
	BaseExternalStoreConfiguration,
	ExternalStoreConfiguration,
	ExternalStoreWithContentConfiguration,
	JunctionEntries,
	JunctionSchema,
} from "~/packages/rel8/junction/src"
import { Junction } from "~/packages/rel8/junction/src"

export type JoinOptions<ASide extends string, BSide extends string> = {
	key: string
	between: [a: ASide, b: BSide]
	cardinality: `1:1` | `1:n` | `n:n`
}

const TRANSACTORS: Transactors = { get: getState, set: setState }

export function createJoin<ASide extends string, BSide extends string>(
	options: JoinOptions<ASide, BSide>,
	defaultContent: undefined,
	store: Store,
): {
	junction: Junction<ASide, BSide>
	findRelatedKeysState: MutableAtomFamily<SetRTX<string>, string[], string>
}
export function createJoin<
	ASide extends string,
	BSide extends string,
	Content extends Json.Object,
>(
	options: JoinOptions<ASide, BSide>,
	defaultContent: Content,
	store: Store,
): {
	junction: Junction<ASide, BSide, Content>
	findRelatedKeysState: MutableAtomFamily<SetRTX<string>, string[], string>
}
export function createJoin<
	ASide extends string,
	BSide extends string,
	Content extends Json.Object,
>(
	options: JoinOptions<ASide, BSide>,
	defaultContent: Content | undefined,
	store: Store,
): {
	junction: Junction<ASide, BSide, Content>
	findRelatedKeysState: MutableAtomFamily<SetRTX<string>, string[], string>
} {
	const findRelatedKeysState = createMutableAtomFamily<
		SetRTX<string>,
		string[],
		string
	>(
		{
			key: `${options.key}/relatedKeys`,
			default: () => new SetRTX(),
			mutable: true,
			fromJson: (json) => new SetRTX(json),
			toJson: (set) => [...set],
		},
		store,
	)
	const getRelatedKeys: Read<(key: string) => Set<string> | undefined> = (
		{ get },
		key,
	) => get(findRelatedKeysState(key))
	const addRelation: Write<(a: string, b: string) => void> = (
		transactors,
		a,
		b,
	) => {
		const aKeys = getRelatedKeys(transactors, a)
		const bKeys = getRelatedKeys(transactors, b)
		if (aKeys) {
			transactors.set(findRelatedKeysState(a), aKeys.add(b))
		} else {
			transactors.set(findRelatedKeysState(a), new SetRTX([b]))
		}
		if (bKeys) {
			transactors.set(findRelatedKeysState(b), bKeys.add(a))
		} else {
			transactors.set(findRelatedKeysState(b), new SetRTX([a]))
		}
	}
	const deleteRelation: Write<(a: string, b: string) => void> = (
		transactors,
		a,
		b,
	) => {
		const aKeys = getRelatedKeys(transactors, a)
		if (aKeys) {
			aKeys.delete(b)
			if (aKeys.size === 0) {
				transactors.set(findRelatedKeysState(a), undefined)
			}
			const bKeys = getRelatedKeys(transactors, b)
			if (bKeys) {
				bKeys.delete(a)
				if (bKeys.size === 0) {
					transactors.set(findRelatedKeysState(b), undefined)
				}
			}
		}
	}
	const has: Read<(a: string, b?: string) => boolean> = (transactors, a, b) => {
		const aKeys = getRelatedKeys(transactors, a)
		return b ? aKeys?.has(b) ?? false : (aKeys?.size ?? 0) > 0 ?? false
	}
	const baseExternalStoreConfiguration: BaseExternalStoreConfiguration = {
		getRelatedKeys: (key) => getRelatedKeys(TRANSACTORS, key),
		addRelation: (a, b) => {
			addRelation(TRANSACTORS, a, b)
		},
		deleteRelation: (a, b) => deleteRelation(TRANSACTORS, a, b),
		has: (a, b) => has(TRANSACTORS, a, b),
	}
	let externalStore: ExternalStoreConfiguration<Content>
	if (defaultContent) {
		const findContentState = createAtomFamily<Content, string>(
			{
				key: `${options.key}/content`,
				default: defaultContent,
			},
			store,
		)
		const getContent: Read<(key: string) => Content | undefined> = (
			{ get },
			key,
		) => get(findContentState(key))
		const setContent: Write<(key: string, content: Content) => void> = (
			transactors,
			key,
			content,
		) => transactors.set(findContentState(key), content)
		const deleteContent: Write<(key: string) => void> = (transactors, key) =>
			transactors.set(findContentState(key), undefined)
		const externalStoreWithContentConfiguration: ExternalStoreWithContentConfiguration<Content> =
			{
				getContent: (contentKey: string) => {
					const content = getContent(TRANSACTORS, contentKey)
					return content
				},
				setContent: (contentKey: string, content: Content) => {
					setContent(TRANSACTORS, contentKey, content)
				},
				deleteContent: (contentKey: string) => {
					deleteContent(TRANSACTORS, contentKey)
				},
			}
		externalStore = Object.assign(
			baseExternalStoreConfiguration,
			externalStoreWithContentConfiguration,
		) as ExternalStoreConfiguration<Content>
	} else {
		externalStore =
			baseExternalStoreConfiguration as ExternalStoreConfiguration<Content>
	}
	const junction = new Junction<ASide, BSide, Content>(
		options as JunctionSchema<ASide, BSide> & Partial<JunctionEntries<Content>>,
		{ externalStore },
	)
	return {
		junction,
		findRelatedKeysState,
	}
}
