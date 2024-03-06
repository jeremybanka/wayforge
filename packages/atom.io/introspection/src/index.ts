import type {
	AtomToken,
	ReadonlySelectorToken,
	WritableSelectorToken,
} from "atom.io"

export * from "./attach-introspection-states"

export type FamilyNode<
	Token extends
		| AtomToken<unknown>
		| ReadonlySelectorToken<unknown>
		| WritableSelectorToken<unknown>,
> = {
	key: string
	familyMembers: Record<string, Token>
}

export type WritableTokenIndex<
	Token extends
		| AtomToken<unknown>
		| ReadonlySelectorToken<unknown>
		| WritableSelectorToken<unknown>,
> = Record<string, FamilyNode<Token> | Token>
