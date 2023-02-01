import { pipe } from "fp-ts/function"
import { isString } from "fp-ts/string"

import type { RelationData } from "./core-relation-data"
import { isEmptyArray, isOneOf, map } from "../array"
import { comprises } from "../array/venn"
import type { JsonObj } from "../json"
import { treeShake as removeProperties } from "../object"
import { entriesToRecord, recordToEntries } from "../object/entries"
import { split } from "../string/split"

export const removeSpecific = <CONTENT extends JsonObj | null = null>(
  current: RelationData<CONTENT>,
  idA: string,
  idB: string
): RelationData<CONTENT> => {
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

export const removeAll = <CONTENT extends JsonObj | null = null>(
  current: RelationData<CONTENT>,
  idToRemove: string
): RelationData<CONTENT> => {
  const next: RelationData<CONTENT> = {
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

export const removeRelation = <CONTENT extends JsonObj | null = null>(
  current: RelationData<CONTENT>,
  idA: string,
  idB?: string
): RelationData<CONTENT> =>
  idB ? removeSpecific(current, idA, idB) : removeAll(current, idA)
