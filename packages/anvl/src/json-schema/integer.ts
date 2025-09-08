export type IntegerBrand = { readonly integer: unique symbol /* virtual */ }
export type integer = IntegerBrand & number
export const isInteger = (input: unknown): input is integer =>
	Number.isInteger(input as number)

export const Int = (input: unknown): integer => {
	if (isInteger(input)) return input
	throw new IntegerParseError(input)
}

export class Fraction extends Number {
	public readonly numerator: integer
	public readonly denominator: integer

	public constructor(n: integer | number, d: integer | number) {
		super(n / d)
		if (d === 0) {
			throw new Error(`Denominator cannot be zero`)
		}
		this.numerator = Int(n)
		this.denominator = Int(d)
	}
	public readonly [Symbol.toPrimitive]: () => number = () =>
		this.numerator / this.denominator
}

export const Frac = (n: integer | number, d: integer | number): Fraction =>
	new Fraction(n, d)

export const isFraction = (input: unknown): input is Fraction =>
	input instanceof Fraction

export class IntegerParseError extends Error {
	public constructor(value: unknown) {
		super(`Could not parse integer from ${JSON.stringify(value)}`)
	}
}

export type IntegerParseResult =
	| {
			value: integer
			error: null
			round: null
			upper: null
			lower: null
			ratio: null
	  }
	| {
			value: null
			error: IntegerParseError
			round: integer
			upper: integer
			lower: integer
			ratio: Fraction | null
	  }

export function asNumber(input: Fraction | integer | number): number
export function asNumber(input: Fraction[] | integer[] | number[]): number[]
export function asNumber<
	R extends Record<
		PropertyKey,
		Fraction | Fraction[] | integer | integer[] | number[] | number
	>,
>(
	input: R,
): {
	[K in keyof R]: R[K] extends Fraction | integer | number ? number : number[]
}
export function asNumber(input: unknown): unknown {
	return input as any
}
