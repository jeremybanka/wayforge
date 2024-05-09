import { Future } from "atom.io/internal"
import { vitest } from "vitest"

import * as Utils from "../__util__"

beforeEach(() => {
	vitest.spyOn(Utils, `stdout`)
})

describe(`Future`, () => {
	it(`is a Promise whose fate can change`, async () => {
		const future = new Future<number>((resolve) => {
			resolve(1)
		})
		future.use(
			new Promise((resolve) => {
				resolve(2)
			}),
		)
		expect(await future.then((value) => value)).toBe(2)
	})
	it(`can be resolved to a value immediately`, async () => {
		const future = new Future<number>((resolve) => {
			resolve(1)
		})
		future.use(2)
		expect(await future.then((value) => value)).toBe(2)
	})
	it(`handles an initial executor that rejects`, async () => {
		const future = new Future<number>((_, reject) => {
			reject(new Error(`whoops`))
		})
		await expect(async () => future.then((value) => value)).rejects.toThrow(
			`whoops`,
		)
	})
	it(`handles an initial promise that rejects`, async () => {
		const future = new Future<number>(
			new Promise((_, reject) => {
				reject(new Error(`whoops`))
			}),
		)
		await expect(async () => future.then((value) => value)).rejects.toThrow(
			`whoops`,
		)
	})
	it(`handles a new use-Promise that rejects`, async () => {
		const future = new Future<number>((resolve) => {
			resolve(1)
		})
		future.use(
			new Promise((_, reject) => {
				reject(new Error(`whoops`))
			}),
		)
		await expect(async () => future.then((value) => value)).rejects.toThrow(
			`whoops`,
		)
	})
	it(`does not care about a previous rejection, after a new use-static`, async () => {
		const future = new Future<number>((resolve) => {
			resolve(1)
		})
		future.use(
			new Promise((_, reject) => {
				reject(new Error(`whoops`))
			}),
		)
		future.use(2)
		expect(await future.then((value) => value)).toBe(2)
	})
})
