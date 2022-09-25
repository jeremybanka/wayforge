import type { Refinement } from "fp-ts/lib/Refinement"
import { isString } from "fp-ts/lib/string"
import type { Hamt } from "hamt_plus"

import { isArray } from "./fp-tools/array"
import { recordToHamt, hamtToRecord } from "./fp-tools/hamt"
import { isPlainObject, isRecord } from "./fp-tools/object"
import type { Json, JsonObj } from "./json"

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
