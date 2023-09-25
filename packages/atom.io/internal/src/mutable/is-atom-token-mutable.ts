import type * as AtomIO from "atom.io"

export function isAtomTokenMutable(
	token: AtomIO.AtomToken<any>,
): token is AtomIO.MutableAtomToken<any, any> {
	return token.key.endsWith(`::mutable`)
}
