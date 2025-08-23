import type { Json } from "atom.io/json"

import { MapOverlay, RelationsOverlay, SetOverlay } from "./map-overlay"
import type { Refinement } from "./utility-types"

export type JunctionEntriesBase<
	A extends string,
	B extends string,
	Content extends Json.Object | null,
> = {
	readonly relations: ([A, B[]] | [B, A[]])[]
	readonly contents: [string, Content][]
}
export interface JunctionEntries<
	A extends string,
	B extends string,
	Content extends Json.Object | null,
> extends Json.Object,
		JunctionEntriesBase<A, B, Content> {}

export type JunctionSchemaBase<AName extends string, BName extends string> = {
	/** Description of the relationship between the two sides */
	readonly between: [a: AName, b: BName]
	/** How many relations are allowed in each direction? */
	readonly cardinality: `1:1` | `1:n` | `n:n`
}
export interface JunctionSchema<ASide extends string, BSide extends string>
	extends Json.Object,
		JunctionSchemaBase<ASide, BSide> {}

export type BaseExternalStoreConfiguration = {
	addRelation: (a: string, b: string) => void
	deleteRelation: (a: string, b: string) => void
	replaceRelationsSafely: (a: string, bs: string[]) => void
	replaceRelationsUnsafely: (a: string, bs: string[]) => void
	getRelatedKeys(key: string): Set<string> | undefined
	has: (a: string, b?: string) => boolean
}

export type ExternalStoreWithContentConfiguration<Content extends Json.Object> =
	{
		getContent: (contentKey: string) => Content | undefined
		setContent: (contentKey: string, content: Content) => void
		deleteContent: (contentKey: string) => void
	}

export type Empty<Obj extends object> = {
	[Key in keyof Obj]?: undefined
}

export type ExternalStoreConfiguration<Content extends Json.Object | null> =
	Content extends Json.Object
		? BaseExternalStoreConfiguration &
				ExternalStoreWithContentConfiguration<Content>
		: BaseExternalStoreConfiguration &
				Empty<ExternalStoreWithContentConfiguration<Json.Object>>

export type JunctionAdvancedConfiguration<
	AName extends string,
	A extends string,
	BName extends string,
	B extends string,
	Content extends Json.Object | null,
> = {
	warn?: (...args: any[]) => void
	externalStore?: ExternalStoreConfiguration<Content>
	isAType?: Refinement<string, A>
	isBType?: Refinement<string, B>
	isContent?: Refinement<unknown, Content>
	makeContentKey?: (a: A, b: B) => string
	source?: Junction<AName, A, BName, B, Content>
}

export type JunctionJSON<
	AName extends string,
	A extends string,
	BName extends string,
	B extends string,
	Content extends Json.Object | null,
> = JunctionEntries<A, B, Content> & JunctionSchema<AName, BName>

export class Junction<
	const AName extends string,
	const A extends string,
	const BName extends string,
	const B extends string,
	const Content extends Json.Object | null = null,
