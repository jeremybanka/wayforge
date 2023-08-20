import type { AtomToken, ReadonlySelectorToken, SelectorToken } from "atom.io"

export * from "./attach-introspection-states"

export type FamilyNode<
	Token extends
		| AtomToken<unknown>
		| ReadonlySelectorToken<unknown>
		| SelectorToken<unknown>,
> = {
	key: string
	familyMembers: Record<string, Token>
}

export type StateTokenIndex<
	Token extends
		| AtomToken<unknown>
		| ReadonlySelectorToken<unknown>
		| SelectorToken<unknown>,
> = Record<string, FamilyNode<Token> | Token>
