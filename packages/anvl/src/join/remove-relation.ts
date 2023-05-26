import { pipe } from "fp-ts/function"
import { isString } from "fp-ts/string"

import type { RelationData } from "./core-relation-data"
import { isEmptyArray, isOneOf, map } from "../array"
import { comprises } from "../array/venn"
import type { JsonObj } from "../json"
import type { RequireAtLeastOne } from "../object"
import { treeShake as removeProperties } from "../object"
import { entriesToRecord, recordToEntries } from "../object/entries"
import { split } from "../string/split"

export const removeSpecific = <
  CONTENT extends JsonObj | null,
  A extends string,
  B extends string
>(
  current: RelationData<CONTENT, A, B>,
  idA: string,
  idB: string
): RelationData<CONTENT, A, B> => {
  const isIdForRemoval = isOneOf(idA, idB)
  return {
    ...current,
    relations: pipe(
      current.relations,
      recordToEntries,
      map(([id, relations]): [id: string, fewerRelations: string[]] => [
        id,
        isIdForRemoval(id)
          ? relations.filter((relation) => !isIdForRemoval(relation))
          : relations,
      ]),
      entriesToRecord,
      removeProperties(isEmptyArray)
    ),
    contents: pipe(
      current.contents,
      removeProperties(
        (_, key) => isString(key) && pipe(key, split(`/`), comprises([idA, idB]))
      )
    ),
  }
}

export const removeAll = <
  CONTENT extends JsonObj | null,
  A extends string,
  B extends string
>(
  current: RelationData<CONTENT, A, B>,
  idToRemove: string
): RelationData<CONTENT, A, B> => {
  const next: RelationData<CONTENT, A, B> = {
    ...current,
    relations: pipe(
      current.relations,
      recordToEntries,
      map(([id, relations]): [id: string, fewerRelations: string[]] => [
        id,
        relations.filter((relation) => relation !== idToRemove),
      ]),
      entriesToRecord,
      removeProperties((val, key) => key === idToRemove || isEmptyArray(val))
    ),
    contents: pipe(
      current.contents,
      removeProperties(
        (_, key) => isString(key) && key.split(`/`).includes(idToRemove)
      )
    ),
  }
  return next
}

export const removeRelation = <
  CONTENT extends JsonObj | null,
  A extends string,
  B extends string
>(
  current: RelationData<CONTENT, A, B>,
  relation: Partial<Record<A | B, string>>
): RelationData<CONTENT, A, B> => {
  const idA: string | undefined = (relation as { [key in A | B]: string })[
    current.a
  ]
  const idB: string | undefined = (relation as { [key in A | B]: string })[
    current.b
  ]
  return idB ? removeSpecific(current, idA, idB) : removeAll(current, idA)
}
