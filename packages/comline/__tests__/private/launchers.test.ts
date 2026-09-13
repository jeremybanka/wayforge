import { launchers, run } from "../fixtures/launchers"

test.each(launchers)(
	`parses full process.argv through $command`,
	({ command, positionalOnly }) => {
		const [executable, ...args] = command
		const result = JSON.parse(run(executable, [...args, `foo`]))
		expect(result.argv.slice(2)).toEqual(
			positionalOnly ? [`--`, `foo`] : [`foo`],
		)
		expect(result.inputs).toEqual({ case: `foo`, path: [`foo`], opts: {} })
	},
)

test.each(launchers)(
	`preserves the delimiter delivered through $command`,
	({ command, positionalOnly }) => {
		const [executable, ...args] = command
		const result = JSON.parse(run(executable, [...args, `foo`, `--name=main`]))
		expect(result.inputs).toEqual(
			positionalOnly
				? { case: `foo/$value`, path: [`foo`, `--name=main`], opts: {} }
				: { case: `foo`, path: [`foo`], opts: { name: `main` } },
		)
	},
)
