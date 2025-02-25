import type * as AtomIO from "atom.io"
import {
	capitalize,
	createRegularAtomFamily,
	createSelectorFamily,
	IMPLICIT,
} from "atom.io/internal"

const nameFamily = (topKey: string, subKey: string) =>
	`find` + capitalize(topKey) + capitalize(subKey) + `State`

export function structFamily<
	Struct extends object,
	Key extends string,
>(options: {
	key: Key
	default: Struct
}): [
	{
		[K in keyof Struct as `find${Capitalize<Key & string>}${Capitalize<
			K & string
		>}State`]: AtomIO.RegularAtomFamilyToken<Struct[K], string>
	},
	AtomIO.ReadonlySelectorFamilyToken<Struct, string>,
] {
	const atoms: {
		[K in keyof Struct as `find${Capitalize<Key & string>}${Capitalize<
			K & string
		>}State`]: AtomIO.RegularAtomFamilyToken<Struct[K], string>
	} = Object.keys(options.default).reduce((acc, subKey) => {
		const atomFamilyName = nameFamily(options.key, subKey)
		acc[atomFamilyName] = createRegularAtomFamily(IMPLICIT.STORE, {
			key: `${options.key}.${subKey}`,
			default: (options.default as any)[subKey],
		})
		return acc
	}, {} as any)
	const findStructState: AtomIO.ReadonlySelectorFamilyToken<Struct, string> =
		createSelectorFamily(IMPLICIT.STORE, {
			key: options.key,
			get:
				(id) =>
				({ find, get }) => {
					return Object.keys(options.default).reduce((acc, subKey) => {
						acc[subKey] = get(
							find((atoms as any)[nameFamily(options.key, subKey)], id),
						)
						return acc
					}, {} as any)
				},
		})
	return [atoms, findStructState]
}
