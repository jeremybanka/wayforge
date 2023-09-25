import { cannotExist } from "./cannot-exist"
import type { Refinement } from "./refinement"

export type ExtendsSome<A, B> = Refinement<unknown, A | B> & {
	or: <C>(isType: Refinement<unknown, C>) => ExtendsSome<unknown, A | B | C>
}
export const mustSatisfyOneOfTheFollowing = <A>(
	isTypeA: Refinement<unknown, A>,
	logging = false,
	refinements: Refinement<unknown, any>[] = [isTypeA],
): {
	(input: unknown): input is A
	or: <B>(isTypeB: Refinement<unknown, B>) => ExtendsSome<A, B>
} => {
	const name = `(${refinements.map((r) => r?.name || `anon`).join(` | `)})`
	const _ = {
		[name]: (input: unknown): input is A =>
			refinements.some(
				(refinement) => (
					logging &&
						console.log(
							refinements.map((r) => r.name || `anon`).join(` | `),
							`>`,
							refinement.name ?? `anon`,
							`:`,
							refinement(input),
						),
					refinement(input)
				),
			),
	}
	const checkTypes: {
		(input: unknown): input is A
		or: <B>(isTypeB: Refinement<unknown, B>) => ExtendsSome<A, B>
	} = Object.assign(_[name], {
		or: <B>(isTypeB: Refinement<unknown, B>): ExtendsSome<A, B> =>
			mustSatisfyOneOfTheFollowing(isTypeB, logging, [...refinements, isTypeB]),
	})
	return checkTypes
}

export const isUnion = mustSatisfyOneOfTheFollowing(cannotExist)
