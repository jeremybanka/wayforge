import { canExist } from "./can-exist"
import type { Refinement } from "./refinement"

export type ExtendsAll<A, B> = Refinement<unknown, A & B> & {
	and: <C>(isType: Refinement<unknown, C>) => ExtendsAll<A & B, C>
}
export function mustSatisfyAllOfTheFollowing<A>(
	isTypeA: Refinement<unknown, A>,
	logging = false,
	refinements: Refinement<unknown, any>[] = [isTypeA],
): {
	(input: unknown): input is A
	and: <B>(isTypeB: Refinement<unknown, B>) => ExtendsAll<A, B>
} {
	console.log({ isTypeA, refinements })
	let name = ``
	try {
		name = `(${refinements.map((r) => r?.name || `anon`).join(` & `)})`
	} catch (e) {
		console.log(e)
	}
	const _ = {
		[name]: (input: unknown): input is A =>
			refinements.every(
				(refinement) => (
					logging &&
						console.log(
							refinements.map((r) => r.name || `anon`).join(` & `),
							`>`,
							refinement.name || `anon`,
							`:`,
							refinement(input),
						),
					refinement(input)
				),
			),
	}
	const checkTypes: {
		(input: unknown): input is A
		and: <B>(isTypeB: Refinement<unknown, B>) => ExtendsAll<A, B>
	} = Object.assign(_[name], {
		and: <B>(isTypeB: Refinement<unknown, B>): ExtendsAll<A, B> =>
			mustSatisfyAllOfTheFollowing(isTypeB, logging, [
				...refinements,
				isTypeB,
			]) as ExtendsAll<A, B>,
	})
	return checkTypes
}

export const isIntersection = mustSatisfyAllOfTheFollowing(canExist)
