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

test.each([`bash`, `zsh`, `fish`, `nushell`, `carapace`] as const)(
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
	expect(removeCompletionSetup(existing, `my-cli`, `bash`)).toBe(
		`before\nafter\n`,
	)
})

test(`Bash setup contains a readable loader instead of the adapter implementation`, () => {
	const expected = `# >>> my-cli completions >>>
if command -v my-cli >/dev/null 2>&1; then
    source <(my-cli completion bash)
fi
# <<< my-cli completions <<<
`
	expect(updateCompletionSetup(``, `my-cli`, `bash`)).toBe(expected)
	expect(updateCompletionSetup(expected, `my-cli`, `bash`)).toBe(expected)
	expect(removeCompletionSetup(expected, `my-cli`, `bash`)).toBe(``)
})

test(`setup refuses unmatched delimiters instead of deleting user configuration`, () => {
	expect(() =>
		updateCompletionSetup(
			`# >>> my-cli completions >>>\nuser code`,
			`my-cli`,
			`bash`,
		),
	).toThrow(/delimiter/i)
})

test(`setup leaves other command blocks alone`, () => {
	const other = completionScript(`other`, `bash`)
	expect(removeCompletionSetup(other, `my-cli`, `bash`)).toBe(other)
})

test(`Zsh's header stays with its block after a formatter inserts blank lines`, () => {
	const formatted = completionScript(`my-cli`, `zsh`).replace(
		`#compdef my-cli\n`,
		`  #compdef my-cli\n\n  \n`,
	)
	expect(removeCompletionSetup(formatted, `my-cli`, `zsh`)).toBe(``)
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
		removeCompletionSetup(`# <<< my-cli completions <<<\n`, `my-cli`, `bash`),
	).toThrow(/delimiter/i)
})

test(`setup rejects nested matching blocks`, () => {
	const block = completionScript(`my-cli`, `bash`)
	expect(() =>
		updateCompletionSetup(
			`# >>> my-cli completions >>>\n${block}`,
			`my-cli`,
			`bash`,
		),
	).toThrow(/delimiter/i)
})

test(`setup appends to a file without a final newline only once`, () => {
	const updated = updateCompletionSetup(
		`export MY_SETTING=yes`,
		`my-cli`,
		`bash`,
	)
	expect(updated.startsWith(`export MY_SETTING=yes\n# >>>`)).toBe(true)
	expect(updateCompletionSetup(updated, `my-cli`, `bash`)).toBe(updated)
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
