import type { ReadableToken } from "atom.io"

export * from "./attach-introspection-states"
export * from "./auditor"
export * from "./differ"
export * from "./refinery"
export * from "./sprawl"

export type FamilyNode<Token extends ReadableToken<unknown, any, any>> = {
	key: string
	familyMembers: Map<string, Token>
}

export type ReadonlyTokenIndex<Token extends ReadableToken<unknown, any, any>> =
	ReadonlyMap<string, FamilyNode<Token> | Token>

export type WritableTokenIndex<Token extends ReadableToken<unknown, any, any>> =
	Map<string, FamilyNode<Token> | Token>
