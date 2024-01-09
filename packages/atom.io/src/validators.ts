import type {
	AtomFamily,
	AtomToken,
	ReadableFamily,
	ReadableToken,
	ReadonlySelectorFamily,
	ReadonlySelectorToken,
	SelectorFamily,
	WritableFamily,
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

export function isToken<KnownToken extends AtomToken<any>>(
	knownToken: KnownToken,
	unknownToken: ReadableToken<unknown>,
): unknownToken is AtomToken<TokenType<KnownToken>>
export function isToken<KnownToken extends WritableSelectorToken<any>>(
	knownToken: KnownToken,
	unknownToken: ReadableToken<unknown>,
): unknownToken is WritableSelectorToken<TokenType<KnownToken>>
export function isToken<KnownToken extends ReadonlySelectorToken<any>>(
	knownToken: KnownToken,
	unknownToken: ReadableToken<unknown>,
): unknownToken is ReadonlySelectorToken<TokenType<KnownToken>>
export function isToken<KnownToken extends WritableToken<any>>(
	knownToken: KnownToken,
	unknownToken: ReadableToken<unknown>,
): unknownToken is WritableToken<TokenType<KnownToken>>
export function isToken<KnownToken extends WritableToken<any>>(
	knownToken: KnownToken,
	unknownToken: ReadableToken<unknown>,
): unknownToken is ReadableToken<TokenType<KnownToken>>
export function isToken<KnownToken extends ReadableToken<any>>(
	knownToken: KnownToken,
	unknownToken: ReadableToken<unknown>,
): unknownToken is ReadableToken<TokenType<KnownToken>> {
	return knownToken.key === unknownToken.key
}

export function belongsTo<Family extends AtomFamily<any, any>>(
	family: Family,
	unknownToken: ReadableToken<unknown>,
): unknownToken is AtomToken<TokenType<Family>>
export function belongsTo<Family extends SelectorFamily<any, any>>(
	family: Family,
	unknownToken: ReadableToken<unknown>,
): unknownToken is WritableSelectorToken<TokenType<Family>>
export function belongsTo<Family extends ReadonlySelectorFamily<any, any>>(
	family: Family,
	unknownToken: ReadableToken<unknown>,
): unknownToken is ReadonlySelectorToken<TokenType<Family>>
export function belongsTo<Family extends WritableFamily<any, any>>(
	family: Family,
	unknownToken: ReadableToken<unknown>,
): unknownToken is WritableToken<TokenType<Family>>
export function belongsTo<Family extends ReadableFamily<any, any>>(
	family: Family,
	unknownToken: ReadableToken<unknown>,
): unknownToken is ReadableToken<TokenType<Family>>
export function belongsTo<Family extends ReadableFamily<any, any>>(
	family: Family,
	unknownToken: ReadableToken<unknown>,
): unknownToken is ReadableToken<TokenType<Family>> {
	return family.key === unknownToken.family?.key
}
