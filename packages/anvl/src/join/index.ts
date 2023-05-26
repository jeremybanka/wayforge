import type { Refinement } from "fp-ts/Refinement"

import type { Identified } from "~/packages/anvl/src/id/identified"

import type { RelationData } from "./core-relation-data"
import { EMPTY_RELATION_DATA, isRelationData } from "./core-relation-data"
import { getRelatedId, getRelatedIds } from "./get-related-ids"
import { getContent, getRelations, setRelations } from "./relation-contents"
import { getRelationEntries, getRelationRecord } from "./relation-record"
import { removeRelation } from "./remove-relation"
import { setRelationWithContent } from "./set-relation"
import type { Json, JsonObj } from "../json"
import type { NullSafeRest, NullSafeUnion } from "../nullish"
import { cannotExist } from "../refinement"

export class Join<
  CONTENT extends JsonObj | null = null,
  A extends string = `from`,
  B extends string = `to`
> implements RelationData<CONTENT, A, B>
{
  public readonly relationType: `1:1` | `1:n` | `n:n`
  public readonly a: A = `from` as A
  public readonly b: B = `to` as B
  public readonly relations: Record<string, string[]>
  public readonly contents: Record<string, CONTENT>
  public constructor(json?: Partial<RelationData<CONTENT, A, B>>) {
    Object.assign(this, { ...EMPTY_RELATION_DATA, ...json })
  }
  public toJSON(): RelationData<CONTENT, A, B> {
    return {
      relationType: this.relationType,
      relations: this.relations,
      contents: this.contents,
      a: this.a,
      b: this.b,
    }
  }
  public static fromJSON<CONTENT extends JsonObj | null = null>(
    json: Json,
    isContent: Refinement<unknown, CONTENT> = cannotExist,
    a = `from`,
    b = `to`
  ): Join<CONTENT> {
    const isValid = isRelationData(isContent, a, b)(json)
    if (isValid) {
      return new Join(json)
    }
    throw new Error(
      `Saved JSON for this Join is invalid: ${JSON.stringify(json)}`
    )
  }

  public from<AA extends string>(newA: AA): Join<CONTENT, AA, B> {
    return new Join({ ...this, a: newA })
  }

  public to<BB extends string>(newB: BB): Join<CONTENT, A, BB> {
    return new Join({ ...this, b: newB })
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
    subject: { [from in A]: string } | { [to in B]: string },
    relations: NullSafeUnion<Identified, CONTENT>[]
  ): Join<CONTENT> {
    return new Join(setRelations(this, subject, relations))
  }
  public set(
    relation: { [key in A | B]: string },
    ...rest: NullSafeRest<CONTENT>
  ): Join<CONTENT> {
    return new Join(setRelationWithContent(this, relation, ...rest))
  }
  public remove(
    relation:
      | {
          [key in A | B]: string
        }
      | {
          [key in A]: string
        }
      | {
          [key in B]: string
        }
  ): Join<CONTENT> {
    return new Join(removeRelation(this, relation))
  }
}
