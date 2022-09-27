import { pipe } from "fp-ts/lib/function"
import type { Refinement } from "fp-ts/lib/Refinement"
import { isString } from "fp-ts/lib/string"
import type { Hamt } from "hamt_plus"

import { addTo, isArray, isEmptyArray, map } from "./fp-tools/array"
import { recordToHamt, hamtToRecord } from "./fp-tools/hamt"
import {
  entriesToRecord,
  isObject,
  isPlainObject,
  isRecord,
  recordToEntries,
  treeShake,
} from "./fp-tools/object"
import type { Json, JsonObj } from "./json"

/* eslint-disable max-lines */

export type RelationSetJson<CONTENT extends Json | null = null> = {
  contents: JsonObj<string, CONTENT>
  relations: JsonObj<string, string[]>
}

export const isRelationSetJson =
  <CONTENT extends Json | null = null>(
    isContent: Refinement<unknown, CONTENT>
  ) =>
  (json: Json): json is RelationSetJson<CONTENT> =>
    isPlainObject(json)
      ? isRecord(isString, isContent)(json.contents)
        ? isRecord(isString, isArray(isString))(json.relations) ||
          (console.warn(`input.relations is not a Record<string, string[]>`),
          false)
        : (console.warn(`input.contents is not a Record<string, CONTENT>`),
          false)
      : (console.warn(`"input is not an object`), false)

export class RelationSet<CONTENT extends Json | null = null> {
  public contents: Hamt<CONTENT>
  public relations: Hamt<ReadonlyArray<string>>
  public constructor(
    json: RelationSetJson<CONTENT> = {
      contents: {},
      relations: {},
    }
  ) {
    this.contents = recordToHamt(json.contents)
    this.relations = recordToHamt(json.relations)
  }
  public makeRelationId(idA: string, idB: string): string {
    return [idA, idB].sort().join(`/`)
  }
  public toJSON(): RelationSetJson<CONTENT> {
    const contents = hamtToRecord(this.contents)
    const relations = hamtToRecord(this.relations) as JsonObj<string, string[]>
    return { contents, relations }
  }
  public static fromJSON<CONTENT extends Json | null = null>(
    isContent: Refinement<unknown, CONTENT>
  ) {
    return (json: Json): RelationSet<CONTENT> => {
      if (isRelationSetJson(isContent)(json)) {
        return new RelationSet(json)
      }
      throw new Error(
        `Saved JSON for this RelationSet is invalid: ${JSON.stringify(json)}`
      )
    }
  }
  public clone(): RelationSet<CONTENT> {
    return new RelationSet(this.toJSON())
  }
  protected setContent(
    idA: string,
    idB: string,
    content: CONTENT
  ): RelationSet<CONTENT> {
    const relationId = this.makeRelationId(idA, idB)
    this.contents = this.contents.set(relationId, content)
    return this
  }
  public set(
    teacherId: string,
    studentId: string,
    ...rest: CONTENT extends null ? [] | [undefined] : [CONTENT]
  ): RelationSet<CONTENT> {
    const teacherRelations = this.relations.get(teacherId) ?? []
    const studentRelations = this.relations.get(studentId) ?? []
    const newTeacherRelations = teacherRelations.includes(studentId)
      ? teacherRelations
      : [...teacherRelations, studentId]
    const newStudentRelations = studentRelations.includes(teacherId)
      ? studentRelations
      : [...studentRelations, teacherId]
    this.relations = this.relations.set(teacherId, newTeacherRelations)
    this.relations = this.relations.set(studentId, newStudentRelations)
    const content = rest[0]
    if (content) this.setContent(teacherId, studentId, content as CONTENT)
    return this
  }
  public set1ToMany(
    leaderId: string,
    followerId: string,
    ...rest: CONTENT extends null ? [] | [undefined] : [CONTENT]
  ): RelationSet<CONTENT> {
    const leaderRelations = this.relations.get(leaderId) ?? []
    const newLeaderRelations = leaderRelations.includes(followerId)
      ? leaderRelations
      : [...leaderRelations, followerId]
    const prevLeaderId = this.getRelation(followerId)
    if (prevLeaderId) {
      const prevLeaderRelations = this.relations.get(prevLeaderId) ?? []
      const newPrevLeaderRelations = prevLeaderRelations.filter(
        (id) => id !== followerId
      )
      this.relations = this.relations.set(prevLeaderId, newPrevLeaderRelations)
    }
    const newFollowerRelations = [leaderId]
    this.relations = this.relations.set(leaderId, newLeaderRelations)
    this.relations = this.relations.set(followerId, newFollowerRelations)
    const content = rest[0]
    if (content) this.setContent(leaderId, followerId, content as CONTENT)
    return this
  }
  public set1To1(
    wifeId: string,
    husbandId: string,
    ...rest: CONTENT extends null ? [] : [CONTENT]
  ): RelationSet<CONTENT> {
    const prevRelations = [this.getRelation(wifeId), this.getRelation(husbandId)]
    prevRelations.forEach((id) => {
      if (id) this.remove(id)
    })
    const wifeRelations = [husbandId]
    const husbandRelations = [wifeId]
    this.relations = this.relations.set(wifeId, wifeRelations)
    this.relations = this.relations.set(husbandId, husbandRelations)
    const content = rest[0]
    if (content) this.setContent(wifeId, husbandId, content as CONTENT)
    return this
  }
  public remove(idA: string, idB?: string): RelationSet<CONTENT> {
    if (idB) {
      const relationId = this.makeRelationId(idA, idB)
      this.contents = this.contents.remove(relationId)
      const relationsA = this.relations.get(idA) ?? []
      const relationsB = this.relations.get(idB) ?? []
      const newRelationsA = relationsA.filter((id) => id !== idB)
      const newRelationsB = relationsB.filter((id) => id !== idA)
      const bothNewRelations = [newRelationsA, newRelationsB]
      bothNewRelations.forEach((newRelations, i) => {
        const id = [idA, idB][i]
        if (newRelations.length === 0) {
          this.relations = this.relations.remove(id)
        }
        this.relations = this.relations.set(id, newRelations)
      })
    } else {
      const relations = this.relations.get(idA) ?? []
      relations.forEach((id) => this.remove(idA, id))
      this.relations = this.relations.remove(idA)
    }
    return this
  }
  public getContent(idA: string, idB: string): CONTENT | undefined {
    const relationId = this.makeRelationId(idA, idB)
    return this.contents.get(relationId)
  }
  public getRelations(id: string): ReadonlyArray<string> {
    return this.relations.get(id, [])
  }
  public getRelation(id: string): string | undefined {
    const relations = this.getRelations(id)
    if (relations.length > 1) {
      console.warn(
        `entry with id ${id} was not expected to have multiple relations`
      )
    }
    return relations[0]
  }
  public getRelationContentEntries(idA: string): [string, CONTENT][] {
    const relations = this.relations.get(idA) ?? []
    return relations.map((idB) => [idB, this.getContent(idA, idB) as CONTENT])
  }
  public getRelationContentRecord(id: string): Record<string, CONTENT> {
    return Object.fromEntries(this.getRelationContentEntries(id))
  }
}
export const RELATION_TYPES = [`1:1`, `1:n`, `n:n`] as const
export type RelationType = typeof RELATION_TYPES[number]
export const isRelationType = (x: unknown): x is RelationType =>
  RELATION_TYPES.includes(x as RelationType)

