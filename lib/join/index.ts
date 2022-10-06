import type { Refinement } from "fp-ts/lib/Refinement"
import type { Identified } from "id/identified"

import { isUndefined } from "../Anvil"
import type { NullSafeRest, NullSafeUnion } from "../Anvil/nullable"
import type { Json, JsonObj } from "../json"
import type { RelationData } from "./core-relation-data"
import { EMPTY_RELATION_DATA, isRelationData } from "./core-relation-data"
import { getRelatedId, getRelatedIds } from "./get-related-ids"
import { getContent, getRelations, setRelations } from "./relation-contents"
import { getRelationEntries, getRelationRecord } from "./relation-record"
import { removeRelation } from "./remove-relation"
import { setRelationWithContent } from "./set-relation"

export class Join<CONTENT extends JsonObj | null = null>
  implements RelationData<CONTENT>
{
  public readonly relationType: `1:1` | `1:n` | `n:n`
  public readonly relations: Record<string, string[]>
  public readonly contents: Record<string, CONTENT>
  public constructor(
    json: Partial<RelationData<CONTENT>> = EMPTY_RELATION_DATA
  ) {
    Object.assign(this, { ...EMPTY_RELATION_DATA, ...json })
  }
  public toJSON(): RelationData<CONTENT> {
    return {
      relationType: this.relationType,
      relations: this.relations,
      contents: this.contents,
    }
  }
  public static fromJSON<CONTENT extends JsonObj | null = null>(
    json: Json,
    isContent: Refinement<unknown, CONTENT> = isUndefined
  ): Join<CONTENT> {
    const isValid = isRelationData(isContent)(json)
    if (isValid) {
      return new Join(json)
    }
    throw new Error(
      `Saved JSON for this Join is invalid: ${JSON.stringify(json)}`
    )
  }

  public getRelatedId(id: string): string | undefined {
    return getRelatedId(this, id)
  }
  public getRelatedIds(id: string): string[] {
    return getRelatedIds(this, id)
  }
  public getContent(idA: string, idB: string): CONTENT | undefined {
    return getContent(this, idA, idB)
  }
  public getRelationEntries(id: string): [string, CONTENT][] {
    return getRelationEntries(this, id)
  }
  public getRelationRecord(id: string): Record<string, CONTENT> {
    return getRelationRecord(this, id)
  }
  public getRelation(
    id: string
  ): NullSafeUnion<Identified, CONTENT> | undefined {
    return getRelations(this, id)[0]
  }
  public getRelations(id: string): NullSafeUnion<Identified, CONTENT>[] {
    return getRelations(this, id)
  }
  public setRelations(
    id: string,
    relations: NullSafeUnion<Identified, CONTENT>[]
  ): Join<CONTENT> {
    return new Join(setRelations(this, id, relations))
  }
  public set(
    idA: string,
    idB: string,
    ...rest: NullSafeRest<CONTENT>
  ): Join<CONTENT> {
    return new Join(setRelationWithContent(this, idA, idB, ...rest))
  }
  public remove(idA: string, idB?: string): Join<CONTENT> {
    return new Join(removeRelation(this, idA, idB))
  }
}
