import { inputValues } from "../fixtures/contract-values"
import { launchers, run } from "../fixtures/launchers"

test.each(launchers)(
	`parses full process.argv through $command`,
	({ command }) => {
		const [executable, ...args] = command
		const result = JSON.parse(run(executable, [...args, `foo`]))

		expect(inputValues(result.inputs)).toEqual(
			inputValues({ case: `foo`, path: [`foo`], opts: {} }),
		)
	},
)

test.each(launchers)(
	`preserves the delimiter delivered through $command`,
	({ command, positionalOnly }) => {
		const [executable, ...args] = command
		const result = JSON.parse(run(executable, [...args, `foo`, `--name=main`]))
		expect(inputValues(result.inputs)).toEqual(
			inputValues(
				positionalOnly
					? { case: `foo/$value`, path: [`foo`, `--name=main`], opts: {} }
					: { case: `foo`, path: [`foo`], opts: { name: `main` } },
			),
		)
	},
)
