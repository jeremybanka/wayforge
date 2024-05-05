import type { ReadableToken } from "atom.io"

export * from "./attach-introspection-states"
export * from "./auditor"

export type FamilyNode<Token extends ReadableToken<unknown>> = {
	key: string
	familyMembers: Record<string, Token>
}

export type WritableTokenIndex<Token extends ReadableToken<unknown>> = Record<
	string,
	FamilyNode<Token> | Token
>
