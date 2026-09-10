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

test(`explicit input contains command words only`, () => {
	expect(command([`run`, `--name`, `probe`]).inputs).toEqual({
		case: `run`,
		path: [`run`],
		opts: { name: `probe` },
	})
	expect(command([`run`, `--`]).inputs.path).toEqual([`run`])
})

test.each([
	[`/opt/probe-tools/bin/node`, `/work/probe.x.ts`],
	[`/home/probe/.bun/bin/bun`, `/work/entry.ts`],
	[`C:\\probe-tools\\custom-runtime.exe`, `C:\\work\\entry.js`],
	[`/package-manager/store/unknown-launcher`, `/project/.bin/renamed-command`],
])(
	`default input uses the runtime's argv boundary without inspecting names: %j`,
	(...prefix) => {
		const previous = process.argv
		process.argv = [...prefix, `run`, `--name=probe`, `--`]
		try {
			expect(command().inputs).toEqual({
				case: `run`,
				path: [`run`],
				opts: { name: `probe` },
			})
			expect(command(process.argv.slice(2)).inputs).toEqual(command().inputs)
		} finally {
			process.argv = previous
		}
	},
)

test(`callers adapt a different argv layout explicitly`, () => {
	const argv = [`/arbitrary/launcher`, `run`, `--name=custom`]
	expect(command(argv.slice(1)).inputs).toEqual({
		case: `run`,
		path: [`run`],
		opts: { name: `custom` },
	})
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
		expect(literal([value]).inputs.path).toEqual([value])
	},
)
