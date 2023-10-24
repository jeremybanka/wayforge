import type * as AtomIO from "atom.io"
import { createAtomFamily, createSelectorFamily } from "atom.io/internal"

const capitalize = (str: string) => str[0].toUpperCase() + str.slice(1)

export function structFamily<Struct extends object>(options: {
	key: string
	default: Struct
}): [
	{
		[K in
			keyof Struct as `find${Capitalize<K & string>}`]: AtomIO.AtomFamily<string>
	},
	AtomIO.ReadonlySelectorFamily<Struct>,
] {
	const atoms: {
		[K in
			keyof Struct as `find${Capitalize<K & string>}`]: AtomIO.AtomFamily<string>
	} = Object.keys(options.default).reduce((acc, key) => {
		const atomFamilyName =
			`find` + capitalize(options.key) + capitalize(key) + `State`
		acc[atomFamilyName] = createAtomFamily({
			key: `${options.key}.${key}`,
			default: (options.default as any)[key],
		})
		return acc
	}, {} as any)
	const findStructState = createSelectorFamily({
		key: options.key,
		get: (id) => ({ get }) => {
			return Object.keys(options.default).reduce((acc, key) => {
				acc[key] = get((atoms as any)[key](id))
				return acc
			}, {} as any)
		},
	})
	return [atoms, findStructState]
}
