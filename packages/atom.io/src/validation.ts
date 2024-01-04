import type { ReadableFamily, ReadableToken } from "atom.io"

export type TokenType<
	Comparison extends ReadableFamily<any, any> | ReadableToken<any>,
> = Comparison extends ReadableToken<infer RepresentedValue>
	? RepresentedValue
	: Comparison extends ReadableFamily<infer RepresentedValue, any>
	  ? RepresentedValue
	  : never

export function isToken<KnownToken extends ReadableToken<any>>(
	knownToken: KnownToken,
	unknownToken: ReadableToken<unknown>,
): unknownToken is ReadableToken<TokenType<KnownToken>> {
	return knownToken.key === unknownToken.key
}

export function belongsToFamily<Family extends ReadableFamily<any, any>>(
	family: Family,
	unknownToken: ReadableToken<unknown>,
): unknownToken is ReadableToken<TokenType<Family>> {
	return family.key === unknownToken.family?.key
}
