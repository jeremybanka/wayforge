import type { AtomFamily, ReadonlySelectorFamily } from "atom.io"
import { atomFamily, getState, selectorFamily, setState } from "atom.io"
import { Junction } from "rel8/junction"

import type { MutableAtomFamily } from "atom.io"
import { IMPLICIT, createMutableAtomFamily } from "atom.io/internal"
import type { Json } from "~/packages/anvl/src/json"
import { SetRTX } from "~/packages/atom.io/transceivers/set-rtx/src"

type AtomicJunctionOptions<
	ASide extends string,
	BSide extends string,
	Content extends Json.Object | null = null,
> = (Content extends Json.Object
	? { defaultContent: Content }
	: { defaultContent?: undefined }) & {
	key: string
	between: [a: ASide, b: BSide]
	cardinality: `1:1` | `1:n` | `n:n`
}

export class AtomicJunction<
	ASide extends string,
	BSide extends string,
	Content extends Json.Object | null = null,
> {
	public key: string
	public between: [a: ASide, b: BSide]
	public cardinality: `1:1` | `1:n` | `n:n`
	public defaultContent: Content

	public findRelatedKeysState: ReadonlySelectorFamily<string[], string>
	public findRelatedKeyState: ReadonlySelectorFamily<string | undefined, string>
	public findRelationContentState: Content extends Json.Object
		? ReadonlySelectorFamily<Content, string>
		: null
	public findRelationEntriesState: Content extends Json.Object
		? ReadonlySelectorFamily<[string, Content][], string>
		: null
	public set: Junction<ASide, BSide, Content>[`set`]
	public delete: Junction<ASide, BSide, Content>[`delete`]

	private junction: Junction<ASide, BSide, Content>
	public findRelationsState__INTERNAL: MutableAtomFamily<
		SetRTX<string>,
		string[],
		string
	>
	public findRelationContentState__INTERNAL: Content extends Json.Object
		? AtomFamily<Content, string>
		: null
	public constructor({
		key,
		between,
		cardinality,
		defaultContent,
	}: AtomicJunctionOptions<ASide, BSide, Content>) {
		this.findRelationsState__INTERNAL = createMutableAtomFamily<
			SetRTX<string>,
			string[],
			string
		>(
			{
				key: `${key}:relations::mutable`,
				mutable: true,
				default: () => new SetRTX(),
				toJson: (relations) => [...relations],
				fromJson: (relations) => new SetRTX(relations),
			},
			IMPLICIT.STORE,
		)

		this.findRelationContentState__INTERNAL = (
			defaultContent
				? atomFamily<Content, string>({
						key: `${key}:contents`,
						default: defaultContent as Content,
				  })
				: null
		) as Content extends Json.Object ? AtomFamily<Content, string> : null

		const externalStore: any = {
			has: (a: string, b?: string) => {
				const aRelations = getState(this.findRelationsState__INTERNAL(a))
				return b ? aRelations.has(b) : aRelations.size > 0
			},
			addRelation: (a: string, b: string) => {
				const relationTrackerA = this.findRelationsState__INTERNAL(a)
				const relationTrackerB = this.findRelationsState__INTERNAL(b)
				setState(relationTrackerA, (current) => current.add(b))
				setState(relationTrackerB, (current) => current.add(a))
			},
			deleteRelation: (a, b) => {
				const relationTrackerA = this.findRelationsState__INTERNAL(a)
				const relationTrackerB = this.findRelationsState__INTERNAL(b)
				setState(relationTrackerA, (current) => (current.delete(b), current))
				setState(relationTrackerB, (current) => (current.delete(a), current))
			},
			getRelatedKeys: (a) => {
				const relatedKeys = getState(this.findRelationsState__INTERNAL(a))
				return relatedKeys
			},
		}

		if (this.findRelationContentState__INTERNAL) {
			externalStore.getContent = (contentKey: string) => {
				if (!this.findRelationContentState__INTERNAL) {
					throw new Error(
						`Absurd error: this.findContentsState__INTERNAL is null when seeking content for key "${contentKey}".`,
					)
				}
				return getState(this.findRelationContentState__INTERNAL(contentKey))
			}
			externalStore.setContent = (contentKey: string, content: Content) => {
				if (!this.findRelationContentState__INTERNAL) {
					throw new Error(
						`Absurd error: this.findContentsState__INTERNAL is null when setting content for key "${contentKey}".`,
					)
				}
				setState(
					this.findRelationContentState__INTERNAL(contentKey),
					content as any,
				)
			}
			externalStore.deleteContent = () => null
		}

		this.junction = new Junction<ASide, BSide, Content>(
			{
				between,
				cardinality,
			},
			{
				externalStore,
			},
		)

		this.set = this.junction.set.bind(this.junction)
		this.delete = this.junction.delete.bind(this.junction)

		this.key = key
		this.between = between
		this.cardinality = cardinality
		this.defaultContent = defaultContent as Content

		this.findRelatedKeysState = selectorFamily<string[], string>({
			key: `${key}:relations:selector`,
			get:
				(key: string) =>
				({ get }) => [...get(this.findRelationsState__INTERNAL(key))],
		})
		this.findRelatedKeyState = selectorFamily<string | undefined, string>({
			key: `${key}:relation:selector`,
			get:
				(key: string) =>
				({ get }) =>
					get(this.findRelatedKeysState(key))[0],
		})
		this.findRelationContentState = (
			defaultContent
				? selectorFamily({
						key: `${key}:contents:selector`,
						get:
							(key: string) =>
							({ get }) => {
								if (this.findRelationContentState__INTERNAL === null) {
									throw new Error(
										`Absurd error: this.findContentsState__INTERNAL is null when getting content for key "${key}".`,
									)
								}
								get(this.findRelationContentState__INTERNAL(key))
							},
				  })
				: null
		) as Content extends Json.Object
			? ReadonlySelectorFamily<Content, string>
			: null
		this.findRelationEntriesState = (
			defaultContent
				? selectorFamily({
						key: `${key}:relationEntries:selector`,
						get:
							(key: string) =>
							({ get }) => {
								if (this.findRelationContentState__INTERNAL === null) {
									throw new Error(
										`Absurd error: this.findContentsState__INTERNAL is null when getting content for key "${key}".`,
									)
								}
								const relations = get(this.findRelatedKeysState(key))
								const contents = get(
									this.findRelationContentState__INTERNAL(key),
								)
								return relations.map((b) => [b, contents?.[b] ?? null] as const)
							},
				  })
				: null
		) as Content extends Json.Object
			? ReadonlySelectorFamily<[string, Content][], string>
			: null
	}
}
