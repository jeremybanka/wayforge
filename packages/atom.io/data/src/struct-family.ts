import type * as AtomIO from "atom.io"
import {
	IMPLICIT,
	createRegularAtomFamily,
	createSelectorFamily,
} from "atom.io/internal"

const capitalize = (str: string) => str[0].toUpperCase() + str.slice(1)
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
		>}State`]: AtomIO.RegularAtomFamily<Struct[K], string>
	},
	AtomIO.ReadonlySelectorFamily<Struct>,
] {
	const atoms: {
		[K in keyof Struct as `find${Capitalize<Key & string>}${Capitalize<
			K & string
		>}State`]: AtomIO.RegularAtomFamily<Struct[K], string>
	} = Object.keys(options.default).reduce((acc, subKey) => {
		const atomFamilyName = nameFamily(options.key, subKey)
		acc[atomFamilyName] = createRegularAtomFamily(
			{
				key: `${options.key}.${subKey}`,
				default: (options.default as any)[subKey],
			},
			IMPLICIT.STORE,
		)
		return acc
	}, {} as any)
	const findStructState = createSelectorFamily(
		{
			key: options.key,
			get:
				(id) =>
				({ get }) => {
					return Object.keys(options.default).reduce((acc, subKey) => {
						acc[subKey] = get(
							(atoms as any)[nameFamily(options.key, subKey)](id),
						)
						return acc
					}, {} as any)
				},
		},
		IMPLICIT.STORE,
	)
	return [atoms, findStructState]
}
