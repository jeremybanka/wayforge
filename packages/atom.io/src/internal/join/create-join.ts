import type { JoinOptions, JoinToken } from "atom.io"

import type { RootStore } from "../transaction"
import { Join } from "./join-internal"

export function createJoin<
	ASide extends string,
	AType extends string,
	BSide extends string,
	BType extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
>(
	store: RootStore,
	options: JoinOptions<ASide, AType, BSide, BType, Cardinality>,
): JoinToken<ASide, AType, BSide, BType, Cardinality> {
	store.joins.set(options.key, new Join(options))
	const token: JoinToken<ASide, AType, BSide, BType, Cardinality> = {
		key: options.key,
		type: `join`,
		a: options.between[0],
		b: options.between[1],
		cardinality: options.cardinality,
	}
	return token
}
