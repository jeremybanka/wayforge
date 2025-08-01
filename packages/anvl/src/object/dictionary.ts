import type { Json } from "atom.io/json"

/* eslint-disable @typescript-eslint/no-dynamic-delete */
import { map } from "../array"
import { pipe } from "../function"
import { entriesToRecord, recordToEntries } from "./entries"

export const reverseRecord = <A extends PropertyKey, B extends PropertyKey>(
	record: Record<A, B>,
): Record<B, A> =>
	pipe(
		record,
		recordToEntries,
		map(([key, val]) => [val, key] as const),
		entriesToRecord,
	)

export interface DictionaryOptions<
	A extends string,
	B extends string,
	NameOfA extends string,
	NameOfB extends string,
> extends Json.Object {
	base: Record<A, B>
	from: NameOfA
	into: NameOfB
}

export class Dictionary<
	A extends string,
	B extends string,
	NameOfA extends string = `A`,
	NameOfB extends string = `B`,
> {
	public readonly nameOfA: NameOfA
	public readonly nameOfB: NameOfB
	public aSide: Record<A, B> = {} as Record<A, B>
	public bSide: Record<B, A> = {} as Record<B, A>

	public constructor({
		base = {} as Record<A, B>,
		from = `A` as NameOfA,
		into = `B` as NameOfB,
	}: Partial<DictionaryOptions<A, B, NameOfA, NameOfB>> = {}) {
		this.aSide = base
		this.bSide = reverseRecord(base)
		this.nameOfA = from
		this.nameOfB = into
	}

	protected get<S extends A | B>(s: S): (S extends A ? B : A) | undefined {
		return (
			s in this.aSide ? this.aSide[s as A] : this.bSide[s as B]
		) as S extends A ? B : A
	}

	public getPairOf<Name extends NameOfA | NameOfB>(
		item: {
			[K in Name]: Name extends NameOfA ? A : B
		},
	): Name extends NameOfA
		? { [BK in NameOfB]: B | undefined }
		: { [AK in NameOfA]: A | undefined } {
		const [name, value] = recordToEntries(item as { [K in Name]: A | B })[0]
		const otherName = name === this.nameOfA ? this.nameOfB : this.nameOfA
		const otherValue =
			name === this.nameOfA ? this.aSide[value as A] : this.bSide[value as B]
		return {
			[name]: value,
			[otherName]: otherValue,
		} as Name extends NameOfA ? { [BK in NameOfB]: B } : { [AK in NameOfA]: A }
	}

	public add(
		pair: {
			[N in NameOfA | NameOfB]: N extends NameOfA ? A : B
		},
	): this {
		const a = pair[this.nameOfA] as A
		const b = pair[this.nameOfB] as B
		if (a in this.aSide) delete this.aSide[a]
		if (b in this.bSide) delete this.bSide[b]
		this.aSide[a] = b
		this.bSide[b] = a
		return this
	}

	public remove<Name extends NameOfA | NameOfB>(
		item: {
			[K in Name]: Name extends NameOfA ? A : B
		},
	): this {
		const [name, value] = recordToEntries(item as { [K in Name]: A | B })[0]
		if (name === this.nameOfA) {
			const b = this.aSide[value as A]
			delete this.aSide[value as A]
			delete this.bSide[b]
		} else {
			const a = this.bSide[value as B]
			delete this.bSide[value as B]
			delete this.aSide[a]
		}
		return this
	}

	public toJSON(): DictionaryOptions<A, B, NameOfA, NameOfB> {
		return {
			base: this.aSide,
			from: this.nameOfA,
			into: this.nameOfB,
		}
	}
}

const myPairings = new Dictionary({
	from: `firstName`,
	into: `age`,
})
myPairings.add({ firstName: `Sam`, age: `21` })
const { age } = myPairings.getPairOf({ firstName: `f` })
