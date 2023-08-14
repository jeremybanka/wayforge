import type { JsonObj } from "~/packages/anvl/src/json"

export type Cardinality = `1:1` | `1:n` | `n:n`

export interface JunctionJSON<
	ASide extends string,
	BSide extends string,
	Content extends JsonObj | null,
> extends JsonObj {
	readonly between: [a: ASide, b: BSide]
	readonly cardinality: Cardinality
	readonly relations?: [string, string[]][]
	readonly contents?: [string, Content][]
}

export class Junction<
	ASide extends string,
	BSide extends string,
	Content extends JsonObj,
> {
	public readonly a: ASide
	public readonly b: BSide
	public readonly cardinality: Cardinality
	public readonly relations = new Map<string, Set<string>>()
	public readonly contents = new Map<string, Content>()

	public constructor(data: JunctionJSON<ASide, BSide, Content>) {
		if (data) {
			this.a = data.between[0]
			this.b = data.between[1]
			this.cardinality = data.cardinality
			this.relations = new Map(data.relations?.map(([a, b]) => [a, new Set(b)]))
		}
	}
	public toJSON(): JunctionJSON<ASide, BSide, Content> {
		return {
			between: [this.a, this.b],
			cardinality: this.cardinality,
			relations: [...this.relations.entries()].map(([a, b]) => [a, [...b]]),
		}
	}

	public set(a: string, b: string): this
	public set(relation: { [Key in ASide | BSide]: string }, b?: undefined): this
	public set(a: string | { [Key in ASide | BSide]: string }, b?: string): this {
		// @ts-expect-error we can deduce here that this.b may index a
		b = b ?? (a[this.b] as string)
		a = typeof a === `string` ? a : a[this.a]
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
	public delete(a: string, b: string): this {
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

	public has(a: string, b?: string): boolean {
		if (b) {
			const setA = this.relations.get(a)
			return setA?.has(b) ?? false
		}
		return this.relations.has(a)
	}
}
