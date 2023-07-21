import type { AtomToken, ReadonlySelectorToken, SelectorToken } from "atom.io"

export * from "./attach-introspection-states"

export type StateTokenIndex<
	Token extends
		| AtomToken<unknown>
		| ReadonlySelectorToken<unknown>
		| SelectorToken<unknown>,
> = Record<
	string,
	| Token
	| {
			key: string
			familyMembers: Record<string, Token>
	  }
>
