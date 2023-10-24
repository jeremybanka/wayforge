import type * as AtomIO from "atom.io"
import type { Store } from "atom.io/internal"
import { IMPLICIT } from "atom.io/internal"

import { createAtom, createSelector } from "atom.io/internal"

const capitalize = (str: string) => str[0].toUpperCase() + str.slice(1)

export function struct<Struct extends { [key: string]: unknown }>(
	options: {
		key: string
		default: Struct
	},
	store: Store = IMPLICIT.STORE,
): [
	{ [K in keyof Struct]: AtomIO.AtomToken<Struct[K]> },
	AtomIO.ReadonlySelectorToken<Struct>,
] {
	const atoms = Object.keys(options.default).reduce((acc, key) => {
		const atomName = options.key + capitalize(key) + `State`
		acc[atomName] = createAtom(
			{
				key: `${options.key}.${key}`,
				default: options.default[key],
			},
			undefined,
			store,
		)
		return acc
	}, {} as any)
	const structState = createSelector(
		{
			key: options.key,
			get: ({ get }) => {
				return Object.keys(options.default).reduce((acc, key) => {
					acc[key] = get(atoms[options.key + capitalize(key) + `State`])
					return acc
				}, {} as any)
			},
		},
		undefined,
		store,
	)
	return [atoms, structState]
}
