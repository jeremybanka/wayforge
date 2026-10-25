import { execFileSync } from "node:child_process"
import { cpSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

let directory: string
let bundled: string
let compiled: string

beforeAll(() => {
	directory = mkdtempSync(path.join(tmpdir(), `comline-config-runtimes-`))
	bundled = path.join(directory, `cli.mjs`)
	compiled = path.join(directory, `cli`)
	const fixture = path.join(
		import.meta.dirname,
		`../fixtures/config-module.x.ts`,
	)
	for (const args of [
		[`--target=node`, `--outfile=${bundled}`],
		[`--compile`, `--outfile=${compiled}`],
	]) {
		execFileSync(`bun`, [`build`, fixture, ...args], {
			stdio: `pipe`,
			timeout: 30_000,
		})
	}
	for (const name of [`configs #`, `configs #?`]) {
		cpSync(
			path.join(import.meta.dirname, `../fixtures/async-config`),
			path.join(directory, name),
			{ recursive: true },
		)
	}
	writeFileSync(path.join(directory, `package.json`), `{"type":"module"}`)
	writeFileSync(
		path.join(directory, `helper.ts`),
		`export const greet = (name: string): string => "hello " + name`,
	)
	writeFileSync(
		path.join(directory, `config.ts`),
		`import { greet } from "./helper.ts"
export default { foo: greet("world") } satisfies { foo: string }`,
	)
}, 60_000)

afterAll(() => {
	if (directory) rmSync(directory, { recursive: true, force: true })
})

test.each([`node`, `bun`, `compiled`])(
	`loads an external TypeScript config in %s`,
	(runtime) => {
		const command = runtime === `compiled` ? compiled : runtime
		const prefix = runtime === `compiled` ? [] : [bundled]
		for (const args of [[], [`--foo=override`]]) {
			const output = execFileSync(command, [...prefix, ...args], {
				cwd: directory,
				encoding: `utf8`,
				stdio: [`ignore`, `pipe`, `pipe`],
				timeout: 30_000,
			})
			expect(JSON.parse(output)).toEqual({
				foo: args.length ? `override` : `hello world`,
			})
		}
	},
)

// Bun treats "?" in filesystem paths as a query even in encoded file URLs.
// Exercise "?" with Node; spaces and "#" are covered in every runtime.
describe.each([`node`, `bun`, `compiled`])(
	`%s async configuration`,
	(runtime) => {
		test.each([`sync`, `direct`, `transitive`])(
			`loads %s modules and preserves CLI overrides`,
			(fixture) => {
				const command = runtime === `compiled` ? compiled : runtime
				const prefix = runtime === `compiled` ? [] : [bundled]
				for (const args of [[], [`--foo=override`]]) {
					const output = execFileSync(command, [...prefix, ...args], {
						cwd: directory,
						encoding: `utf8`,
						timeout: 30_000,
						env: {
							...process.env,
							COMLINE_ASYNC: `1`,
							COMLINE_CONFIG_PATH: `${runtime === `node` ? `configs #?` : `configs #`}/${fixture}.mts`,
						},
					})
					expect(JSON.parse(output)).toEqual({
						foo: args.length ? `override` : `hello world`,
					})
				}
			},
		)
		test(`rejects Promise-valued exports without unwrapping them`, () => {
			const command = runtime === `compiled` ? compiled : runtime
			const prefix = runtime === `compiled` ? [] : [bundled]
			expect(() =>
				execFileSync(command, [...prefix, `--foo=override`], {
					cwd: directory,
					encoding: `utf8`,
					stdio: `pipe`,
					timeout: 30_000,
					env: {
						...process.env,
						COMLINE_ASYNC: `1`,
						COMLINE_CONFIG_PATH: `configs #/promise.mts`,
					},
				}),
			).toThrow(/failed validation/i)
		})

		test(`propagates initialization failure`, () => {
			const command = runtime === `compiled` ? compiled : runtime
			const prefix = runtime === `compiled` ? [] : [bundled]
			expect(() =>
				execFileSync(command, [...prefix, `--foo=override`], {
					cwd: directory,
					encoding: `utf8`,
					stdio: `pipe`,
					timeout: 30_000,
					env: {
						...process.env,
						COMLINE_ASYNC: `1`,
						COMLINE_CONFIG_PATH: `${runtime === `node` ? `configs #?` : `configs #`}/rejected.mts`,
					},
				}),
			).toThrow(/asynchronous config initialization failed/)
		})
	},
)
