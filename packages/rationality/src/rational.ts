/**
 * A lossless number.
 */
export class Rational {
	protected fractionalValues = new Map<bigint, bigint>()

	protected simplifyParams(
		...params:
			| [numerator: bigint, denominator?: bigint | undefined]
			| [rational: Rational]
	):
		| { error: Error; numerator: bigint }
		| [numerator: bigint, denominator: bigint] {
		let numerator: bigint
		let denominator: bigint
		if (params[0] instanceof Rational) {
			;[numerator, denominator] = params[0].simplify()
		} else {
			;[numerator, denominator = 1n] = params
			if (denominator === 0n) {
				return {
					error: new Error(),
					numerator,
				}
			}
			if (denominator < 0n) {
				numerator = -numerator
				denominator = -denominator
			}
		}
		return [numerator, denominator]
	}

	public constructor(numerator?: bigint, denominator = 1n) {
		if (numerator && denominator) {
			this.add(numerator, denominator)
		}
	}

	public add(that: Rational): this
	public add(numerator: bigint, denominator: bigint): this
	public add(
		...params: [numerator: bigint, denominator?: bigint] | [rational: Rational]
	): this {
		if (typeof params[0] === `bigint`) {
			let [numerator, denominator = 1n] = params
			if (denominator === 0n) {
				console.error(
					`Attempted to add (${numerator} / ${denominator}) to a rational.`,
				)
				return this
			}
			if (denominator < 0n) {
				numerator = -numerator
				denominator = -denominator
			}
			let newNumerator = numerator
			const oldNumerator = this.fractionalValues.get(denominator)
			if (oldNumerator) {
				newNumerator = oldNumerator + numerator
			}
			this.fractionalValues.set(denominator, newNumerator)
		} else {
			for (const [denominator, numerator] of params[0].entries()) {
				this.add(numerator, denominator)
			}
		}
		return this
	}

	public sub(that: Rational): this
	public sub(numerator: bigint, denominator?: bigint): this
	public sub(
		...params:
			| [numerator: bigint, denominator?: bigint | undefined]
			| [rational: Rational]
	): this {
		if (typeof params[0] === `bigint`) {
			const [numerator, denominator = 1n] = params
			this.add(-numerator, denominator)
		} else {
			for (const [denominator, numerator] of params[0].entries()) {
				this.add(-numerator, denominator)
			}
		}
		return this
	}

	public mul(that: Rational): this
	public mul(otherNumerator: bigint, otherDenominator?: bigint): this
	public mul(
		...params:
			| [otherNumerator: bigint, otherDenominator?: bigint | undefined]
			| [rational: Rational]
	): this {
		const simplified = this.simplifyParams(...params)
		if (`error` in simplified) {
			simplified.error.message = `Attempted to multiply by (${simplified.numerator} / 0)`
			console.error(simplified.error)
			return this
		}
		const [otherNumerator, otherDenominator] = simplified
		const previousEntries = [...this.entries()]
		this.fractionalValues.clear()
		for (const [denominator, numerator] of previousEntries) {
			this.fractionalValues.set(
				denominator * otherDenominator,
				numerator * otherNumerator,
			)
		}
		return this
	}

	public div(that: Rational): this
	public div(otherNumerator: bigint, otherDenominator?: bigint): this
	public div(
		...params:
			| [otherNumerator: bigint, otherDenominator?: bigint | undefined]
			| [rational: Rational]
	): this {
		const simplified = this.simplifyParams(...params)
		if (`error` in simplified) {
			simplified.error.message = `Attempted to divide by (${simplified.numerator} / 0)`
			console.error(simplified.error)
			return this
		}
		const [otherNumerator, otherDenominator] = simplified
		this.mul(otherDenominator, otherNumerator)
		return this
	}

	public entries(): IterableIterator<[bigint, bigint]> {
		return this.fractionalValues.entries()
	}

	public consolidate(): [numerator: bigint, denominator: bigint] {
		let commonFactors = new PrimeFactors()
		for (const entry of this.entries()) {
			for (const member of entry) {
				if (member !== 0n && member !== 1n) {
					commonFactors = commonFactors.and(member)
				}
			}
		}
		const condensedDenominator = commonFactors.compute()
		let condensedNumerator = 0n
		for (const [denominator, numerator] of this.fractionalValues.entries()) {
			condensedNumerator += (numerator * condensedDenominator) / denominator
		}
		if (condensedDenominator < 0n) {
			return [-condensedNumerator, -condensedDenominator]
		}
		return [condensedNumerator, condensedDenominator]
	}

	public simplify(): [numerator: bigint, denominator: bigint] {
		const [numerator, denominator] = this.consolidate()
		if (numerator === 0n) return [0n, 1n]
		const commonFactors = new PrimeFactors(denominator).and(numerator)
		const condensedDenominator = commonFactors.compute()
		return [condensedDenominator / denominator, condensedDenominator / numerator]
	}

	public isGreaterThan(that: Rational): boolean
	public isGreaterThan(numerator: bigint, denominator?: bigint): boolean
	public isGreaterThan(
		...params:
			| [numerator: bigint, denominator?: bigint | undefined]
			| [rational: Rational]
	): boolean {
		const a = this.simplify()
		const b = this.simplifyParams(...params)
		if (`error` in b) {
			b.error.message = `Attempted to compare (${b.numerator} / 0) to (${a[0]} / ${a[1]})`
			console.error(b.error)
			return false
		}
		return a[0] * b[1] > a[1] * b[0]
	}
}

export class PrimeFactors {
	private factors: Map<bigint, bigint>
	public constructor(n?: bigint) {
		this.factors = new Map<bigint, bigint>()
		if (n) {
			getPrimeFactors(n, this.factors)
		}
	}
	public and(n: bigint): this {
		const newFactors = getPrimeFactors(n)
		for (const [newFactor, newCount] of newFactors) {
			const existingFactorCount = this.factors.get(newFactor)
			if (!existingFactorCount || existingFactorCount < newCount) {
				this.factors.set(newFactor, newCount)
			}
		}
		return this
	}
	public compute(): bigint {
		let result = 1n
		for (const [factor, count] of this.factors) {
			result *= factor ** count
		}
		return result
	}
}

export function getPrimeFactors(
	n: bigint,
	factors = new Map<bigint, bigint>(),
): Map<bigint, bigint> {
	let i = 2n
	while (i <= n) {
		if (n % i === 0n) {
			const currentCount = factors.get(i) ?? 0n
			factors.set(i, currentCount + 1n)
			getPrimeFactors(n / i, factors)
			break
		}
		i += 1n
	}
	if (factors.size === 0) {
		factors.set(n, 1n)
	}
	return factors
}
