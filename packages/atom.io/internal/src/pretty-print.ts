import type {
	MoleculeFamilyToken,
	MoleculeToken,
	ReadableFamilyToken,
	ReadableToken,
	TimelineToken,
	TransactionToken,
} from "atom.io"

const capitalize = (str: string) => str[0].toUpperCase() + str.slice(1)

export type AtomIOToken =
	| MoleculeFamilyToken<any>
	| MoleculeToken<any>
	| ReadableFamilyToken<any, any>
	| ReadableToken<any>
	| TimelineToken<any>
	| TransactionToken<any>

export function prettyPrintTokenType(token: AtomIOToken): string {
	switch (token.type) {
		case `atom_family`:
			return `Atom Family`
		case `molecule_family`:
			return `Molecule Family`
		case `mutable_atom_family`:
			return `Mutable Atom Family`
		case `readonly_selector`:
			return `Readonly Selector`
		case `readonly_selector_family`:
			return `Readonly Selector Family`
		case `selector_family`:
			return `Selector Family`
		default:
			return capitalize(token.type)
	}
}
