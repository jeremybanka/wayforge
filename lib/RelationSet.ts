import { recordToHamt, hamtToRecord } from "fp-tools/hamt"
import { pipe } from "fp-ts/function"
import type { Hamt } from "hamt_plus"

import { mob } from "./fp-tools/object"
import type { Json, JsonObj } from "./json"

export type RelationSetJson<CONTENT extends Json | undefined = undefined> = {
  relations: JsonObj<string, string[]>
  contents: JsonObj<string, CONTENT>
}

export class RelationSet<CONTENT extends Json | undefined = undefined> {
  public contents: Hamt<CONTENT>
  public relations: Hamt<Set<string>>
  public makeRelationId(idA: string, idB: string): string {
    return [idA, idB].sort().join(`/`)
  }
  public constructor(
    json: RelationSetJson<CONTENT> = {
      contents: {},
      relations: {},
    }
  ) {
    this.contents = recordToHamt(json.contents)
    this.relations = pipe(
      json.relations,
      mob((a) => new Set(a)),
      recordToHamt
    )
  }
  public toJson(): RelationSetJson<CONTENT> {
    const contents = hamtToRecord(this.contents)
    const relations = pipe(
      this.relations,
      hamtToRecord,
      mob((a) => [...a])
    )
    return { contents, relations }
  }
  public set(
    teacherId: string,
    studentId: string,
    ...rest: CONTENT extends undefined ? [] : [CONTENT]
  ): RelationSet<CONTENT> {
    const data = rest[0]
    const teacherRelations = this.relations.get(teacherId) || new Set()
    const studentRelations = this.relations.get(studentId) || new Set()
    const newTeacherRelations = teacherRelations.add(studentId)
    const newStudentRelations = studentRelations.add(teacherId)
    this.relations = this.relations.set(teacherId, newTeacherRelations)
    this.relations = this.relations.set(studentId, newStudentRelations)
    if (data) {
      const relationId = [teacherId, studentId].sort().join(`/`)
      this.contents = this.contents.set(relationId, data as CONTENT)
    }
    return this
  }
  public set1ToMany(
    leaderId: string,
    followerId: string,
    ...rest: CONTENT extends undefined ? [] : [CONTENT]
  ): RelationSet<CONTENT> {
    const data = rest[0]
    const leaderRelations = this.relations.get(leaderId) || new Set()
    const newLeaderRelations = leaderRelations.add(followerId)
    const newFollowerRelations = new Set([leaderId])
    this.relations = this.relations.set(leaderId, newLeaderRelations)
    this.relations = this.relations.set(followerId, newFollowerRelations)
    if (data) {
      const relationId = this.makeRelationId(leaderId, followerId)
      this.contents = this.contents.set(relationId, data as CONTENT)
    }
    return this
  }
  public set1To1(
    leaderId: string,
    followerId: string,
    ...rest: CONTENT extends undefined ? [] : [CONTENT]
  ): RelationSet<CONTENT> {
    const data = rest[0]
    const newLeaderRelations = new Set([followerId])
    const newFollowerRelations = new Set([leaderId])
    this.relations = this.relations.set(leaderId, newLeaderRelations)
    this.relations = this.relations.set(followerId, newFollowerRelations)
    if (data) {
      const relationId = this.makeRelationId(leaderId, followerId)
      this.contents = this.contents.set(relationId, data as CONTENT)
    }
    return this
  }
  public getData(idA: string, idB: string): CONTENT | undefined {
    const relationId = this.makeRelationId(idA, idB)
    return this.contents.get(relationId)
  }
  public remove(idA: string, idB?: string): RelationSet<CONTENT> {
    if (idB) {
      const relationId = this.makeRelationId(idA, idB)
      this.contents = this.contents.remove(relationId)
      const relationsA = this.relations.get(idA) || new Set()
      const relationsB = this.relations.get(idB) || new Set()
      relationsA.delete(idB)
      relationsB.delete(idA)
      if (relationsA.size === 0) {
        this.relations = this.relations.remove(idA)
      } else {
        this.relations = this.relations.set(idA, relationsA)
      }
      if (relationsB.size === 0) {
        this.relations = this.relations.remove(idB)
      } else {
        this.relations = this.relations.set(idB, relationsB)
      }
    } else {
      const relations = this.relations.get(idA) || new Set()
      for (const id of relations) {
        this.remove(idA, id)
      }
      this.relations = this.relations.remove(idA)
    }
    return this
  }
}
