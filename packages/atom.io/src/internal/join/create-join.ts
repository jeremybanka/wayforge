import type { JoinOptions, JoinToken } from "atom.io"

import type { RootStore } from "../transaction"
import { Join } from "./join-internal"

export function createJoin<
	AName extends string,
	A extends string,
	BName extends string,
	B extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
>(
	store: RootStore,
	options: JoinOptions<AName, A, BName, B, Cardinality>,
): JoinToken<AName, A, BName, B, Cardinality> {
	store.joins.set(options.key, new Join(store, options))
	const token: JoinToken<AName, A, BName, B, Cardinality> = {
		key: options.key,
		type: `join`,
		a: options.between[0],
		b: options.between[1],
		cardinality: options.cardinality,
	}
	return token
}
