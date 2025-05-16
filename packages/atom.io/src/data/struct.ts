import type * as AtomIO from "atom.io"
import type { Store } from "atom.io/internal"
import {
	capitalize,
	createRegularAtom,
	createStandaloneSelector,
	IMPLICIT,
} from "atom.io/internal"

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
	AtomIO.ReadonlyPureSelectorToken<Struct>,
] {
	const atoms: {
		[K in keyof Struct as `${Key}${Capitalize<
			K & string
		>}State`]: AtomIO.RegularAtomToken<Struct[K]>
	} = Object.keys(options.default).reduce((acc, key) => {
		const atomName = options.key + capitalize(key) + `State`
		acc[atomName] = createRegularAtom(
			store,
			{
				key: `${options.key}.${key}`,
				default: options.default[key],
			},
			undefined,
		)
		return acc
	}, {} as any)
	const structState = createStandaloneSelector(store, {
		key: options.key,
		get: ({ get }) => {
			return Object.keys(options.default).reduce((acc, key) => {
				// @ts-expect-error finicky
				acc[key] = get(atoms[options.key + capitalize(key) + `State`])
				return acc
			}, {} as any)
		},
	})
	return [atoms, structState]
}
