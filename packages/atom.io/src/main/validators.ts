import type {
	MutableAtomFamilyToken,
	MutableAtomToken,
	ReadableFamilyToken,
	ReadableToken,
	ReadonlyPureSelectorFamilyToken,
	ReadonlyPureSelectorToken,
	RegularAtomFamilyToken,
	RegularAtomToken,
	TransactionToken,
	WritableFamilyToken,
	WritablePureSelectorFamilyToken,
	WritablePureSelectorToken,
	WritableToken,
} from "./tokens"

export type TokenType<
	Comparison extends
		| ReadableFamilyToken<any, any, any>
		| ReadableToken<any, any, any>
		| TransactionToken<any>,
> =
	Comparison extends ReadableToken<infer RepresentedValue>
		? RepresentedValue
		: Comparison extends ReadableFamilyToken<infer RepresentedValue, any>
			? RepresentedValue
			: Comparison extends TransactionToken<infer Fn>
				? Fn
				: never

export function isToken<KnownToken extends RegularAtomToken<any, any, any>>(
	knownToken: KnownToken,
	unknownToken: ReadableToken<any, any, any>,
): unknownToken is RegularAtomToken<TokenType<KnownToken>>
export function isToken<KnownToken extends MutableAtomToken<any, any>>(
	knownToken: KnownToken,
	unknownToken: ReadableToken<any>,
): unknownToken is MutableAtomToken<TokenType<KnownToken>, any>
export function isToken<KnownToken extends WritablePureSelectorToken<any>>(
	knownToken: KnownToken,
	unknownToken: ReadableToken<any>,
): unknownToken is WritablePureSelectorToken<TokenType<KnownToken>>
export function isToken<KnownToken extends ReadonlyPureSelectorToken<any>>(
	knownToken: KnownToken,
	unknownToken: ReadableToken<any>,
): unknownToken is ReadonlyPureSelectorToken<TokenType<KnownToken>>
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
export function belongsTo<Family extends MutableAtomFamilyToken<any, any>>(
	family: Family,
	unknownToken: ReadableToken<any>,
): unknownToken is MutableAtomToken<TokenType<Family>, any>
export function belongsTo<
	Family extends WritablePureSelectorFamilyToken<any, any>,
>(
	family: Family,
	unknownToken: ReadableToken<any>,
): unknownToken is WritablePureSelectorToken<TokenType<Family>>
export function belongsTo<
	Family extends ReadonlyPureSelectorFamilyToken<any, any>,
>(
	family: Family,
	unknownToken: ReadableToken<any>,
): unknownToken is ReadonlyPureSelectorToken<TokenType<Family>>
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