> {
	public readonly a: AName
	public readonly b: BName
	public readonly cardinality: `1:1` | `1:n` | `n:n`
	public readonly relations: Map<A | B, Set<A> | Set<B>> = new Map()
	public readonly contents: Map<string, Content> = new Map()

	public isAType?: Refinement<string, A> | null
	public isBType?: Refinement<string, B> | null
	public isContent: Refinement<unknown, Content> | null
	public makeContentKey = (a: A, b: B): string => `${a}:${b}`

	public warn?: (...args: any[]) => void

	public getRelatedKeys(key: A): Set<B> | undefined
	public getRelatedKeys(key: B): Set<A> | undefined
	public getRelatedKeys(key: A | B): Set<A> | Set<B> | undefined
	public getRelatedKeys(key: A | B): Set<A> | Set<B> | undefined {
		return this.relations.get(key)
	}
	protected addRelation(a: A, b: B): void {
		let aRelations = this.relations.get(a) as Set<B> | undefined
		let bRelations = this.relations.get(b) as Set<A> | undefined
		if (aRelations) {
			aRelations.add(b)
		} else {
			aRelations = new Set([b])
			this.relations.set(a, aRelations)
		}
		if (bRelations) {
			bRelations.add(a)
		} else {
			bRelations = new Set([a])
			this.relations.set(b, bRelations)
		}
	}
	protected deleteRelation(a: A, b: B): void {
		const aRelations = this.relations.get(a) as Set<B> | undefined
		if (aRelations) {
			aRelations.delete(b)
			if (aRelations.size === 0) {
				this.relations.delete(a)
			}
			const bRelations = this.relations.get(b) as Set<A> | undefined
			if (bRelations) {
				bRelations.delete(a)
				if (bRelations.size === 0) {
					this.relations.delete(b)
				}
			}
		}
	}

	protected replaceRelationsUnsafely(a: A, bs: B[]): void
	protected replaceRelationsUnsafely(b: B, as: A[]): void
	protected replaceRelationsUnsafely(x: A | B, ys: A[] | B[]): void {
		this.relations.set(x as A, new Set(ys as B[]))
		for (const y of ys) {
			const yRelations = new Set<A>().add(x as A)
			this.relations.set(y, yRelations)
		}
	}
	protected replaceRelationsSafely(a: A, bs: B[]): void
	protected replaceRelationsSafely(b: B, as: A[]): void
	protected replaceRelationsSafely<
		XType extends A | B,
		YType extends XType extends A ? B : A,
	>(x: XType, ys: YType[]): void {
		const xRelationsPrev = this.relations.get(x)
		let a: A | undefined = this.isAType?.(x) ? x : undefined
		let b: B | undefined = a === undefined ? (x as B) : undefined
		if (xRelationsPrev) {
			for (const y of xRelationsPrev) {
				a ??= y as A
				b ??= y as B
				const yRelations = this.relations.get(y) as Set<XType> | undefined
				if (yRelations) {
					if (yRelations.size === 1) {
						this.relations.delete(y)
					} else {
						yRelations.delete(x)
					}
					this.contents.delete(this.makeContentKey(a, b))
				}
			}
		}
		this.relations.set(x, new Set(ys) as any)
		for (const y of ys) {
			let yRelations = this.relations.get(y) as Set<XType> | undefined
			if (yRelations) {
				yRelations.add(x)
			} else {
				yRelations = new Set<XType>().add(x)
				this.relations.set(y, yRelations as any)
			}
		}
	}

	protected getContentInternal(contentKey: string): Content | undefined {
		return this.contents.get(contentKey)
	}
	protected setContent(contentKey: string, content: Content): void {
		this.contents.set(contentKey, content)
	}
	protected deleteContent(contentKey: string): void {
		this.contents.delete(contentKey)
	}

	public constructor(
		data: JunctionSchema<AName, BName> &
			Partial<JunctionEntries<NoInfer<A>, NoInfer<B>, Content>>,
		config?: JunctionAdvancedConfiguration<AName, A, BName, B, Content>,
	) {
		this.a = data.between[0]
		this.b = data.between[1]

		this.cardinality = data.cardinality

		this.isAType = config?.isAType ?? null
		this.isBType = config?.isBType ?? null
		this.isContent = config?.isContent ?? null
		if (config?.makeContentKey) {
			this.makeContentKey = config.makeContentKey
		}
		if (!config?.externalStore) {
			const source = config?.source
			if (source === undefined) {
				this.relations = new Map(
					data.relations?.map(([x, ys]) => [x, new Set(ys as A[])]),
				)
				this.contents = new Map(data.contents)
			}
			if (source) {
				this.relations = new RelationsOverlay(source.relations)
				this.contents = new MapOverlay(source.contents)
			}
		}
		if (config?.externalStore) {
			const externalStore = config.externalStore
			this.has = (a, b) => externalStore.has(a, b)
			this.addRelation = (a, b) => {
				externalStore.addRelation(a, b)
			}
			this.deleteRelation = (a, b) => {
				externalStore.deleteRelation(a, b)
			}
			this.replaceRelationsSafely = (a, bs) => {
				externalStore.replaceRelationsSafely(a, bs)
			}
			this.replaceRelationsUnsafely = (a, bs) => {
				externalStore.replaceRelationsUnsafely(a, bs)
			}
			this.getRelatedKeys = ((key) =>
				externalStore.getRelatedKeys(
					key,
				)) as typeof Junction.prototype.getRelatedKeys
			if (externalStore.getContent) {
				this.getContentInternal = (contentKey) => {
					return externalStore.getContent(contentKey) as any
				}
				this.setContent = (contentKey, content) => {
					externalStore.setContent(contentKey, content as any)
				}
				this.deleteContent = (contentKey) => {
					externalStore.deleteContent(contentKey)
				}
			}
			for (const [x, ys] of data.relations ?? []) {
				let a = this.isAType?.(x) ? x : undefined
				let b = a === undefined ? (x as B) : undefined
				for (const y of ys) {
					a ??= y as A
					b ??= y as B
					this.addRelation(a, b)
				}
			}
			for (const [contentKey, content] of data.contents ?? []) {
				this.setContent(contentKey, content)
			}
		}
		if (config?.warn) {
			this.warn = config.warn
		}
	}
	public toJSON(): JunctionJSON<AName, A, BName, B, Content> {
		return {
			between: [this.a, this.b],
			cardinality: this.cardinality,
			relations: [...this.relations.entries()].map(
				([a, b]) => [a, [...b]] as [A, B[]],
			),
			contents: [...this.contents.entries()],
		}
	}

	public set(
		a: A,
		...rest: Content extends null ? [b: B] : [b: B, content: Content]
	): this
	public set(
		relation: { [Key in AName]: A } & { [Key in BName]: B },
		...rest: Content extends null ? [] | [void?: undefined] : [content: Content]
	): this
	public set(
		...params:
			| [
					relation: { [Key in AName]: A } & { [Key in BName]: B },
					...rest: Content extends null
						? [] | [void?: undefined]
						: [content: Content],
			  ]
			| [a: A, ...rest: Content extends null ? [b: B] : [b: B, content: Content]]
	): this {
		let a: A
		let b: B
		let content: Content | undefined
		switch (params.length) {
			case 1: {
				const relation = params[0] as Record<AName, A> & Record<BName, B>
				a = relation[this.a]
				b = relation[this.b]
				content = undefined
				break
			}
			case 2: {
				const zeroth = params[0]
				if (typeof zeroth === `string`) {
					;[a, b] = params as unknown as [A, B]
				} else {
					a = zeroth[this.a]
					b = zeroth[this.b]
					content = params[1] as Content
				}
				break
			}
			default: {
				a = params[0] as A
				b = params[1] as B
				content = params[2] as Content
				break
			}
		}
		switch (this.cardinality) {
			// biome-ignore lint/suspicious/noFallthroughSwitchClause: perfect here
			case `1:1`: {
				const bPrev = this.getRelatedKey(a)
				if (bPrev && bPrev !== b) this.delete(a, bPrev)
			}
			case `1:n`:
				{
					const aPrev = this.getRelatedKey(b)
					if (aPrev && aPrev !== a) this.delete(aPrev, b)
				}
				break
			case `n:n`: // do nothing
		}
		if (content) {
			const contentKey = this.makeContentKey(a, b)
			this.setContent(contentKey, content)
		}
		this.addRelation(a, b)
		return this
	}

	public delete(a: A, b?: B): this
	public delete(b: B, a?: A): this
	public delete(
		relation:
			| { [Key in AName]: A }
			| { [Key in BName]: B }
			| ({ [Key in AName]: A } & { [Key in BName]: B }),
		b?: undefined,
	): this
	public delete(
		x:
			| A
			| B
			| Record<AName | BName, string>
			| Record<AName, string>
			| Record<BName, string>,
		b?: A | B,
	): this {
		// @ts-expect-error we deduce that this.b may index x
		b = typeof b === `string` ? (b as B) : (x[this.b] as B | undefined)
		const a =
			// @ts-expect-error we deduce that this.a may index x
			typeof x === `string` ? (x as A) : (x[this.a] as A | undefined)

		if (a === undefined && typeof b === `string`) {
			const bRelations = this.getRelatedKeys(b) as Set<A>
			if (bRelations) {
				for (const bRelation of bRelations) {
					this.delete(bRelation, b)
				}
			}
		}
		if (typeof a === `string` && b === undefined) {
			const aRelations = this.getRelatedKeys(a)
			if (aRelations) {
				for (const aRelation of aRelations) {
					this.delete(a, aRelation)
				}
			}
		}
		if (typeof a === `string` && typeof b === `string`) {
			this.deleteRelation(a, b)
			const contentKey = this.makeContentKey(a, b)
			this.deleteContent(contentKey)
		}
		return this
	}

	public getRelatedKey(key: A): B | undefined
	public getRelatedKey(key: B): A | undefined
	public getRelatedKey(key: A | B): A | B | undefined {
		const relations = this.getRelatedKeys(key)
		if (relations) {
			if (relations.size > 1) {
				this.warn?.(
					`${relations.size} related keys were found for key "${key}": (${[
						...relations,
					]
						.map((k) => `"${k}"`)
						.join(`, `)}). Only one related key was expected.`,
				)
			}
			let singleRelation: A | B | undefined
			for (const relation of relations) {
				singleRelation = relation
				break
			}
			return singleRelation
		}
	}

	public replaceRelations(
		a: A,
		relations: Content extends null ? B[] : Record<B, Content>,
		config?: { reckless: boolean },
	): this
	public replaceRelations(
		b: B,
		relations: Content extends null ? A[] : Record<A, Content>,
		config?: { reckless: boolean },
	): this
	public replaceRelations<
		XType extends A | B,
		YType extends XType extends A ? B : A,
	>(
		x: XType,
		relations: Content extends null ? YType[] : Record<YType, Content>,
		config?: { reckless: boolean },
	): this {
		const hasContent = !Array.isArray(relations)
		const ys = (hasContent ? Object.keys(relations) : relations) as YType[]
		if (config?.reckless) {
			this.replaceRelationsUnsafely(x as any, ys as any)
		} else {
			this.replaceRelationsSafely(x as any, ys as any)
		}
		if (hasContent) {
			for (const y of ys) {
				const contentKey = this.makeContentKey(x as any, y as any) // sort XY to AB ❗
				const content = (relations as Record<YType, Content>)[y]
				this.setContent(contentKey, content)
			}
		}
		return this
	}

	public getContent(a: A, b: B): Content | undefined {
		const contentKey = this.makeContentKey(a, b)
		return this.getContentInternal(contentKey)
	}

	public getRelationEntries(input: Record<AName, A>): [B, Content][]
	public getRelationEntries(input: Record<BName, B>): [A, Content][]
	public getRelationEntries(
		input: Record<AName, A> | Record<BName, B>,
	): [A | B, Content][] {
		const a: A | undefined = (input as any)[this.a]
		const b: B | undefined = (input as any)[this.b]
		if (a !== undefined && b === undefined) {
			const aRelations = this.getRelatedKeys(a)
			if (aRelations) {
				return [...aRelations].map((aRelation) => {
					return [aRelation, this.getContent(a, aRelation) as Content]
				})
			}
		}
		if (a === undefined && b !== undefined) {
			const bRelations = this.getRelatedKeys(b)
			if (bRelations) {
				return [...bRelations].map((bRelation) => {
					return [bRelation, this.getContent(bRelation, b) as Content]
				})
			}
		}
		return []
	}

	public has(a: A, b?: B): boolean
	public has(b: B, a?: A): boolean
	public has(a: A | B, b?: A | B): boolean {
		if (b) {
			const setA = this.getRelatedKeys(a)
			return setA?.has(b as any) ?? false
		}
		return this.relations.has(a)
	}
	public overlay(): JunctionOverlay<AName, A, BName, B, Content> {
		const config: JunctionAdvancedConfiguration<AName, A, BName, B, Content> = {
			source: this,
			makeContentKey: this.makeContentKey,
		}
		if (this.isAType) config.isAType = this.isAType
		if (this.isBType) config.isBType = this.isBType
		if (this.isContent) config.isContent = this.isContent
		if (this.warn) config.warn = this.warn

		return new Junction(
			{
				between: [this.a, this.b],
				cardinality: this.cardinality,
			},
			config,
		) as JunctionOverlay<AName, A, BName, B, Content>
	}
	public incorporate(
		overlay: JunctionOverlay<AName, A, BName, B, Content>,
	): void {
		const { relations, contents } = overlay
		for (const [key, value] of relations) {
			if (value instanceof SetOverlay) {
				const { source } = value
				for (const keyAdded of value.iterateOwn()) {
					source.add(keyAdded)
				}
			} else {
				this.relations.set(key, value)
			}
		}
		for (const key of relations.deleted) {
			this.relations.delete(key)
		}
		for (const [key, value] of contents) {
			this.contents.set(key, value)
		}
		for (const key of contents.deleted) {
			this.contents.delete(key)
		}
	}
}

export type JunctionOverlay<
	AName extends string,
	A extends string,
	BName extends string,
	B extends string,
	Content extends Json.Object | null = null,
> = Junction<AName, A, BName, B, Content> & {
	relations: MapOverlay<A | B, Set<A> | Set<B>>
	contents: MapOverlay<string, Content>
}
