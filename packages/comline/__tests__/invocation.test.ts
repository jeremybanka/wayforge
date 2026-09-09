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
	[`/home/probe/.bun/bin/bun`, `/work/probe.ts`],
	[`C:\\probe-tools\\node.exe`, `C:\\work\\probe.x.ts`],
])(`does not mistake a runtime path for the CLI: %j`, (...invocation) => {
	expect(command([...invocation, `--`, `run`]).inputs.path).toEqual([`run`])
	expect(command([...invocation, `run`, `--`]).inputs.path).toEqual([`run`])
})

test.each([
	[`/usr/bin/node`, `/work/probe.x.ts`],
	[`/usr/bin/bun`, `/work/probe.ts`],
	[`/work/probe.x.ts`],
	[`/usr/local/bin/probe`],
	[`C:\\tools\\probe.exe`],
	[`probe`],
])(`preserves script and executable invocation forms: %j`, (...invocation) => {
	expect(command([...invocation, `run`]).inputs.path).toEqual([`run`])
	expect(command([...invocation, `run`, `--`]).inputs.path).toEqual([`run`])
})

test(`an option value containing the CLI name is not an invocation`, () => {
	expect(command([`--name`, `probe`, `--`, `run`]).inputs).toEqual({
		case: `run`,
		path: [`run`],
		opts: { name: `probe` },
	})
})
