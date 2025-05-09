import type { Json, JsonInterface } from "atom.io/json"

import type { Identified } from "../id"
import type { NullSafeRest, NullSafeUnion } from "../nullish"
import type { Refinement } from "../refinement"
import type { IsRelationDataOptions, RelationData } from "./core-relation-data"
import { EMPTY_RELATION_DATA, isRelationData } from "./core-relation-data"
import { getRelatedId, getRelatedIds } from "./get-related-ids"
import { makeJsonInterface } from "./make-json-interface"
import { getContent, getRelations, setRelations } from "./relation-contents"
import { getRelationEntries, getRelationRecord } from "./relation-record"
import { removeRelation } from "./remove-relation"
import { setRelationWithContent } from "./set-relation"

export class Join<
	CONTENT extends Json.Object | null = null,
	A extends string = `from`,
	B extends string = `to`,
> implements RelationData<CONTENT, A, B>
{
	public readonly relationType!: `1:1` | `1:n` | `n:n`
	public readonly a: A = `from` as A
	public readonly b: B = `to` as B
	public readonly relations!: Record<string, string[]>
	public readonly contents!: Record<string, CONTENT>
	public constructor(json?: Partial<RelationData<CONTENT, A, B>>) {
		Object.assign(this, {
			...EMPTY_RELATION_DATA,
			...json,
			makeJsonInterface: this.makeJsonInterface,
		})
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
	public static fromJSON<
		CONTENT extends Json.Object | null,
		A extends string,
		B extends string,
	>(
		json: Json.Serializable,
		options?: IsRelationDataOptions<CONTENT, A, B>,
	): Join<CONTENT, A, B> {
		const isValid = isRelationData<CONTENT, A, B>(options)(json)
		if (isValid) {
			return new Join<CONTENT, A, B>(json)
		}
		throw new Error(
			`Saved JSON for this Join is invalid: ${JSON.stringify(json)}`,
		)
	}

	public from<AA extends string>(newA: AA): Join<CONTENT, AA, B> {
		return new Join({ ...this, a: newA })
	}

	public to<BB extends string>(newB: BB): Join<CONTENT, A, BB> {
		return new Join({ ...this, b: newB })
	}

	public makeJsonInterface = (
		...params: CONTENT extends null ? [] : [Refinement<unknown, CONTENT>]
	): JsonInterface<Join<CONTENT, A, B>, RelationData<CONTENT, A, B>> => {
		return makeJsonInterface<CONTENT, A, B>(this, ...params)
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
		id: string,
	): NullSafeUnion<Identified, CONTENT> | undefined {
		return getRelations(this, id)[0]
	}
	public getRelations(id: string): NullSafeUnion<Identified, CONTENT>[] {
		return getRelations(this, id)
	}
	public setRelations(
		subject: { [from in A]: string } | { [to in B]: string },
		relations: NullSafeUnion<Identified, CONTENT>[],
	): Join<CONTENT, A, B> {
		return new Join(setRelations(this, subject, relations))
	}
	public set(
		relation: { [key in A | B]: string },
		...rest: NullSafeRest<CONTENT>
	): Join<CONTENT, A, B> {
		return new Join(setRelationWithContent(this, relation, ...rest))
	}
	public remove(relation: Partial<Record<A | B, string>>): Join<CONTENT, A, B> {
		return new Join(removeRelation(this, relation))
	}
}
