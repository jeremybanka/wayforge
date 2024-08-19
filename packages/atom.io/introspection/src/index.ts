import type { ReadableToken } from "atom.io"

export * from "./attach-introspection-states"
export * from "./auditor"
export * from "./differ"
export * from "./refinery"

export type FamilyNode<Token extends ReadableToken<unknown>> = {
	key: string
	familyMembers: Map<string, Token>
}

export type WritableTokenIndex<Token extends ReadableToken<unknown>> = Map<
	string,
	FamilyNode<Token> | Token
>
