import type { Refinement } from "atom.io/introspection"
import type { Json } from "atom.io/json"

export type JunctionEntriesBase<
	AType extends string,
	BType extends string,
	Content extends Json.Object | null,
> = {
	readonly relations: ([AType, BType[]] | [BType, AType[]])[]
	readonly contents: [string, Content][]
}
export interface JunctionEntries<
	AType extends string,
	BType extends string,
	Content extends Json.Object | null,
> extends Json.Object,
		JunctionEntriesBase<AType, BType, Content> {}

export type JunctionSchemaBase<ASide extends string, BSide extends string> = {
	readonly between: [a: ASide, b: BSide]
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
	AType extends string,
	BType extends string,
	Content extends Json.Object | null,
> = {
	warn?: (...args: any[]) => void
	externalStore?: ExternalStoreConfiguration<Content>
	isAType?: Refinement<string, AType>
	isBType?: Refinement<string, BType>
	isContent?: Refinement<unknown, Content>
	makeContentKey?: (a: AType, b: BType) => string
}

export type JunctionJSON<
	ASide extends string,
	AType extends string,
	BSide extends string,
	BType extends string,
	Content extends Json.Object | null,
> = JunctionEntries<AType, BType, Content> & JunctionSchema<ASide, BSide>

export class Junction<
	const ASide extends string,
	const AType extends string,
	const BSide extends string,
	const BType extends string,
	const Content extends Json.Object | null = null,
> {
	public readonly a: ASide
	public readonly b: BSide
	public readonly cardinality: `1:1` | `1:n` | `n:n`
	public readonly relations = new Map<AType | BType, Set<AType> | Set<BType>>()
	public readonly contents = new Map<string, Content>()

	public isAType?: Refinement<string, AType> | null
	public isBType?: Refinement<string, BType> | null
	public isContent: Refinement<unknown, Content> | null
	public makeContentKey = (a: AType, b: BType): string => `${a}:${b}`

	public warn?: (...args: any[]) => void

	public getRelatedKeys(key: AType): Set<BType> | undefined
	public getRelatedKeys(key: BType): Set<AType> | undefined
	public getRelatedKeys(key: AType | BType): Set<AType> | Set<BType> | undefined
	public getRelatedKeys(
		key: AType | BType,
	): Set<AType> | Set<BType> | undefined {
		return this.relations.get(key)
	}
	protected addRelation(a: AType, b: BType): void {
		let aRelations = this.relations.get(a) as Set<BType> | undefined
		let bRelations = this.relations.get(b) as Set<AType> | undefined
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
	protected deleteRelation(a: AType, b: BType): void {
		const aRelations = this.relations.get(a) as Set<BType> | undefined
		if (aRelations) {
			aRelations.delete(b)
			if (aRelations.size === 0) {
				this.relations.delete(a)
			}
			const bRelations = this.relations.get(b) as Set<AType> | undefined
			if (bRelations) {
				bRelations.delete(a)
				if (bRelations.size === 0) {
					this.relations.delete(b)
				}
			}
		}
	}

	protected replaceRelationsUnsafely(a: AType, bs: BType[]): void
	protected replaceRelationsUnsafely(b: BType, as: AType[]): void
	protected replaceRelationsUnsafely(
		x: AType | BType,
		ys: AType[] | BType[],
	): void {
		this.relations.set(x as AType, new Set(ys as BType[]))
		for (const y of ys) {
			const yRelations = new Set<AType>().add(x as AType)
			this.relations.set(y, yRelations)
		}
	}
	protected replaceRelationsSafely(a: AType, bs: BType[]): void
	protected replaceRelationsSafely(b: BType, as: AType[]): void
	protected replaceRelationsSafely<
		XType extends AType | BType,
		YType extends XType extends AType ? BType : AType,
	>(x: XType, ys: YType[]): void {
		const xRelationsPrev = this.relations.get(x)
		let a: AType | undefined = this.isAType?.(x) ? x : undefined
		let b: BType | undefined = a === undefined ? (x as BType) : undefined
		if (xRelationsPrev) {
			for (const y of xRelationsPrev) {
				a ??= y as AType
				b ??= y as BType
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
		data: JunctionSchema<ASide, BSide> &
			Partial<JunctionEntries<NoInfer<AType>, NoInfer<BType>, Content>>,
		config?: JunctionAdvancedConfiguration<AType, BType, Content>,
	) {
		this.a = data.between[0]
		this.b = data.between[1]

		this.cardinality = data.cardinality
		if (!config?.externalStore) {
			this.relations = new Map(
				data.relations?.map(([x, ys]) => [x, new Set(ys as AType[])]),
			)
			this.contents = new Map(data.contents)
		}
		this.isAType = config?.isAType ?? null
		this.isBType = config?.isBType ?? null
		this.isContent = config?.isContent ?? null
		if (config?.makeContentKey) {
			this.makeContentKey = config.makeContentKey
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
				let b = a === undefined ? (x as BType) : undefined
				for (const y of ys) {
					a ??= y as AType
					b ??= y as BType
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
	public toJSON(): JunctionJSON<ASide, AType, BSide, BType, Content> {
		return {
			between: [this.a, this.b],
			cardinality: this.cardinality,
			relations: [...this.relations.entries()].map(
				([a, b]) => [a, [...b]] as [AType, BType[]],
			),
			contents: [...this.contents.entries()],
		}
	}

	public set(
		a: AType,
		...rest: Content extends null ? [b: BType] : [b: BType, content: Content]
	): this
	public set(
		relation: { [Key in ASide]: AType } & { [Key in BSide]: BType },
		...rest: Content extends null ? [] | [void?: undefined] : [content: Content]
	): this
	public set(
		a: AType | ({ [Key in ASide]: AType } & { [Key in BSide]: BType }),
		...rest: Content extends null
			? [] | [b?: BType | undefined]
			: [b: BType, content: Content] | [content: Content]
	): this {
		const b: BType =
			typeof rest[0] === `string`
				? rest[0]
				: (a[this.b as keyof typeof a] as BType)
		const content: Content | undefined =
			(rest[1] ?? typeof rest[0] === `string`) ? undefined : (rest[0] as Content)
		a = typeof a === `string` ? a : a[this.a]
		switch (this.cardinality) {
			// biome-ignore lint/suspicious/noFallthroughSwitchClause: perfect here
			case `1:1`: {
				const bPrev = this.getRelatedKey(a)
				if (bPrev && bPrev !== b) this.delete(a, bPrev)
			}
			case `1:n`: {
				const aPrev = this.getRelatedKey(b)
				if (aPrev && aPrev !== a) this.delete(aPrev, b)
			}
		}
		if (content) {
			const contentKey = this.makeContentKey(a, b)
			this.setContent(contentKey, content)
		}
		this.addRelation(a, b)
		return this
	}

	public delete(a: AType, b?: BType): this
	public delete(b: BType, a?: AType): this
	public delete(
		relation:
			| { [Key in ASide]: AType }
			| { [Key in BSide]: BType }
			| ({ [Key in ASide]: AType } & { [Key in BSide]: BType }),
		b?: undefined,
	): this
	public delete(
		x:
			| AType
			| BType
			| Record<ASide | BSide, string>
			| Record<ASide, string>
			| Record<BSide, string>,
		b?: AType | BType,
	): this {
		// @ts-expect-error we deduce that this.b may index x
		b = typeof b === `string` ? (b as BType) : (x[this.b] as BType | undefined)
		const a =
			// @ts-expect-error we deduce that this.a may index x
			typeof x === `string` ? (x as AType) : (x[this.a] as AType | undefined)

		if (a === undefined && typeof b === `string`) {
			const bRelations = this.getRelatedKeys(b) as Set<AType>
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

	public getRelatedKey(key: AType): BType | undefined
	public getRelatedKey(key: BType): AType | undefined
	public getRelatedKey(key: AType | BType): AType | BType | undefined {
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
			let singleRelation: AType | BType | undefined
			for (const relation of relations) {
				singleRelation = relation
				break
			}
			return singleRelation
		}
	}

	public replaceRelations(
		a: AType,
		relations: Content extends null ? BType[] : Record<BType, Content>,
		config?: { reckless: boolean },
	): this
	public replaceRelations(
		b: BType,
		relations: Content extends null ? AType[] : Record<AType, Content>,
		config?: { reckless: boolean },
	): this
	public replaceRelations<
		XType extends AType | BType,
		YType extends XType extends AType ? BType : AType,
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

	public getContent(a: AType, b: BType): Content | undefined {
		const contentKey = this.makeContentKey(a, b)
		return this.getContentInternal(contentKey)
	}

	public getRelationEntries(input: Record<ASide, AType>): [BType, Content][]
	public getRelationEntries(input: Record<BSide, BType>): [AType, Content][]
	public getRelationEntries(
		input: Record<ASide, AType> | Record<BSide, BType>,
	): [AType | BType, Content][] {
		const a: AType | undefined = (input as any)[this.a]
		const b: BType | undefined = (input as any)[this.b]
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

	public has(a: AType, b?: BType): boolean
	public has(b: BType, a?: AType): boolean
	public has(a: AType | BType, b?: AType | BType): boolean {
		if (b) {
			const setA = this.getRelatedKeys(a)
			return setA?.has(b as any) ?? false
		}
		return this.relations.has(a)
	}
}
