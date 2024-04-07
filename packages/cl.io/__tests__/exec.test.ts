import { execSync } from "node:child_process"

// console.log(x)
describe(`exec`, () => {
	it(`should run a command`, () => {
		const script = `${import.meta.dirname}/fixtures/file-length.x.ts`
		const target = `${import.meta.dirname}/fixtures/example-file.md`
		const buffer = execSync(`bun ${script} --file="${target}"`)
		const output = buffer.toString()
		expect(Number(output)).toBe(36)
	})
})
