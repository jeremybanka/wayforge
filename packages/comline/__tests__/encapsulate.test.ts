import { encapsulate } from "../src/cli"

const originalStdout = process.stdout.write
const originalStderr = process.stderr.write
const originalConsole = { ...console }

afterEach(() => {
	process.stdout.write = originalStdout
	process.stderr.write = originalStderr
	Object.assign(console, originalConsole)
})

function expectOutputsRestored() {
	expect(process.stdout.write).toBe(originalStdout)
	expect(process.stderr.write).toBe(originalStderr)
	expect(console.log).toBe(originalConsole.log)
	expect(console.error).toBe(originalConsole.error)
}

describe(`encapsulate`, () => {
	it(`captures output and console arguments while preserving the return value`, () => {
		const value = { success: true }
		const result = encapsulate(() => {
			process.stdout.write(`first`)
			process.stdout.write(`second\n`)
			process.stderr.write(`warning\n`)
			console.log(`result`, value)
			console.error(`failure`, 42)
			return value
		})

		expect(result.returnValue).toBe(value)
		expect(result.capturedStdout).toEqual([`first`, `second\n`])
		expect(result.capturedStderr).toEqual([`warning\n`])
		expect(result.mockConsoleCalls.log).toEqual([[`result`, value]])
		expect(result.mockConsoleCalls.error).toEqual([[`failure`, 42]])
		expectOutputsRestored()
	})

	it(`keeps capturing across an await and restores output after fulfillment`, async () => {
		const value = { success: true }
		const result = await encapsulate(async () => {
			process.stdout.write(`before`)
			await Promise.resolve()
			process.stdout.write(`after`)
			process.stderr.write(`async warning`)
			console.log(value)
			return value
		})

		expect(result.returnValue).toBe(value)
		expect(result.capturedStdout).toEqual([`before`, `after`])
		expect(result.capturedStderr).toEqual([`async warning`])
		expect(result.mockConsoleCalls.log).toEqual([[value]])
		expectOutputsRestored()
	})

	it.each([`stdout`, `stderr`, `console`] as const)(
		`captures only the selected %s channel and restores an enclosing capture`,
		(channel) => {
			const outer = encapsulate(() => {
				const inner = encapsulate(
					() => {
						process.stdout.write(`inner stdout`)
						process.stderr.write(`inner stderr`)
						console.log(`inner console`)
					},
					{ [channel]: true },
				)
				process.stdout.write(`outer stdout`)
				process.stderr.write(`outer stderr`)
				console.log(`outer console`)
				return inner
			})

			expect(outer.returnValue.capturedStdout).toEqual(
				channel === `stdout` ? [`inner stdout`] : [],
			)
			expect(outer.returnValue.capturedStderr).toEqual(
				channel === `stderr` ? [`inner stderr`] : [],
			)
			expect(outer.returnValue.mockConsoleCalls.log).toEqual(
				channel === `console` ? [[`inner console`]] : undefined,
			)
			expect(outer.capturedStdout).toEqual(
				channel === `stdout`
					? [`outer stdout`]
					: [`inner stdout`, `outer stdout`],
			)
			expect(outer.capturedStderr).toEqual(
				channel === `stderr`
					? [`outer stderr`]
					: [`inner stderr`, `outer stderr`],
			)
			expect(outer.mockConsoleCalls.log).toEqual(
				channel === `console`
					? [[`outer console`]]
					: [[`inner console`], [`outer console`]],
			)
			expectOutputsRestored()
		},
	)

	it(`decodes byte writes and calls both supported callback forms`, () => {
		const callback = vi.fn()
		const encodedCallback = vi.fn()
		const result = encapsulate(() => {
			expect(process.stdout.write(Buffer.from(`héllo`), callback)).toBe(true)
			expect(
				process.stderr.write(
					new Uint8Array([0xab, 0xcd]),
					`hex`,
					encodedCallback,
				),
			).toBe(true)
		})

		expect(result.capturedStdout).toEqual([`héllo`])
		expect(result.capturedStderr).toEqual([`abcd`])
		expect(callback).toHaveBeenCalledExactlyOnceWith(undefined)
		expect(encodedCallback).toHaveBeenCalledExactlyOnceWith(undefined)
	})

	it.each([false, true])(
		`restores output when the callback fails (async: %s)`,
		async (async) => {
			const reason = new Error(`callback failed`)
			const fail = () => {
				process.stdout.write(`before failure`)
				process.stderr.write(`before failure`)
				console.error(`before failure`)
				throw reason
			}

			if (async) {
				await expect(
					encapsulate(async () => {
						await Promise.resolve()
						fail()
					}),
				).rejects.toBe(reason)
			} else {
				let thrown: unknown
				try {
					encapsulate(fail)
				} catch (error) {
					thrown = error
				}
				expect(thrown).toBe(reason)
			}
			expectOutputsRestored()
		},
	)
})
