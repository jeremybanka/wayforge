import { encapsulate } from "../../src/cli"

const originalStdout = process.stdout.write
const originalStderr = process.stderr.write
const originalConsole = { ...console }

afterEach(() => {
	process.stdout.write = originalStdout
	process.stderr.write = originalStderr
	Object.assign(console, originalConsole)
})

describe(`encapsulate`, () => {
	it(`write replacements return true and invoke callbacks with one undefined argument`, () => {
		const callback = vi.fn()
		const encodedCallback = vi.fn()
		encapsulate(() => {
			expect(process.stdout.write(Buffer.from(`héllo`), callback)).toBe(true)
			expect(
				process.stderr.write(
					new Uint8Array([0xab, 0xcd]),
					`hex`,
					encodedCallback,
				),
			).toBe(true)
		})

		expect(callback).toHaveBeenCalledExactlyOnceWith(undefined)
		expect(encodedCallback).toHaveBeenCalledExactlyOnceWith(undefined)
	})
})
