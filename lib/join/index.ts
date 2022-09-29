import type { Refinement } from "fp-ts/lib/Refinement"

import { isUndefined } from "../fp-tools"
import type { Json } from "../json"
import type { RelationData } from "./core-relation-data"
import { EMPTY_RELATION_DATA, isRelationData } from "./core-relation-data"
import { getRelation, getRelations } from "./get-relation"
import {
  getContent,
  getRelationContentEntries,
  getRelationContentRecord,
} from "./relation-contents"
import { removeRelation } from "./remove-relation"
import { setRelation } from "./set-relation"

export class Join<CONTENT extends Json | null = null>
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
  public static fromJSON<CONTENT extends Json | null = null>(
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
    return new Join(setRelation(this, idA, idB, ...rest))
  }
  public remove(idA: string, idB?: string): Join<CONTENT> {
    return new Join(removeRelation(this, idA, idB))
  }
}
