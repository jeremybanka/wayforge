import { describe, expect } from "vitest"

import { Rational } from "../src/rational"

describe(`Rational`, () => {
	test(`addition and comparison`, () => {
		const a = new Rational(1n, 2n)
		const b = new Rational(1n, 3n)
		expect(a.isGreaterThan(b)).toBe(true)
		b.add(1n, 3n)
		expect(a.isGreaterThan(b)).toBe(false)
	})
	test(`subtraction and comparison`, () => {
		const a = new Rational(1n, 2n)
		const b = new Rational(1n, 3n)
		expect(a.isGreaterThan(b)).toBe(true)
		a.sub(1n, 3n)
		expect(a.isGreaterThan(b)).toBe(false)
	})
	test(`division`, () => {
		const a = new Rational(1n, 2n)
		const b = new Rational(1n, 3n)
		expect(a.div(...b.consolidate())).toStrictEqual(new Rational(3n, 2n))
	})
	test(`multiplication`, () => {
		const a = new Rational(1n, 2n)
		const b = new Rational(1n, 3n)
		expect(a.mul(...b.consolidate())).toStrictEqual(new Rational(1n, 6n))
	})
	test(`consolidation and simplification`, () => {
		const a = new Rational(1n, 2n)
		let denominator = 2n
		const inc = () => {
			denominator += 1n
			const result = a.add(1n, denominator).simplify()
			return result
		}
		expect(inc()).toStrictEqual([5n, 6n])
		expect(inc()).toStrictEqual([13n, 12n])
		expect(inc()).toStrictEqual([77n, 60n])
		expect(inc()).toStrictEqual([29n, 20n])
		expect(inc()).toStrictEqual([223n, 140n])
		expect(inc()).toStrictEqual([481n, 280n])
		expect(inc()).toStrictEqual([4609n, 2520n])
		expect(inc()).toStrictEqual([4861n, 2520n])
		expect(inc()).toStrictEqual([55991n, 27720n])
		expect(inc()).toStrictEqual([58301n, 27720n])
		expect(inc()).toStrictEqual([785633n, 360360n])
		expect(inc()).toStrictEqual([811373n, 360360n])
		expect(inc()).toStrictEqual([835397n, 360360n])
		expect(inc()).toStrictEqual([1715839n, 720720n])
		expect(inc()).toStrictEqual([29889983n, 12252240n])
		expect(inc()).toStrictEqual([10190221n, 4084080n])
	})
})
