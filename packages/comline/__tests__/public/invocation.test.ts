import { required } from "treetrunks"

import { cli } from "../../src/cli"
import { inputValues } from "../fixtures/contract-values"
import {
	createInvocationCli,
	invocationPrefixes,
} from "../fixtures/invocation-cases"

const command = createInvocationCli()

test.each(invocationPrefixes)(
	`parses a supplied argv without inspecting invocation names: %j`,
	(...prefix) => {
		const argv = Object.freeze([...prefix, `run`, `--name=probe`, `--`])
		expect(inputValues(command(argv).inputs)).toEqual(
			inputValues({
				case: `run`,
				path: [`run`],
				opts: { name: `probe` },
			}),
		)
	},
)

test(`the supplied argv determines the parse scope`, () => {
	const previous = process.argv
	process.argv = [`ambient-runtime`, `ambient-script`, `unrelated`]
	try {
		expect(
			inputValues(
				command([`runtime`, `script`, `run`, `--name=explicit`]).inputs,
			),
		).toEqual(
			inputValues({
				case: `run`,
				path: [`run`],
				opts: { name: `explicit` },
			}),
		)
	} finally {
		process.argv = previous
	}
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
	},
)
