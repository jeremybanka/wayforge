import { launchers, run } from "../fixtures/launchers"

test.each(launchers)(
	`$command delivers the exact launcher argv and input record`,
	({ command, positionalOnly }) => {
		const [executable, ...args] = command
		const result = JSON.parse(run(executable, [...args, `foo`]))
		expect(result.argv.slice(2)).toEqual(
			positionalOnly ? [`--`, `foo`] : [`foo`],
		)
		expect(result.inputs).toEqual({
			case: `foo`,
			path: [`foo`],
			params: {},
			opts: {},
		})
	},
)

test.each(launchers)(
	`$command produces the exact input record around its delimiter`,
	({ command, positionalOnly }) => {
		const [executable, ...args] = command
		const result = JSON.parse(run(executable, [...args, `foo`, `--name=main`]))
		expect(result.inputs).toEqual(
			positionalOnly
				? {
						case: `foo/$value`,
						path: [`foo`, `--name=main`],
						params: { value: `--name=main` },
						opts: {},
					}
				: { case: `foo`, path: [`foo`], params: {}, opts: { name: `main` } },
		)
	},
)