export type RelationMap<CONTENT extends Json | null = null> =
  RelationSetJson<CONTENT> & {
    relationType: RelationType
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

// export type RelationMap<CONTENT extends Json | null = null> =
//   RelationSetJson<CONTENT> & {
//     isContent: CONTENT extends null ? undefined : Refinement<unknown, CONTENT>
//   }

// export const hydrate = (input: unknown): RelationMap => {
//   if (isRelationMapJson(undefined)(input)) {
//     return { ...input, isContent: undefined }
//   }
//   throw new Error(`invalid input for hydrate`)
// }

// export const hydrateWithContent =
//   <CONTENT extends Json>(isContent: Refinement<unknown, CONTENT>) =>
//   (input: unknown): RelationMap<CONTENT> => {
//     // @ts-expect-error isContent is appropriate for input, but ts struggles
//     if (isRelationMapJson(isContent)(input)) return { ...input, isContent }
//     throw new Error(`invalid input for hydrateWithContent`)
//   }

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
      [idA]: [...(map.relations[idA] ?? []), idB],
      [idB]: [...(map.relations[idB] ?? []), idA],
    },
  }
  const content = rest[0] as CONTENT | undefined
  return content ? setContent(next, idA, idB, content) : next
}

const removeEmpties = treeShake(isEmptyArray)

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
      [leaderId]: addTo(relations[leaderId])(followerId),
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

export const remove = <CONTENT extends Json | null = null>(
  current: RelationMap<CONTENT>,
  idA: string,
  idB?: string // fix: if passed, only the specific relation is removed
): RelationMap<CONTENT> => {
  const isIdForRemoval = isOneOf(idA, idB)
  const next: RelationMap<CONTENT> = {
    ...current,
    relations: pipe(
      current.relations,
      recordToEntries,
      map(([id, relations]): [id: string, fewerRelations: string[]] => [
        id,
        relations.filter((relation) => !isIdForRemoval(relation)),
      ]),
      entriesToRecord,
      treeShake((val, key) => isEmptyArray(val) || isIdForRemoval(key))
    ),
    contents: pipe(
      current.contents,
      treeShake((_, key) => isString(key) && key.split(`/`).some(isIdForRemoval))
    ),
  }
  return next
}
