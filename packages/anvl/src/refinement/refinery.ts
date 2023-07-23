import type { Refinement } from "fp-ts/refinement"

import type { ClassSignature } from "."

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

	public refine(input: unknown):
		| {
				[K in keyof SupportedTypes]: {
					type: K
					data: Supported<SupportedTypes[K]>
				}
		  }[keyof SupportedTypes]
		| null {
		for (const [key, refiner] of Object.entries(this.supported)) {
			try {
				if (
					// @ts-expect-error that's the point
					(refiner(input) === true && refiner !== Boolean) ||
					input instanceof refiner
				) {
					return { type: key, data: input } as any
				}
			} catch (e) {
				// console.debug(e)
			}
		}
		return null
	}
}

const jsonRefinery = new Refinery({
	number: (input: unknown): input is number => typeof input === `number`,
	string: (input: unknown): input is string => typeof input === `string`,
	boolean: (input: unknown): input is boolean => typeof input === `boolean`,
	object: (input: unknown): input is object =>
		typeof input === `object` && input !== null,
	array: (input: unknown): input is unknown[] => Array.isArray(input),
	null: (input: unknown): input is null => input === null,
})

const myRefinery = new Refinery({
	Set,
	Map,
})

const a = myRefinery.refine(new Set([1, 2, 3]))

if (a !== null) {
	if (a.type === `Set`) {
		a.data
	} else {
		a.data
	}
}

export const discoverType = (input: unknown): string => {
	if (input === undefined) {
		return `undefined`
	}
	const refined = jsonRefinery.refine(input)
	if (refined) {
		return refined.type
	}
	return Object.getPrototypeOf(input).constructor.name
}
