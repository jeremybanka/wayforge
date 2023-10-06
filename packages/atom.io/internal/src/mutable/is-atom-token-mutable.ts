import type { AtomToken, MutableAtomToken } from "atom.io"

export function isAtomTokenMutable(
	token: AtomToken<any>,
): token is MutableAtomToken<any, any> {
	return token.key.endsWith(`::mutable`)
}
