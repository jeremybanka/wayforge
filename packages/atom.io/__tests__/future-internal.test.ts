import {
	Future,
	IMPLICIT,
	Subject,
	cacheValue,
	evictCachedValue,
} from "atom.io/internal"
import { vitest } from "vitest"

import type { StateUpdate } from "../src"
import * as UTIL from "./__util__"

beforeEach(() => {
	vitest.spyOn(UTIL, `stdout`)
})

describe(`Future`, () => {
	it(`is a cancellable promise`, async () => {
		const future = new Future<number>((resolve) =>
			setTimeout(() => resolve(1), 100),
		)
		future.cancel()
		let reason: unknown = null
		try {
			const number = await future
			console.log(number)
		} catch (thrown) {
			reason = thrown
		} finally {
			expect(reason).toBe(`canceled`)
		}
	})
	it(`does not call "then" if canceled`, async () => {
		try {
			const promise = new Promise<number>((resolve) =>
				setTimeout(() => resolve(1), 100),
			)
			const future = new Future<number>(promise)
			future.cancel()
			await future.then(UTIL.stdout)
		} catch (thrown) {
			console.log(thrown)
		} finally {
			expect(UTIL.stdout).not.toHaveBeenCalled()
		}
	})
	it(`is used in cacheValue`, async () => {
		const subject = new Subject<StateUpdate<number>>()
		subject.subscribe(`example-watcher`, UTIL.stdout)
		const promise = new Promise<number>((resolve) =>
			setTimeout(() => resolve(1), 1000),
		)
		cacheValue(`a`, promise, subject, IMPLICIT.STORE)
		evictCachedValue(`a`)
		await promise
		expect(UTIL.stdout).not.toHaveBeenCalled()
	})
})
