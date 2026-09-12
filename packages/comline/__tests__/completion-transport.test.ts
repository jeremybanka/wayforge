import { z } from "zod"

import { cli, noOptions, optional, options, required } from "../src/cli"
import {
	completionResponse,
	completionScript,
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

test(`command names cannot inject code into scripts`, () => {
	expect(() => completionScript(`cli; touch bad`, `bash`)).toThrow(/name/i)
})

test.each([`bash`, `zsh`, `fish`, `nushell`, `carapace`] as const)(
	`%s output is a standalone file without setup delimiters`,
	(shell) => {
		const script = completionScript(`my-cli`, shell)
		expect(script).not.toContain(`# >>>`)
		if (shell === `zsh`)
			expect(script.startsWith(`#compdef my-cli\n`)).toBe(true)
	},
)

test.each([
	{ choices: [{ value: `main`, appendSpace: true }], directive: 4 },
	{
		choices: [{ value: `main`, appendSpace: true }, { value: `master` }],
		directive: 6,
	},
	{
		choices: [
			{ value: `main`, appendSpace: true },
			{ value: `bad\nvalue`, appendSpace: false },
		],
		directive: 4,
	},
	{ choices: [], directive: 2, fileSystem: `files` as const },
])(
	`Cobra spacing uses emitted candidates and filesystem defaults: $directive`,
	async ({ choices, directive, fileSystem }) => {
		const response = await completionResponse(
			{
				cliName: `probe`,
				routeOptions: {
					"": options(``, z.object({ ref: z.string().optional() }), {
						ref: {
							description: ``,
							example: ``,
							required: false,
							completion: {
								appendSpace: false,
								choices,
								...(fileSystem ? { fileSystem } : {}),
							},
						},
					}),
				},
			},
			argv(`__complete`, `--ref`, ``),
		)
		expect(response?.split(`\n`).at(-2)).toBe(`:${directive}`)
	},
)

test.each([
	{ words: [`--ref=--key=val`], prefix: `--ref=` },
	{ words: [`--ref`, `--key=val`], prefix: `` },
	{ words: [`--`, `--key=val`], prefix: `` },
])(
	`owned shell responses carry the engine replacement prefix: $words`,
	async ({ words, prefix }) => {
		const group = options(``, z.object({ ref: z.string().optional() }), {
			ref: {
				description: ``,
				example: ``,
				required: false,
				completion: { choices: [`--key=value`] },
			},
		})
		const response = await completionResponse(
			{
				cliName: `probe`,
				routes: optional({ $value: null }),
				routeOptions: { "": group, $value: group },
				positionalCompletions: { $value: { choices: [`--key=value`] } },
			},
			argv(`_comline`, `complete`, ...words),
		)
		expect(response).toBe(`prefix:${prefix}\n--key=value\n:4\n`)
	},
)

test.each([
	{ words: [`co`], values: [`completion`] },
	{
		words: [`completion`, ``],
		values: [`install`, `bash`, `zsh`, `fish`, `nushell`, `carapace`],
	},
	{ words: [`completion`, `install`, `b`], values: [`bash`] },
	{ words: [`completion`, `nu`], values: [`nushell`] },
	{ words: [`completion`, `install`, `unknown`], values: [] },
	{ words: [`completion`, `bash`, ``], values: [] },
])(
	`completion management has its own opt-in grammar: $words`,
	async ({ words, values }) => {
		const response = await completionResponse(
			definition,
			argv(`__completeNoDesc`, ...words),
		)
		expect(response!.trimEnd().split(`\n`).slice(0, -1)).toEqual(values)
	},
)
