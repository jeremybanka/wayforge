import fs from "node:fs"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import { Ferret, varmintWorkspaceManager } from "../src"

describe(`Ferret streams`, () => {
	let root: string

	beforeEach(async () => {
		root = await mkdtemp(join(tmpdir(), `ferret-`))
		// Temporary fixtures must not be registered with global cleanup.
		vi.spyOn(
			varmintWorkspaceManager.storage,
			`initialized`,
			`get`,
		).mockReturnValue(false)
	})

	afterEach(async () => {
		vi.restoreAllMocks()
		await rm(root, { recursive: true })
	})

	test(`Ferret replays records larger than a disk read without duplication`, async () => {
		const values = [
			{ id: 1, bytes: `a`.repeat(100_000) },
			{ id: 2, bytes: `b`.repeat(100_000) },
			{ id: 3, bytes: `end` },
		]
		await mkdir(join(root, `large`))
		await writeFile(
			join(root, `large`, `read.input.json`),
			JSON.stringify([{ scenario: `large` }], null, `\t`),
		)
		await writeFile(
			join(root, `large`, `read.stream.txt`),
			values
				.map((value, index) => `${index}\t${JSON.stringify(value)}\n`)
				.join(``),
		)
		const producer = vi.fn(async function* (_input: { scenario: string }) {
			yield await Promise.resolve({ id: 0, bytes: `unexpected` })
		})
		const cache = new Ferret(`read`, root).add(`large`, producer)

		const received = []
		for await (const value of await cache.for(`read`).get({ scenario: `large` }))
			received.push(value)
		expect(received).toEqual(values)
		expect(producer).not.toHaveBeenCalled()
	})

	test.each([`complete`, `cancel`, `failure`, `cleanup-failure`] as const)(
		`Ferret recording closes its producer and file on %s`,
		async (exit) => {
			const writers = vi.spyOn(fs.WriteStream.prototype, `end`)
			const disposed = vi.fn()
			const producer = async function* () {
				try {
					yield await Promise.resolve({ id: 1 })
					if (exit === `failure`) throw new Error(`Producer failed`)
					yield { id: 2 }
				} finally {
					disposed()
					if (exit === `cleanup-failure`) throw new Error(`Cleanup failed`)
				}
			}
			const stream = await new Ferret(`write`, root)
				.add(`record`, producer)
				.for(exit)
				.get()
			const iterator = stream[Symbol.asyncIterator]()
			expect(await iterator.next()).toEqual({ done: false, value: { id: 1 } })
			if (exit === `cleanup-failure`)
				await expect(iterator.return?.()).rejects.toThrow(`Cleanup failed`)
			else if (exit === `cancel`) await iterator.return?.()
			else if (exit === `failure`)
				await expect(iterator.next()).rejects.toThrow(`Producer failed`)
			else {
				expect(await iterator.next()).toEqual({ done: false, value: { id: 2 } })
				expect((await iterator.next()).done).toBe(true)
			}
			expect(disposed).toHaveBeenCalledOnce()
			expect(writers).toHaveBeenCalledOnce()
			expect(writers.mock.contexts[0]).toMatchObject({ closed: true })
		},
	)

	test(`creates an empty fixture without consuming the producer`, async () => {
		const iterator = vi.fn(async function* () {
			yield await Promise.resolve({ id: 1 })
		})
		await new Ferret(`write`, root)
			.add(`unconsumed`, () => ({ [Symbol.asyncIterator]: iterator }))
			.for(`case`)
			.get()
		expect(iterator).not.toHaveBeenCalled()
		expect(
			await readFile(join(root, `unconsumed`, `case.stream.txt`), `utf8`),
		).toBe(``)
	})

	test(`records repeated traversal of a reusable iterable`, async () => {
		const writers = vi.spyOn(fs.WriteStream.prototype, `end`)
		const producer = vi.fn(() => ({
			async *[Symbol.asyncIterator]() {
				yield await Promise.resolve({ id: 1 })
				yield { id: 2 }
			},
		}))
		const stream = await new Ferret(`write`, root)
			.add(`repeat`, producer)
			.for(`case`)
			.get()
		for (let traversal = 0; traversal < 2; traversal++) {
			const received = []
			for await (const value of stream) received.push(value)
			expect(received).toEqual([{ id: 1 }, { id: 2 }])
		}
		expect(producer).toHaveBeenCalledOnce()
		expect(writers).toHaveBeenCalledTimes(2)
		for (const writer of writers.mock.contexts)
			expect(writer).toMatchObject({ closed: true })
		const recorded = await readFile(
			join(root, `repeat`, `case.stream.txt`),
			`utf8`,
		)
		expect(
			recorded
				.trim()
				.split(`\n`)
				.map((line) => JSON.parse(line.split(`\t`)[1])),
		).toEqual([{ id: 1 }, { id: 2 }, { id: 1 }, { id: 2 }])
	})

	test(`preserves a producer error when producer cleanup also fails`, async () => {
		const primary = new Error(`Producer failed`)
		const cleanup = vi.fn(() => Promise.reject(new Error(`Cleanup failed`)))
		const writers = vi.spyOn(fs.WriteStream.prototype, `end`)
		const stream = await new Ferret(`write`, root)
			.add(`failure`, () => ({
				[Symbol.asyncIterator]() {
					return {
						next: (): Promise<IteratorResult<never>> => Promise.reject(primary),
						return: cleanup,
					}
				},
			}))
			.for(`case`)
			.get()
		await expect(stream[Symbol.asyncIterator]().next()).rejects.toBe(primary)
		expect(cleanup).toHaveBeenCalledOnce()
		expect(writers).toHaveBeenCalledOnce()
		expect(writers.mock.contexts[0]).toMatchObject({ closed: true })
	})

	test(`preserves a recording error and closes its producer and file`, async () => {
		const primary = new Error(`Write failed`)
		const cleanup = vi.fn()
		const writers = vi.spyOn(fs.WriteStream.prototype, `end`)
		vi.spyOn(fs.WriteStream.prototype, `_write`).mockImplementation(
			(_chunk, _encoding, callback) => {
				callback(primary)
			},
		)
		const stream = await new Ferret(`write`, root)
			.add(`write-failure`, async function* () {
				try {
					yield await Promise.resolve({ id: 1 })
				} finally {
					cleanup()
				}
			})
			.for(`case`)
			.get()
		await expect(stream[Symbol.asyncIterator]().next()).rejects.toBe(primary)
		expect(cleanup).toHaveBeenCalledOnce()
		expect(writers).toHaveBeenCalledOnce()
		expect(writers.mock.contexts[0]).toMatchObject({ closed: true, fd: null })
	})

	test.each([`return`, `throw`] as const)(
		`%s cleans up before the first next call`,
		async (exit) => {
			const cleanup = vi.fn(() =>
				Promise.resolve({
					done: true as const,
					value: undefined,
				}),
			)
			const next = vi.fn(() =>
				Promise.resolve({
					done: false as const,
					value: { id: 1 },
				}),
			)
			const writers = vi.spyOn(fs.WriteStream.prototype, `end`)
			const stream = await new Ferret(`write`, root)
				.add(`cancel`, () => ({
					[Symbol.asyncIterator](): AsyncIterator<{ id: number }> {
						return { next, return: cleanup }
					},
				}))
				.for(`case`)
				.get()
			const iterator = stream[Symbol.asyncIterator]()
			if (exit === `throw`) {
				const error = new Error(`Consumer failed`)
				await expect(iterator.throw?.(error)).rejects.toBe(error)
			} else await iterator.return?.()
			await iterator.return?.()
			expect(next).not.toHaveBeenCalled()
			expect(cleanup).toHaveBeenCalledOnce()
			expect(writers).toHaveBeenCalledOnce()
			expect(writers.mock.contexts[0]).toMatchObject({ closed: true })
		},
	)

	test(`queues cancellation behind an in-flight next call`, async () => {
		const first = Promise.withResolvers<IteratorResult<{ id: number }>>()
		const next = vi.fn(() => first.promise)
		const cleanup = vi.fn(() =>
			Promise.resolve({
				done: true as const,
				value: undefined,
			}),
		)
		const stream = await new Ferret(`write`, root)
			.add(`pending`, () => ({
				[Symbol.asyncIterator]() {
					return { next, return: cleanup }
				},
			}))
			.for(`case`)
			.get()
		const iterator = stream[Symbol.asyncIterator]()
		const reading = iterator.next()
		const cancelling = iterator.return?.()
		await Promise.resolve()
		expect(next).toHaveBeenCalledOnce()
		expect(cleanup).not.toHaveBeenCalled()
		first.resolve({ done: false, value: { id: 1 } })
		expect(await reading).toEqual({ done: false, value: { id: 1 } })
		await cancelling
		expect(cleanup).toHaveBeenCalledOnce()
		expect(await iterator.next()).toEqual({ done: true, value: undefined })
	})

	test(`closes the recording when iterator construction fails`, async () => {
		const primary = new Error(`Iterator construction failed`)
		const factory = vi.fn((): AsyncIterator<never> => {
			throw primary
		})
		const writers = vi.spyOn(fs.WriteStream.prototype, `end`)
		const stream = await new Ferret(`write`, root)
			.add(`factory`, () => ({ [Symbol.asyncIterator]: factory }))
			.for(`case`)
			.get()
		await expect(stream[Symbol.asyncIterator]().next()).rejects.toBe(primary)
		expect(factory).toHaveBeenCalledOnce()
		expect(writers).toHaveBeenCalledOnce()
		expect(writers.mock.contexts[0]).toMatchObject({ closed: true })
	})
})
