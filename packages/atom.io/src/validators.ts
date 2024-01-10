import type {
	MutableAtomFamily,
	MutableAtomToken,
	ReadableFamily,
	ReadableToken,
	ReadonlySelectorFamily,
	ReadonlySelectorToken,
	RegularAtomFamily,
	RegularAtomToken,
	WritableFamily,
	WritableSelectorFamily,
	WritableSelectorToken,
	WritableToken,
} from "atom.io"

export type TokenType<
	Comparison extends ReadableFamily<any, any> | ReadableToken<any>,
> = Comparison extends ReadableToken<infer RepresentedValue>
	? RepresentedValue
	: Comparison extends ReadableFamily<infer RepresentedValue, any>
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

export function belongsTo<Family extends RegularAtomFamily<any, any>>(
	family: Family,
	unknownToken: ReadableToken<any>,
): unknownToken is RegularAtomToken<TokenType<Family>>
export function belongsTo<Family extends MutableAtomFamily<any, any, any>>(
	family: Family,
	unknownToken: ReadableToken<any>,
): unknownToken is MutableAtomToken<TokenType<Family>, any>
export function belongsTo<Family extends WritableSelectorFamily<any, any>>(
	family: Family,
	unknownToken: ReadableToken<any>,
): unknownToken is WritableSelectorToken<TokenType<Family>>
export function belongsTo<Family extends ReadonlySelectorFamily<any, any>>(
	family: Family,
	unknownToken: ReadableToken<any>,
): unknownToken is ReadonlySelectorToken<TokenType<Family>>
export function belongsTo<Family extends WritableFamily<any, any>>(
	family: Family,
	unknownToken: ReadableToken<any>,
): unknownToken is WritableToken<TokenType<Family>>
export function belongsTo<Family extends ReadableFamily<any, any>>(
	family: Family,
	unknownToken: ReadableToken<any>,
): unknownToken is ReadableToken<TokenType<Family>>
export function belongsTo<Family extends ReadableFamily<any, any>>(
	family: Family,
	unknownToken: ReadableToken<any>,
): unknownToken is ReadableToken<TokenType<Family>> {
	return family.key === unknownToken.family?.key
}
