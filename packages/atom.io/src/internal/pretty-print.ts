import type { AtomIOToken } from "atom.io"

import { capitalize } from "./capitalize"

export function prettyPrintTokenType(token: AtomIOToken): string {
	return token.type.split(`_`).map(capitalize).join(` `)
}
