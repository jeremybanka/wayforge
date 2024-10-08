import type { Refinement } from "atom.io/introspection"
import type { Json } from "atom.io/json"

export interface JunctionEntries<Content extends Json.Object | null>
	extends Json.Object {
	readonly relations: [string, string[]][]
	readonly contents: [string, Content][]
}
export interface JunctionSchema<ASide extends string, BSide extends string>
	extends Json.Object {
	readonly between: [a: ASide, b: BSide]
	readonly cardinality: `1:1` | `1:n` | `n:n`
}

export type BaseExternalStoreConfiguration = {
	addRelation: (a: string, b: string) => void
	deleteRelation: (a: string, b: string) => void
	replaceRelationsSafely: (a: string, bs: string[]) => void
	replaceRelationsUnsafely: (a: string, bs: string[]) => void
	getRelatedKeys: (key: string) => Set<string> | undefined
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

export type JunctionAdvancedConfiguration<Content extends Json.Object | null> = {
	warn?: (...args: any[]) => void
	externalStore?: ExternalStoreConfiguration<Content>
	isContent?: Refinement<unknown, Content>
	makeContentKey?: (a: string, b: string) => string
}

export type JunctionJSON<
	ASide extends string,
	BSide extends string,
	Content extends Json.Object | null,
> = JunctionEntries<Content> & JunctionSchema<ASide, BSide>

export class Junction<
	const ASide extends string,
	const BSide extends string,
	const Content extends Json.Object | null = null,
> {
	public readonly a: ASide
	public readonly b: BSide
	public readonly cardinality: `1:1` | `1:n` | `n:n`
	public readonly relations = new Map<string, Set<string>>()
	public readonly contents = new Map<string, Content>()

	public isContent: Refinement<unknown, Content> | null
	public makeContentKey = (a: string, b: string): string => `${a}:${b}`

	public warn?: (...args: any[]) => void

	public getRelatedKeys(key: string): Set<string> | undefined {
		return this.relations.get(key)
	}
	protected addRelation(a: string, b: string): void {
		let aRelations = this.relations.get(a)
		let bRelations = this.relations.get(b)
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
	protected deleteRelation(a: string, b: string): void {
		const aRelations = this.relations.get(a)
		if (aRelations) {
			aRelations.delete(b)
			if (aRelations.size === 0) {
				this.relations.delete(a)
			}
			const bRelations = this.relations.get(b)
			if (bRelations) {
				bRelations.delete(a)
				if (bRelations.size === 0) {
					this.relations.delete(b)
				}
			}
		}
	}

	protected replaceRelationsUnsafely(a: string, bs: string[]): void {
		this.relations.set(a, new Set(bs))
		for (const b of bs) {
			const bRelations = new Set([a])
			this.relations.set(b, bRelations)
		}
	}
	protected replaceRelationsSafely(a: string, bs: string[]): void {
		const aRelationsPrev = this.relations.get(a)
		if (aRelationsPrev) {
			for (const b of aRelationsPrev) {
				const bRelations = this.relations.get(b)
				if (bRelations) {
					if (bRelations.size === 1) {
						this.relations.delete(b)
					} else {
						bRelations.delete(a)
					}
					this.contents.delete(this.makeContentKey(a, b))
				}
			}
		}
		this.relations.set(a, new Set(bs))
		for (const b of bs) {
			let bRelations = this.relations.get(b)
			if (bRelations) {
				bRelations.add(a)
			} else {
				bRelations = new Set([a])
				this.relations.set(b, bRelations)
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
		data: JunctionSchema<ASide, BSide> & Partial<JunctionEntries<Content>>,
		config?: JunctionAdvancedConfiguration<Content>,
	) {
		this.a = data.between[0]
		this.b = data.between[1]

		this.cardinality = data.cardinality
		if (!config?.externalStore) {
			this.relations = new Map(data.relations?.map(([a, b]) => [a, new Set(b)]))
			this.contents = new Map(data.contents)
		}
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
			this.getRelatedKeys = (key) => externalStore.getRelatedKeys(key)
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
				for (const y of ys) this.addRelation(x, y)
			}
			for (const [contentKey, content] of data.contents ?? []) {
				this.setContent(contentKey, content)
			}
		}
		if (config?.warn) {
			this.warn = config.warn
		}
	}
	public toJSON(): JunctionJSON<ASide, BSide, Content> {
		return {
			between: [this.a, this.b],
			cardinality: this.cardinality,
			relations: [...this.relations.entries()].map(([a, b]) => [a, [...b]]),
			contents: [...this.contents.entries()],
		}
	}

	public set(
		a: string,
		...rest: Content extends null ? [b: string] : [b: string, content: Content]
	): this
	public set(
		relation: { [Key in ASide | BSide]: string },
		...rest: Content extends null ? [] | [b?: undefined] : [content: Content]
	): this
	public set(
		a: string | { [Key in ASide | BSide]: string },
		...rest: Content extends null
			? [] | [b?: string | undefined]
			: [b: string, content: Content] | [content: Content]
	): this {
		const b: string =
			typeof rest[0] === `string`
				? rest[0]
				: (a[this.b as keyof typeof a] as string)
		const content: Content | undefined =
			(rest[1] ?? typeof rest[0] === `string`) ? undefined : (rest[0] as Content)
		a = typeof a === `string` ? a : a[this.a]
		switch (this.cardinality) {
			// biome-ignore lint/suspicious/noFallthroughSwitchClause: perfect here
			case `1:1`: {
				const bPrev = this.getRelatedKey(a)
				if (bPrev && bPrev !== b) this.delete(bPrev, a)
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

	public delete(a: string, b?: string): this
	public delete(
		relation:
			| Record<ASide | BSide, string>
			| Record<ASide, string>
			| Record<BSide, string>,
		b?: undefined,
	): this
	public delete(
		x:
			| Record<ASide | BSide, string>
			| Record<ASide, string>
			| Record<BSide, string>
			| string,
		b?: string,
	): this {
		// @ts-expect-error we deduce that this.b may index x
		b = typeof b === `string` ? b : (x[this.b] as string | undefined)
		// @ts-expect-error we deduce that this.a may index x
		const a = typeof x === `string` ? x : (x[this.a] as string | undefined)

		if (a === undefined && typeof b === `string`) {
			const bRelations = this.getRelatedKeys(b)
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

	public getRelatedKey(key: string): string | undefined {
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
			for (const relation of relations) {
				return relation
			}
		}
	}

	public replaceRelations(
		a: string,
		relations: Content extends null ? string[] : Record<string, Content>,
		config?: { reckless: boolean },
	): this {
		const hasContent = !Array.isArray(relations)
		const bs = hasContent ? Object.keys(relations) : relations
		if (config?.reckless) {
			this.replaceRelationsUnsafely(a, bs)
		} else {
			this.replaceRelationsSafely(a, bs)
		}
		if (hasContent) {
			for (const b of bs) {
				const contentKey = this.makeContentKey(a, b)
				const content = relations[b] as Content
				this.setContent(contentKey, content)
			}
		}
		return this
	}

	public getContent(a: string, b: string): Content | undefined {
		const contentKey = this.makeContentKey(a, b)
		return this.getContentInternal(contentKey)
	}

	public getRelationEntries(
		input: Record<ASide, string> | Record<BSide, string>,
	): [string, Content][] {
		const a: string | undefined = (input as any)[this.a]
		const b: string | undefined = (input as any)[this.b]
		if (a !== undefined && b === undefined) {
			const aRelations = this.getRelatedKeys(a)
			if (aRelations) {
				return [...aRelations].map((aRelation) => {
					return [aRelation, this.getContent(a, aRelation) ?? (null as Content)]
				})
			}
		}
		if (a === undefined && b !== undefined) {
			const bRelations = this.getRelatedKeys(b)
			if (bRelations) {
				return [...bRelations].map((bRelation) => {
					return [bRelation, this.getContent(bRelation, b) ?? (null as Content)]
				})
			}
		}
		return []
	}

	public has(a: string, b?: string): boolean {
		if (b) {
			const setA = this.getRelatedKeys(a)
			return setA?.has(b) ?? false
		}
		return this.relations.has(a)
	}
}
