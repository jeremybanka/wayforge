import type * as AtomIO from "atom.io"
import type { Store } from "atom.io/internal"
import { IMPLICIT } from "atom.io/internal"

import { createRegularAtom, createStandaloneSelector } from "atom.io/internal"

const capitalize = (str: string) => str[0].toUpperCase() + str.slice(1)

export function struct<
	Struct extends { [key: string]: unknown },
	Key extends string,
>(
	options: {
		key: Key
		default: Struct
	},
	store: Store = IMPLICIT.STORE,
): [
	{
		[K in keyof Struct as `${Key}${Capitalize<
			K & string
		>}State`]: AtomIO.RegularAtomToken<Struct[K]>
	},
	AtomIO.ReadonlySelectorToken<Struct>,
] {
	const atoms: {
		[K in keyof Struct as `${Key}${Capitalize<
			K & string
		>}State`]: AtomIO.RegularAtomToken<Struct[K]>
	} = Object.keys(options.default).reduce((acc, key) => {
		const atomName = options.key + capitalize(key) + `State`
		acc[atomName] = createRegularAtom(
			{
				key: `${options.key}.${key}`,
				default: options.default[key],
			},
			undefined,
			store,
		)
		return acc
	}, {} as any)
	const structState = createStandaloneSelector(
		{
			key: options.key,
			get: ({ get }) => {
				return Object.keys(options.default).reduce((acc, key) => {
					acc[key] = get(atoms[options.key + capitalize(key) + `State`])
					return acc
				}, {} as any)
			},
		},
		store,
	)
	return [atoms, structState]
}
