import type { Cardinality, Json, Refinement } from "rel8"

export interface JunctionData<Content extends Json.Object | null,>
	extends Json.Object {
	readonly relations: [string, string[]][]
	readonly contents: [string, Content][]
}
export interface JunctionConfigRequired<
	ASide extends string,
	BSide extends string,
> extends Json.Object {
	readonly between: [a: ASide, b: BSide]
	readonly cardinality: Cardinality
}

export type JunctionConfig<
	ASide extends string,
	BSide extends string,
	Content extends Json.Object | null,
> = JunctionConfigRequired<ASide, BSide> & Partial<JunctionData<Content>>

export type JunctionJSON<
	ASide extends string,
	BSide extends string,
	Content extends Json.Object | null,
> = JunctionConfigRequired<ASide, BSide> & JunctionData<Content>

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

	public makeContentId = (...params: string[]): string => params.sort().join(`:`)
	public isContent: Refinement<unknown, Content> | null

	public constructor(
		input: JunctionConfig<ASide, BSide, Content>,
		isContent?: Refinement<unknown, Content>,
	) {
		this.a = input.between[0]
		this.b = input.between[1]
		this.cardinality = input.cardinality
		this.relations = new Map(input.relations?.map(([a, b]) => [a, new Set(b)]))
		this.contents = new Map(input.contents)
		this.isContent = isContent ?? null
	}
	public toJSON(): JunctionJSON<ASide, BSide, Content> {
		return {
			between: [this.a, this.b],
			cardinality: this.cardinality,
			relations: [...this.relations.entries()].map(([a, b]) => [a, [...b]]),
			contents: [...this.contents.entries()],
		}
	}

	public add(a: string, b: string): this {
		const aRelations = this.relations.get(a)
		const bRelations = this.relations.get(b)
		if (aRelations?.has(b)) {
			return this
		}
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

		return this
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
			case `1:1`: {
				const bPrev = this.getRelatedKey(a)
				if (bPrev && bPrev !== b) this.delete(bPrev, a)
			}
			case `1:n`: {
				const aPrev = this.getRelatedKey(b)
				if (aPrev && aPrev !== a) this.delete(aPrev, b)
			}
		}
		this.add(a, b)
		if (content) this.setContent(a, b, content)
		return this
	}
	public setContent(keyA: string, keyB: string, content: Content): this {
		const contentId = this.makeContentId(keyA, keyB)
		this.contents.set(contentId, content)
		return this
	}

	public delete(a?: string, b?: string): this
	public delete(
		relation:
			| Record<ASide | BSide, string>
			| Record<ASide, string>
			| Record<BSide, string>,
		b?: undefined,
	): this
	public delete(
		a?:
			| Record<ASide | BSide, string>
			| Record<ASide, string>
			| Record<BSide, string>
			| string,
		b?: string,
	): this {
		// @ts-expect-error we deduce that this.b may index a
		b = typeof b === `string` ? b : (a[this.b] as string | undefined)
		// @ts-expect-error we deduce that this.a may index a
		const a0 = typeof a === `string` ? a : (a[this.a] as string | undefined)
		if (!a0 && b) {
			const aRelations = this.relations.get(b)
			if (aRelations) {
				aRelations.forEach((a) => this.delete(a, b))
			}
		}
		if (typeof a0 === `string` && !b) {
			const bRelations = this.relations.get(a0)
			if (bRelations) {
				bRelations.forEach((b) => {
					this.delete(a0, b)
				})
			}
		}
		if (typeof a0 === `string` && b) {
			const aRelations = this.relations.get(a0)
			if (aRelations) {
				aRelations.delete(b)
				if (aRelations.size === 0) {
					this.relations.delete(a0)
				}
				const bRelations = this.relations.get(b)
				if (bRelations) {
					bRelations.delete(a0)
					if (bRelations.size === 0) {
						this.relations.delete(b)
					}
				}
			}
			this.deleteContent(a0, b)
		}
		return this
	}
	public deleteContent(keyA: string, keyB: string): this {
		const contentId = this.makeContentId(keyA, keyB)
		this.contents.delete(contentId)
		return this
	}

	public getRelatedKeys(key: string): Set<string> | undefined {
		return this.relations.get(key)
	}
	public getRelatedKey(key: string): string | undefined {
		const relations = this.relations.get(key)
		if (relations) {
			if (relations.size > 1) {
				console.warn(
					`Multiple related keys were found for key "${key}": (${[...relations]
						.map((k) => `"${k}"`)
						.join(`, `)}). Only one related key was expected.`,
				)
			}
			return [...relations][0]
		}
	}
	public getContent(keyA: string, keyB: string): Content | undefined {
		const contentId = this.makeContentId(keyA, keyB)
		return this.contents.get(contentId)
	}

	public getRelationEntries(key: string): [string, Content][] {
		const relations = this.relations.get(key)
		if (!relations) return []
		return [...relations].map((b) => [
			b,
			this.getContent(key, b) ?? (null as Content),
		])
	}

	public has(a: string, b?: string): boolean {
		if (b) {
			const setA = this.relations.get(a)
			return setA?.has(b) ?? false
		}
		return this.relations.has(a)
	}
}
