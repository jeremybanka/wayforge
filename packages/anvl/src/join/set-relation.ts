import type { RelationData } from "./core-relation-data"
import { getRelatedId } from "./get-related-ids"
import { setContent } from "./relation-contents"
import { addTo, isEmptyArray } from "../array"
import type { JsonObj } from "../json"
import type { NullSafeRest } from "../nullish"
import { treeShake as removeProperties } from "../object"

export const setManyToMany = <
  CONTENT extends JsonObj | null,
  A extends string,
  B extends string
>(
  map: RelationData<CONTENT, A, B>,
  idA: string,
  idB: string,
  ...rest: NullSafeRest<CONTENT>
): RelationData<CONTENT, A, B> => {
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

export const set1ToMany = <
  CONTENT extends JsonObj | null,
  A extends string,
  B extends string
>(
  current: RelationData<CONTENT, A, B>,
  leaderId: string,
  followerId: string,
  ...rest: NullSafeRest<CONTENT>
): RelationData<CONTENT, A, B> => {
  const relations = { ...current.relations }
  const prevLeaderId = getRelatedId(current, followerId)
  const next = {
    ...current,
    relations: removeEmpties({
      ...relations,
      ...(prevLeaderId &&
        prevLeaderId !== leaderId && {
          [prevLeaderId]: relations[prevLeaderId].filter(
            (id) => id !== followerId
          ),
        }),
      [followerId]: [leaderId],
      [leaderId]: addTo(relations[leaderId] ?? [])(followerId),
    }),
  }
  const content = rest[0] as CONTENT | undefined
  return content ? setContent(next, leaderId, followerId, content) : next
}

export const set1To1 = <
  CONTENT extends JsonObj | null,
  A extends string,
  B extends string
>(
  current: RelationData<CONTENT, A, B>,
  wifeId: string,
  husbandId: string,
  ...rest: NullSafeRest<CONTENT>
): RelationData<CONTENT, A, B> => {
  const prevWifeId = getRelatedId(current, husbandId)
  const prevHusbandId = getRelatedId(current, wifeId)
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

export const setRelationWithContent = <
  CONTENT extends JsonObj | null,
  A extends string,
  B extends string
>(
  current: RelationData<CONTENT, A, B>,
  relation: Record<A | B, string>,
  ...rest: NullSafeRest<CONTENT>
): RelationData<CONTENT, A, B> => {
  const { [current.a]: idA, [current.b]: idB } = relation
  // console.log({
  //   current,
  //   relation,
  //   idA,
  //   idB,
  // })
  switch (current.relationType) {
    case `1:1`:
      return set1To1(current, idA, idB, ...rest)
    case `1:n`:
      return set1ToMany(current, idA, idB, ...rest)
    case `n:n`:
      return setManyToMany(current, idA, idB, ...rest)
  }
}
