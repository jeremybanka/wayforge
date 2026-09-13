import {
	createInvocationCli,
	invocationPrefixes,
} from "../fixtures/invocation-cases"

const command = createInvocationCli()

test.each(invocationPrefixes)(
	`uses the exact input record for an explicit invocation prefix: %j`,
	(...prefix) => {
		const argv = Object.freeze([...prefix, `run`, `--name=probe`, `--`])
		expect(command(argv).inputs).toEqual({
			case: `run`,
			path: [`run`],
			opts: { name: `probe` },
		})
	},
)

test(`uses the exact input record when ambient argv differs`, () => {
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
