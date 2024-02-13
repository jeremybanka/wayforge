import type {
	MutableAtomFamily,
	MutableAtomFamilyToken,
	MutableAtomToken,
	ReadableFamily,
	ReadableFamilyToken,
	ReadableToken,
	ReadonlySelectorFamily,
	ReadonlySelectorFamilyToken,
	ReadonlySelectorToken,
	RegularAtomFamily,
	RegularAtomFamilyToken,
	RegularAtomToken,
	WritableFamily,
	WritableFamilyToken,
	WritableSelectorFamily,
	WritableSelectorFamilyToken,
	WritableSelectorToken,
	WritableToken,
} from "atom.io"

export type TokenType<
	Comparison extends ReadableFamilyToken<any, any> | ReadableToken<any>,
> = Comparison extends ReadableToken<infer RepresentedValue>
	? RepresentedValue
	: Comparison extends ReadableFamilyToken<infer RepresentedValue, any>
	  ? RepresentedValue
	  : never

export function isToken<KnownToken extends RegularAtomToken<any>>(
	knownToken: KnownToken,
	unknownToken: ReadableToken<any>,
): unknownToken is RegularAtomToken<TokenType<KnownToken>>
export function isToken<KnownToken extends MutableAtomToken<any, any>>(
	knownToken: KnownToken,
	unknownToken: ReadableToken<any>,
): unknownToken is MutableAtomToken<TokenType<KnownToken>, any>
export function isToken<KnownToken extends WritableSelectorToken<any>>(
	knownToken: KnownToken,
	unknownToken: ReadableToken<any>,
): unknownToken is WritableSelectorToken<TokenType<KnownToken>>
export function isToken<KnownToken extends ReadonlySelectorToken<any>>(
	knownToken: KnownToken,
	unknownToken: ReadableToken<any>,
): unknownToken is ReadonlySelectorToken<TokenType<KnownToken>>
export function isToken<KnownToken extends WritableToken<any>>(
	knownToken: KnownToken,
	unknownToken: ReadableToken<any>,
): unknownToken is WritableToken<TokenType<KnownToken>>
export function isToken<KnownToken extends ReadableToken<any>>(
	knownToken: KnownToken,
	unknownToken: ReadableToken<any>,
): unknownToken is ReadableToken<TokenType<KnownToken>>
export function isToken<KnownToken extends ReadableToken<any>>(
	knownToken: KnownToken,
	unknownToken: ReadableToken<any>,
): unknownToken is ReadableToken<TokenType<KnownToken>> {
	return knownToken.key === unknownToken.key
}

export function belongsTo<Family extends RegularAtomFamilyToken<any, any>>(
	family: Family,
	unknownToken: ReadableToken<any>,
): unknownToken is RegularAtomToken<TokenType<Family>>
export function belongsTo<Family extends MutableAtomFamilyToken<any, any, any>>(
	family: Family,
	unknownToken: ReadableToken<any>,
): unknownToken is MutableAtomToken<TokenType<Family>, any>
export function belongsTo<Family extends WritableSelectorFamilyToken<any, any>>(
	family: Family,
	unknownToken: ReadableToken<any>,
): unknownToken is WritableSelectorToken<TokenType<Family>>
export function belongsTo<Family extends ReadonlySelectorFamilyToken<any, any>>(
	family: Family,
	unknownToken: ReadableToken<any>,
): unknownToken is ReadonlySelectorToken<TokenType<Family>>
export function belongsTo<Family extends WritableFamilyToken<any, any>>(
	family: Family,
	unknownToken: ReadableToken<any>,
): unknownToken is WritableToken<TokenType<Family>>
export function belongsTo<Family extends ReadableFamilyToken<any, any>>(
	family: Family,
	unknownToken: ReadableToken<any>,
): unknownToken is ReadableToken<TokenType<Family>>
export function belongsTo<Family extends ReadableFamilyToken<any, any>>(
	family: Family,
	unknownToken: ReadableToken<any>,
): unknownToken is ReadableToken<TokenType<Family>> {
	return family.key === unknownToken.family?.key
}
