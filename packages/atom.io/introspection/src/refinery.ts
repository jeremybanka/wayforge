import type { Flat } from "atom.io/internal"
import type { Json } from "atom.io/json"

export type Refinement<A, B extends A> = (a: A) => a is B

export type ClassSignature = abstract new (...args: any) => any

export type RefinementStrategy = ClassSignature | Refinement<unknown, any>

export type Supported<Refine extends RefinementStrategy> =
	Refine extends Refinement<unknown, infer T>
		? T
		: Refine extends ClassSignature
			? InstanceType<Refine>
			: never

export type RefinementSupport = Record<string, RefinementStrategy>

export class Refinery<SupportedTypes extends RefinementSupport> {
	public supported: SupportedTypes

	public constructor(supported: SupportedTypes) {
		this.supported = supported
	}

	public refine<T>(input: T):
		| Flat<{
				[K in keyof SupportedTypes]: T extends Supported<SupportedTypes[K]>
					? {
							type: K
							data: Supported<SupportedTypes[K]>
						}
					: Supported<SupportedTypes[K]> extends T
						? {
								type: K
								data: Supported<SupportedTypes[K]>
							}
						: never
		  }>[keyof SupportedTypes]
		| (T extends Supported<SupportedTypes[keyof SupportedTypes]>
				? never
				: null) {
		for (const [key, refiner] of Object.entries(this.supported)) {
			try {
				if (
					// @ts-expect-error that's the point
					refiner(input) === true &&
					refiner !== Boolean
				) {
					return { type: key, data: input } as any
				}
			} catch (_) {
				try {
					if (input instanceof refiner) {
						return { type: key, data: input } as any
					}
				} catch (__) {}
			}
		}
		return null as any
	}
}

export const primitiveRefinery = new Refinery({
	number: (input: unknown): input is number => typeof input === `number`,
	string: (input: unknown): input is string => typeof input === `string`,
	boolean: (input: unknown): input is boolean => typeof input === `boolean`,
	null: (input: unknown): input is null => input === null,
})

export const jsonTreeRefinery = new Refinery({
	object: (input: unknown): input is Json.Tree.Fork.Obj => {
		if (!input) {
			return false
		}
		const prototype = Object.getPrototypeOf(input)
		return prototype === Object.prototype
	},
	array: (input: unknown): input is Json.Tree.Fork.Arr => Array.isArray(input),
})

export const jsonRefinery = new Refinery({
	...primitiveRefinery.supported,
	...jsonTreeRefinery.supported,
})

export type JsonType = keyof typeof jsonRefinery.supported

export const discoverType = (
	input: unknown,
): JsonType | `Map` | `Set` | `undefined` | (string & {}) => {
	if (input === undefined) {
		return `undefined`
	}
	const refined = jsonRefinery.refine(input)
	if (refined) {
		return refined.type
	}
	return Object.getPrototypeOf(input).constructor.name
}
