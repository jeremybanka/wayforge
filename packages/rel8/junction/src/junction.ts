import type { JsonObj } from "~/packages/anvl/src/json"

export type Cardinality = `1:1` | `1:n` | `n:n`

export interface JunctionJSON<ASide extends string, BSide extends string>
	extends JsonObj {
	readonly between: [a: ASide, b: BSide]
	readonly cardinality: Cardinality
	readonly relations?: [string, string[]][]
}

export class Junction<ASide extends string, BSide extends string> {
	public readonly a: ASide
	public readonly b: BSide
	public readonly cardinality: Cardinality

	protected readonly relations = new Map<string, Set<string>>()

	public constructor(data?: JunctionJSON<ASide, BSide>) {
		if (data) {
			this.a = data.between[0]
			this.b = data.between[1]
			this.cardinality = data.cardinality
			this.relations = new Map(data.relations?.map(([a, b]) => [a, new Set(b)]))
		}
	}
	public toJSON(): JunctionJSON<ASide, BSide> {
		return {
			between: [this.a, this.b],
			cardinality: this.cardinality,
			relations: [...this.relations.entries()].map(([a, b]) => [a, [...b]]),
		}
	}

	public set(a: string, b: string): this
	public set(relation: { [Key in ASide | BSide]: string }, b?: undefined): this
	public set(a: string | { [Key in ASide | BSide]: string }, b?: string): this {
		let a0: string
		let b0: string
		if (typeof a === `string`) {
			a0 = a
			// rome-ignore lint/style/noNonNullAssertion: this case is handled by the overload
			b0 = b!
		} else {
			a0 = a[this.a]
			b0 = a[this.b]
		}
		const aRelations = this.relations.get(a0)
		const bRelations = this.relations.get(b0)
		if (aRelations?.has(b0)) {
			return this
		}
		if (aRelations) {
			aRelations.add(b0)
		} else {
			this.relations.set(a0, new Set([b0]))
		}
		if (bRelations) {
			bRelations.add(a0)
		} else {
			this.relations.set(b0, new Set([a0]))
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
