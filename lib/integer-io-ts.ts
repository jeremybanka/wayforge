import type { HKT, Kind, Kind2, URIS, URIS2 } from "fp-ts/HKT"
import { pipe } from "fp-ts/function"
import * as D from "io-ts/Decoder"
import * as S from "io-ts/Schemable"

export interface IntBrand {
	readonly Int: unique symbol
}

export type Int = IntBrand & number

// base type class definition
export interface MySchemable<S> extends S.Schemable<S> {
	readonly Int: HKT<S, Int>
}

// type class definition for * -> * constructors (e.g. `Eq`, `Guard`)
export interface MySchemable1<S extends URIS> extends S.Schemable1<S> {
	readonly Int: Kind<S, Int>
}

// type class definition for * -> * -> * constructors (e.g. `Decoder`, `Encoder`)
export interface MySchemable2C<S extends URIS2>
	extends S.Schemable2C<S, unknown> {
	readonly Int: Kind2<S, unknown, Int>
}

export interface MySchema<A> {
	<S>(S: MySchemable<S>): HKT<S, A>
}

export function make<A>(f: MySchema<A>): MySchema<A> {
	return S.memoize(f)
}

export const mySchemable: MySchemable2C<D.URI> = {
	...D.Schemable,
	Int: pipe(
		D.number,
		D.refine((n): n is Int => Number.isInteger(n), `Int`),
	),
}

// const interpreter: {
//   <S extends URIS2>(S: MySchemable2C<S>): <A>(
//     schema: MySchema<A>
//   ) => Kind2<S, unknown, A>
//   <S extends URIS>(S: MySchemable1<S>): <A>(schema: MySchema<A>) => Kind<S, A>
// } = unsafeCoerce(SC.interpreter)
