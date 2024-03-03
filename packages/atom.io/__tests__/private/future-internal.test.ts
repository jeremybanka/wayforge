import {
	Future,
	IMPLICIT,
	Subject,
	cacheValue,
	evictCachedValue,
} from "atom.io/internal"
import { vitest } from "vitest"

import type { StateUpdate } from "../../src"
import * as Utils from "../__util__"

beforeEach(() => {
	vitest.spyOn(Utils, `stdout`)
})

describe(`Future`, () => {
	it(`is a cancellable promise`, async () => {
		const future = new Future<number>((resolve) =>
			setImmediate(() => resolve(1)),
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
		let caught: unknown = null
		try {
			const promise = new Promise<number>((resolve) =>
				setImmediate(() => resolve(1)),
			)
			const future = new Future<number>(promise)
			future.cancel()
			await future.then(Utils.stdout)
		} catch (thrown) {
			caught = thrown
		} finally {
			expect(caught).toBeDefined()
			expect(Utils.stdout).not.toHaveBeenCalled()
		}
	})

	it(`is used in cacheValue`, async () => {
		const subject = new Subject<StateUpdate<number>>()
		subject.subscribe(`example-watcher`, Utils.stdout)
		const promise = new Promise<number>((resolve) =>
			setImmediate(() => resolve(1)),
		)
		cacheValue(`a`, promise, subject, IMPLICIT.STORE)
		evictCachedValue(`a`, IMPLICIT.STORE)
		await promise
		expect(Utils.stdout).not.toHaveBeenCalled()
	})
})

test(`when a future is cancelled during promise resolution, future still rejects`, async () => {
	let future: Future<number> | null = null
	const promise = new Promise<number>((resolve) =>
		setImmediate(() => {
			if (future) {
				future.cancel()
			}
			resolve(1)
		}),
	)
	future = new Future<number>(promise)
	let reason: unknown = null
	try {
		const number = await future.then((value) => Utils.stdout(value))
		console.log(number)
	} catch (thrown) {
		reason = thrown
	} finally {
		expect(reason).toBe(`canceled`)
		expect(Utils.stdout).not.toHaveBeenCalled()
	}
})
test(`when a future is created with a resolved promise, it can still be cancelled`, async () => {
	try {
		const promise = new Promise<number>((resolve) =>
			setImmediate(() => resolve(1)),
		)
		await promise
		const future = new Future<number>(promise)
		future.cancel()
		await future.then(Utils.stdout)
	} catch (thrown) {
		console.log(thrown)
	} finally {
		expect(Utils.stdout).not.toHaveBeenCalled()
	}
})
