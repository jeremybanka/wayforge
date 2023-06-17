import type { JsonInterface, JsonObj } from "~/packages/anvl/src/json"

import { Join } from "."
import type { IsRelationDataOptions, RelationData } from "./core-relation-data"

export const makeJsonInterface = <
  CONTENT extends JsonObj | null = null,
  A extends string = `from`,
  B extends string = `to`
>(
  options?: IsRelationDataOptions<CONTENT, A, B>
): JsonInterface<Join<CONTENT, A, B>, RelationData<CONTENT, A, B>> => ({
  toJson: (join) => join.toJSON(),
  fromJson: (json) => Join.fromJSON(json, options),
})
