import fs from "node:fs"
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { expect, test, vi } from "vitest"

import { Ferret, varmintWorkspaceManager } from "../src"

test(`Ferret replays records larger than a disk read without duplication`, async () => {
	const root = await mkdtemp(join(tmpdir(), `ferret-`))
	// Temporary fixtures must not be registered with global cleanup.
	const tracking = vi
		.spyOn(varmintWorkspaceManager.storage, `initialized`, `get`)
		.mockReturnValue(false)
	try {
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
	} finally {
		tracking.mockRestore()
		await rm(root, { recursive: true })
	}
})

test.each([`complete`, `cancel`, `failure`, `cleanup-failure`] as const)(
	`Ferret recording closes its producer and file on %s`,
	async (exit) => {
		const root = await mkdtemp(join(tmpdir(), `ferret-`))
		const tracking = vi
			.spyOn(varmintWorkspaceManager.storage, `initialized`, `get`)
			.mockReturnValue(false)
		const writers = vi.spyOn(fs.WriteStream.prototype, `end`)
		const disposed = vi.fn()
		try {
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
		} finally {
			writers.mockRestore()
			tracking.mockRestore()
			await rm(root, { recursive: true })
		}
	},
)
