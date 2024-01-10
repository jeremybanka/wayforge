import type {
	ReadonlySelectorToken,
	RegularAtomToken,
	WritableSelectorToken,
} from "atom.io"

export * from "./attach-introspection-states"

export type FamilyNode<
	Token extends
		| ReadonlySelectorToken<unknown>
		| RegularAtomToken<unknown>
		| WritableSelectorToken<unknown>,
> = {
	key: string
	familyMembers: Record<string, Token>
}

export type WritableTokenIndex<
	Token extends
		| ReadonlySelectorToken<unknown>
		| RegularAtomToken<unknown>
		| WritableSelectorToken<unknown>,
> = Record<string, FamilyNode<Token> | Token>
