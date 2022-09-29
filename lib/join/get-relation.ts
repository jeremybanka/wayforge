import type { Json } from "../json"
import type { RelationData } from "./core-relation-data"

export const getRelations = <CONTENT extends Json | null = null>(
  relationMap: RelationData<CONTENT>,
  id: string
): string[] => relationMap.relations[id] ?? []

export const getRelation = <CONTENT extends Json | null = null>(
  relationMap: RelationData<CONTENT>,
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
