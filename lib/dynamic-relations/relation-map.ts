import { addTo, isArray, isEmptyArray, map } from "fp-tools/array"
import {
  entriesToRecord,
  isObject,
  isRecord,
  recordToEntries,
  treeShake as removeProperties,
} from "fp-tools/object"
import { split } from "fp-tools/string"
import { comprises } from "fp-tools/venn"
import { pipe } from "fp-ts/lib/function"
import type { Refinement } from "fp-ts/lib/Refinement"
import { isString } from "fp-ts/lib/string"
import type { Json, JsonObj } from "json"

/* eslint-disable max-lines */

export const RELATION_TYPES = [`1:1`, `1:n`, `n:n`] as const
export type RelationType = typeof RELATION_TYPES[number]
export const isRelationType = (x: unknown): x is RelationType =>
  RELATION_TYPES.includes(x as RelationType)

export type RelationMap<CONTENT extends Json | null = null> = {
  contents: JsonObj<string, CONTENT>
  relations: JsonObj<string, string[]>
  relationType: RelationType
}
export const DEFAULT_RELATION_MAP: RelationMap = {
  contents: {},
  relations: {},
  relationType: `n:n`,
}

export const isRelationMap =
  <CONTENT extends Json | null = null>(
    isContent?: (json: Json) => json is CONTENT
  ) =>
  (input: unknown): input is RelationMap<CONTENT> =>
    isObject<RelationMap<CONTENT>>({
      contents: isContent ? isRecord(isString, isContent) : isObject({}),
      relations: isRecord(isString, isArray(isString)),
      relationType: isRelationType,
    })(input)

export const makeRelationId = (idA: string, idB: string): string =>
  [idA, idB].sort().join(`/`)

export const getContent = <CONTENT extends Json | null = null>(
  relationMap: RelationMap<CONTENT>,
  idA: string,
  idB: string
): CONTENT | undefined => relationMap.contents[makeRelationId(idA, idB)]

export const setContent = <CONTENT extends Json | null = null>(
  map: RelationMap<CONTENT>,
  idA: string,
  idB: string,
  content: CONTENT
): RelationMap<CONTENT> => ({
  ...map,
  contents: {
    ...map.contents,
    [makeRelationId(idA, idB)]: content,
  },
})

export const getRelations = <CONTENT extends Json | null = null>(
  relationMap: RelationMap<CONTENT>,
  id: string
): string[] => relationMap.relations[id] ?? []

export const getRelation = <CONTENT extends Json | null = null>(
  relationMap: RelationMap<CONTENT>,
  id: string
): string | undefined => {
  const relations = getRelations(relationMap, id)
  if (relations.length > 1) {
    console.warn(
      `entry with id ${id} was not expected to have multiple relations`
    )
  }
  return relations[0]
}

export const getRelationContentEntries = <CONTENT extends Json | null = null>(
  relationMap: RelationMap<CONTENT>,
  idA: string
): [string, CONTENT][] =>
  getRelations(relationMap, idA).map((idB) => [
    idB,
    getContent(relationMap, idA, idB) as CONTENT,
  ])

export const getRelationContentRecord = <CONTENT extends Json | null = null>(
  relationMap: RelationMap<CONTENT>,
  id: string
): Record<string, CONTENT> =>
  Object.fromEntries(getRelationContentEntries(relationMap, id))

export const setManyToMany = <CONTENT extends Json | null = null>(
  map: RelationMap<CONTENT>,
  idA: string,
  idB: string,
  ...rest: CONTENT extends null ? [] | [undefined] : [CONTENT]
): RelationMap<CONTENT> => {
  const next = {
    ...map,
    relations: {
      ...map.relations,
      [idA]: addTo(map.relations[idA] ?? [])(idB),
      [idB]: addTo(map.relations[idB] ?? [])(idA),
    },
  }
  const content = rest[0] as CONTENT | undefined
  return content ? setContent(next, idA, idB, content) : next
}

const removeEmpties = removeProperties(isEmptyArray)

export const set1ToMany = <CONTENT extends Json | null = null>(
  current: RelationMap<CONTENT>,
  leaderId: string,
  followerId: string,
  ...rest: CONTENT extends null ? [] | [undefined] : [CONTENT]
): RelationMap<CONTENT> => {
  const relations = { ...current.relations }
  const prevLeaderId = getRelation(current, followerId)
  const next = {
    ...current,
    relations: {
      ...relations,
      ...(prevLeaderId &&
        prevLeaderId !== leaderId && {
          [prevLeaderId]: relations[prevLeaderId].filter(
            (id) => id !== followerId
          ),
        }),
      [followerId]: [leaderId],
      [leaderId]: addTo(relations[leaderId] ?? [])(followerId),
    },
  }
  const content = rest[0] as CONTENT | undefined
  return content ? setContent(next, leaderId, followerId, content) : next
}

