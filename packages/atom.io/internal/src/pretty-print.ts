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
	return token.type.split(`_`).map(capitalize).join(` `)
}
