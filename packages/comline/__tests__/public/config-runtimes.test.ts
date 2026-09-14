import { execFileSync } from "node:child_process"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
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