export const set1To1 = <CONTENT extends Json | null = null>(
  current: RelationMap<CONTENT>,
  wifeId: string,
  husbandId: string,
  ...rest: CONTENT extends null ? [] | [undefined] : [CONTENT]
): RelationMap<CONTENT> => {
  const prevWifeId = getRelation(current, husbandId)
  const prevHusbandId = getRelation(current, wifeId)
  const next = {
    ...current,
    relations: removeEmpties({
      ...current.relations,
      ...(prevWifeId && { [prevWifeId]: [] }),
      ...(prevHusbandId && { [prevHusbandId]: [] }),
      [wifeId]: [husbandId],
      [husbandId]: [wifeId],
    }),
  }

  const content = rest[0] as CONTENT | undefined
  return content ? setContent(next, wifeId, husbandId, content) : next
}

export const set = <CONTENT extends Json | null = null>(
  current: RelationMap<CONTENT>,
  idA: string,
  idB: string,
  ...rest: CONTENT extends null ? [] | [undefined] : [CONTENT]
): RelationMap<CONTENT> => {
  switch (current.relationType) {
    case `1:1`:
      return set1To1(current, idA, idB, ...rest)
    case `1:n`:
      return set1ToMany(current, idA, idB, ...rest)
    case `n:n`:
      return setManyToMany(current, idA, idB, ...rest)
  }
}

export const isOneOf =
  <T>(...args: ReadonlyArray<T>) =>
  (input: unknown): input is T =>
    args.includes(input as T)

export const removeSpecific = <CONTENT extends Json | null = null>(
  current: RelationMap<CONTENT>,
  idA: string,
  idB: string
): RelationMap<CONTENT> => {
  const isIdForRemoval = isOneOf(idA, idB)
  const next: RelationMap<CONTENT> = {
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
  return next
}

export const removeAll = <CONTENT extends Json | null = null>(
  current: RelationMap<CONTENT>,
  idToRemove: string
): RelationMap<CONTENT> => {
  const next: RelationMap<CONTENT> = {
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

export const remove = <CONTENT extends Json | null = null>(
  current: RelationMap<CONTENT>,
  idA: string,
  idB?: string
): RelationMap<CONTENT> =>
  idB ? removeSpecific(current, idA, idB) : removeAll(current, idA)

export class Join<CONTENT extends Json | null = null>
  implements RelationMap<CONTENT>
{
  public readonly relationType: `1:1` | `1:n` | `n:n`
  public readonly relations: Record<string, string[]>
  public readonly contents: Record<string, CONTENT>
  public constructor(
    json: Partial<RelationMap<CONTENT>> = DEFAULT_RELATION_MAP
  ) {
    Object.assign(this, { ...DEFAULT_RELATION_MAP, ...json })
  }
  public toJSON(): RelationMap<CONTENT> {
    return {
      relationType: this.relationType,
      relations: this.relations,
      contents: this.contents,
    }
  }
  public static fromJSON<CONTENT extends Json | null = null>(
    isContent: Refinement<unknown, CONTENT>
  ) {
    return (json: Json): Join<CONTENT> => {
      if (isRelationMap(isContent)(json)) {
        return new Join(json)
      }
      throw new Error(
        `Saved JSON for this Join is invalid: ${JSON.stringify(json)}`
      )
    }
  }

  public getRelation(idA: string, idB?: string): string | undefined {
    return getRelation(this, idA)
  }
  public getRelations(idA: string): string[] {
    return getRelations(this, idA)
  }
  public getContent(idA: string, idB: string): CONTENT | undefined {
    return getContent(this, idA, idB)
  }
  public getRelationContentEntries(id: string): [string, CONTENT][] {
    return getRelationContentEntries(this, id)
  }
  public getRelationContentRecord(id: string): Record<string, CONTENT> {
    return getRelationContentRecord(this, id)
  }
  public set(
    idA: string,
    idB: string,
    ...rest: CONTENT extends null ? [] | [undefined] : [CONTENT]
  ): Join<CONTENT> {
    return new Join(set(this, idA, idB, ...rest))
  }
  public remove(idA: string, idB?: string): Join<CONTENT> {
    return new Join(remove(this, idA, idB))
  }
}
