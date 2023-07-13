import type { Json, JsonInterface, JsonObj } from "~/packages/anvl/src/json"

import { Join } from "."
import type { IsRelationDataOptions, RelationData } from "./core-relation-data"

export const makeJsonInterface = <
	CONTENT extends JsonObj | null = null,
	A extends string = `from`,
	B extends string = `to`,
>(
	join: Join<CONTENT, A, B>,
	...params: CONTENT extends null ? [] : [(x: Json) => x is CONTENT]
): JsonInterface<Join<CONTENT, A, B>, RelationData<CONTENT, A, B>> => {
	const isContent = params[0] as (x: Json) => x is CONTENT
	const { a, b } = join
	const options: IsRelationDataOptions<CONTENT, A, B> = {
		from: a,
		to: b,
		isContent,
	}
	return {
		toJson: (join) => join.toJSON(),
		fromJson: (json) => Join.fromJSON(json, options),
	}
}
