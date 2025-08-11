import type { JoinOptions, JoinToken } from "atom.io"
import type { Json } from "atom.io/json"

import type { Store } from "../store"
import { Join } from "./join-internal"

export function createJoin<
	ASide extends string,
	AType extends string,
	BSide extends string,
	BType extends string,
	Cardinality extends `1:1` | `1:n` | `n:n`,
	Content extends Json.Object,
>(
	store: Store,
	options: JoinOptions<ASide, AType, BSide, BType, Cardinality, Content>,
	defaultContent: Content | undefined,
): JoinToken<ASide, AType, BSide, BType, Cardinality, Content> {
	store.joins.set(options.key, new Join(options, defaultContent, store))
	const token: JoinToken<ASide, AType, BSide, BType, Cardinality, Content> = {
		key: options.key,
		type: `join`,
		a: options.between[0],
		b: options.between[1],
		cardinality: options.cardinality,
	}
	return token
}
