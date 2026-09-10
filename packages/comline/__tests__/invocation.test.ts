import { required } from "treetrunks"
import z from "zod"

import { cli, options } from "../src/cli"

const command = cli({
	cliName: `probe`,
	discoverConfigPath: () => undefined,
	routes: required({ run: null }),
	routeOptions: {
		run: options(`run`, z.object({ name: z.string().optional() }), {
			name: { description: `name`, example: ``, required: false },
		}),
	},
})

test.each([
	[`/opt/probe-tools/bin/node`, `/work/probe.x.ts`],
	[`/home/probe/.bun/bin/bun`, `/work/entry.ts`],
	[`C:\\probe-tools\\custom-runtime.exe`, `C:\\work\\entry.js`],
	[`/arbitrary/runtime`, `/global/bin/renamed-command`],
	[`--name=runtime`, `--name=entrypoint`],
])(
	`parses a supplied argv without inspecting invocation names: %j`,
	(...prefix) => {
		const argv = Object.freeze([...prefix, `run`, `--name=probe`, `--`])
		expect(command(argv).inputs).toEqual({
			case: `run`,
			path: [`run`],
			opts: { name: `probe` },
		})
	},
)

test(`the supplied argv determines the parse scope`, () => {
	const previous = process.argv
	process.argv = [`ambient-runtime`, `ambient-script`, `unrelated`]
	try {
		expect(
			command([`runtime`, `script`, `run`, `--name=explicit`]).inputs,
		).toEqual({
			case: `run`,
			path: [`run`],
			opts: { name: `explicit` },
		})
	} finally {
		process.argv = previous
	}
})

test(`command-word input is explicitly selected`, () => {
	const words = Object.freeze([`run`, `--name`, `probe`])
	expect(command(words, { from: `user` }).inputs).toEqual(
		command([`runtime`, `script`, ...words]).inputs,
	)
})

test.each([`probe`, `node`, `bun`, `probe.x.ts`, `C:\\tools\\probe.exe`])(
	`command words are never mistaken for invocation metadata: %s`,
	(value) => {
		const literal = cli({
			cliName: `probe`,
			discoverConfigPath: () => undefined,
			routes: required({ $value: null }),
			routeOptions: { $value: null },
		})
		expect(literal([`runtime`, `script`, value]).inputs.path).toEqual([value])
		expect(literal([value], { from: `user` }).inputs.path).toEqual([value])
	},
)
