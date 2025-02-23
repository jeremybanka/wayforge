import type { AtomIOToken } from "atom.io"

const capitalize = (str: string) => str[0].toUpperCase() + str.slice(1)

export function prettyPrintTokenType(token: AtomIOToken): string {
	return token.type.split(`_`).map(capitalize).join(` `)
}
