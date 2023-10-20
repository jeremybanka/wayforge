import type { Cardinality, Json, Refinement } from "rel8"

export interface JunctionEntries<Content extends Json.Object | null,>
	extends Json.Object {
	readonly relations: [string, string[]][]
	readonly contents: [string, Content][]
}
export interface JunctionSchema<ASide extends string, BSide extends string>
	extends Json.Object {
	readonly between: [a: ASide, b: BSide]
	readonly cardinality: Cardinality
}

export type JunctionAdvancedConfiguration<Content extends Json.Object | null> = {
	externalStore?: (Content extends null
		? {
				getContent?: undefined
				setContent?: undefined
				deleteContent?: undefined
		  }
		: {
				getContent: (contentKey: string) => Content | undefined
				setContent: (contentKey: string, content: Content) => void
				deleteContent: (contentKey: string) => void
		  }) & {
		addRelation: (a: string, b: string) => void
		deleteRelation: (a: string, b: string) => void
		getRelatedKeys: (key: string) => Set<string> | undefined
		has: (a: string, b?: string) => boolean
	}
	isContent?: Refinement<unknown, Content>
	makeContentKey?: (a: string, b: string) => string
}

export type JunctionJSON<
	ASide extends string,
	BSide extends string,
	Content extends Json.Object | null,
> = JunctionEntries<Content> & JunctionSchema<ASide, BSide>

export class Junction<
	ASide extends string,
	BSide extends string,
	Content extends Json.Object | null = null,
> {
	public readonly a: ASide
	public readonly b: BSide
	public readonly cardinality: Cardinality
	public readonly relations = new Map<string, Set<string>>()
	public readonly contents = new Map<string, Content>()

	public isContent: Refinement<unknown, Content> | null
	public makeContentKey = (a: string, b: string): string => `${a}:${b}`

	public getRelatedKeys(key: string): Set<string> | undefined {
		return this.relations.get(key)
	}
	protected addRelation(a: string, b: string): void {
		const aRelations = this.relations.get(a)
		const bRelations = this.relations.get(b)
		if (aRelations) {
			aRelations.add(b)
		} else {
			this.relations.set(a, new Set([b]))
		}
		if (bRelations) {
			bRelations.add(a)
		} else {
			this.relations.set(b, new Set([a]))
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
		this.relations = new Map(data.relations?.map(([a, b]) => [a, new Set(b)]))
		this.contents = new Map(data.contents)
		this.isContent = config?.isContent ?? null
		if (config?.makeContentKey) {
			this.makeContentKey = config.makeContentKey
		}
		if (config?.externalStore) {
			const externalStore = config.externalStore
			this.has = (a, b) => externalStore.has(a, b)
			this.addRelation = (a, b) => {
				externalStore.addRelation(a, b)
				return this
			}
			this.deleteRelation = (a, b) => {
				externalStore.deleteRelation(a, b)
				return this
			}
			this.getRelatedKeys = (key) => externalStore.getRelatedKeys(key)
			if (externalStore.getContent) {
				this.getContentInternal = (contentKey) => {
					return externalStore.getContent(contentKey) as any
				}
				this.setContent = (contentKey, content) => {
					externalStore.setContent(contentKey, content as any)
					return this
				}
				this.deleteContent = (contentKey) => {
					externalStore.deleteContent(contentKey)
					return this
				}
			}
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
			// @ts-expect-error we deduce hereby that this.b may index a
			typeof rest[0] === `string` ? rest[0] : (a[this.b] as string)
		const content: Content | undefined =
			rest[1] ?? typeof rest[0] === `string` ? undefined : (rest[0] as Content)
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
		this.addRelation(a, b)
		if (content) {
			const contentKey = this.makeContentKey(a, b)
			this.setContent(contentKey, content)
		}
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
		b?: string | undefined,
	): this {
		// @ts-expect-error we deduce that this.b may index x
		b = typeof b === `string` ? b : (x[this.b] as string | undefined)
		// @ts-expect-error we deduce that this.a may index x
		const a = typeof x === `string` ? x : (x[this.a] as string | undefined)

		if (a === undefined && typeof b === `string`) {
			const bRelations = this.getRelatedKeys(b)
			if (bRelations) {
				for (const a of bRelations) {
					this.delete(a, b)
				}
			}
		}
		if (typeof a === `string` && b === undefined) {
			const aRelations = this.getRelatedKeys(a)
			if (aRelations) {
				for (const b of aRelations) {
					this.delete(a, b)
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
				console.warn(
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
				return [...aRelations].map((b) => {
					return [b, this.getContent(a, b) ?? (null as Content)]
				})
			}
		}
		if (a === undefined && b !== undefined) {
			const bRelations = this.getRelatedKeys(b)
			if (bRelations) {
				return [...bRelations].map((a) => {
					return [a, this.getContent(a, b) ?? (null as Content)]
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
