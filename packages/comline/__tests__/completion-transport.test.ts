import { cli, noOptions, required } from "../src/cli"
import {
	completionResponse,
	completionScript,
	removeCompletionSetup,
	updateCompletionSetup,
} from "../src/completion-transport"
import { argv } from "./fixtures/argv"

const definition = {
	cliName: `my-cli`,
	routes: required({ closed: null }),
	routeOptions: { closed: noOptions(`Closed pull requests`) },
}

test(`Cobra requests return descriptions and a final directive`, async () => {
	expect(await completionResponse(definition, argv(`__complete`, `cl`))).toBe(
		`closed\tClosed pull requests\n:4\n`,
	)
	expect(
		await completionResponse(definition, argv(`__completeNoDesc`, `cl`)),
	).toBe(`closed\n:4\n`)
})

test(`ordinary invocation is not intercepted`, async () => {
	expect(await completionResponse(definition, argv(`closed`))).toBeUndefined()
	expect(cli(definition)(argv(`closed`)).inputs.case).toBe(`closed`)
})

test(`the Carapace placeholder is excluded from completion words`, async () => {
	const response = await completionResponse(
		definition,
		argv(`_carapace`, `export`, ``, `cl`),
	)
	expect(JSON.parse(response!)).toMatchObject({
		values: [
			{
				value: `closed`,
				display: `closed`,
				description: `Closed pull requests`,
			},
		],
	})
})

test.each([`nushell`] as const)(
	`%s setup survives formatting, replaces duplicates, and preserves surrounding content`,
	(shell) => {
		const script = completionScript(`my-cli`, shell)
		const reindented = script
			.split(`\n`)
			.map((line) => `  \t${line}`)
			.join(`\r\n`)
		const existing = `# user config\r\n${reindented}\r\n# between\r\n${reindented}\r\n# after\r\n`
		const updated = updateCompletionSetup(existing, `my-cli`, shell)
		expect(updated.match(/>>> my-cli completions/g)).toHaveLength(1)
		expect(updated).toContain(`# user config\r\n`)
		expect(updated).toContain(`# between\r\n`)
		expect(updated).toContain(`# after\r\n`)
		expect(updateCompletionSetup(updated, `my-cli`, shell)).toBe(updated)
		const removed = removeCompletionSetup(updated, `my-cli`, shell)
		expect(removed).not.toContain(`my-cli completions`)
		expect(removed).toContain(`# between\r\n`)
	},
)

test(`setup matches delimiter whitespace without inspecting the block body`, () => {
	const existing = `before\n \t#  >>>   my-cli   completions   >>>\nanything here\n\t# <<< my-cli completions <<<\nafter\n`
	expect(removeCompletionSetup(existing, `my-cli`, `nushell`)).toBe(
		`before\nafter\n`,
	)
})

test(`setup refuses unmatched delimiters instead of deleting user configuration`, () => {
	expect(() =>
		updateCompletionSetup(
			`# >>> my-cli completions >>>\nuser code`,
			`my-cli`,
			`nushell`,
		),
	).toThrow(/delimiter/i)
})

test(`setup leaves other command blocks alone`, () => {
	const other = completionScript(`other`, `nushell`)
	expect(removeCompletionSetup(other, `my-cli`, `nushell`)).toBe(other)
})

test.each([`bash`, `zsh`, `fish`, `nushell`, `carapace`] as const)(
	`the public completion command generates %s setup`,
	async (target) => {
		expect(
			await completionResponse(definition, argv(`completion`, target)),
		).toBe(completionScript(`my-cli`, target))
	},
)

test(`invalid setup targets fail explicitly`, async () => {
	await expect(
		completionResponse(definition, argv(`completion`, `unknown`)),
	).rejects.toThrow(/Usage/)
})

test(`setup rejects a closing delimiter without an opening delimiter`, () => {
	expect(() =>
		removeCompletionSetup(`# <<< my-cli completions <<<\n`, `my-cli`, `nushell`),
	).toThrow(/delimiter/i)
})

test(`setup rejects nested matching blocks`, () => {
	const block = completionScript(`my-cli`, `nushell`)
	expect(() =>
		updateCompletionSetup(
			`# >>> my-cli completions >>>\n${block}`,
			`my-cli`,
			`nushell`,
		),
	).toThrow(/delimiter/i)
})

test(`setup appends to a file without a final newline only once`, () => {
	const updated = updateCompletionSetup(
		`export MY_SETTING=yes`,
		`my-cli`,
		`nushell`,
	)
	expect(updated.startsWith(`export MY_SETTING=yes\n# >>>`)).toBe(true)
	expect(updateCompletionSetup(updated, `my-cli`, `nushell`)).toBe(updated)
})

test(`Nushell normalizes quoted words before interpreting them`, async () => {
	const response = await completionResponse(
		definition,
		argv(`_comline`, `nushell`, `"cl"`),
	)
	expect(JSON.parse(response!)).toMatchObject([{ value: `closed ` }])
})

test(`invalid preceding routes use Cobra's error directive`, async () => {
	expect(
		await completionResponse(definition, argv(`__complete`, `missing`, ``)),
	).toBe(`:5\n`)
})

test(`command names cannot inject code into scripts or delimiters`, () => {
	expect(() => completionScript(`cli; touch bad`, `bash`)).toThrow(/name/i)
})

test.each([`bash`, `zsh`, `fish`, `carapace`] as const)(
	`%s output is a standalone file without setup delimiters`,
	(shell) => {
		const script = completionScript(`my-cli`, shell)
		expect(script).not.toContain(`# >>>`)
		if (shell === `zsh`)
			expect(script.startsWith(`#compdef my-cli\n`)).toBe(true)
	},
)
test.each([`bash`, `zsh`, `fish`] as const)(
	`%s profile injection is rejected`,
	(shell) => {
		expect(() =>
			Reflect.apply(updateCompletionSetup, undefined, [``, `my-cli`, shell]),
		).toThrow(/file installation/)
		expect(() =>
			Reflect.apply(removeCompletionSetup, undefined, [``, `my-cli`, shell]),
		).toThrow(/file installation/)
	},
)
