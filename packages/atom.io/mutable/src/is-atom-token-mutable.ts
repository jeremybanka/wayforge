import * as AtomIO from "atom.io"
import type { MutableAtomToken } from "./create-mutable-atom"

export function isAtomTokenMutable(
	token: AtomIO.AtomToken<any>,
): token is MutableAtomToken<any, any> {
	return token.key.endsWith(`::mutable`)
}
