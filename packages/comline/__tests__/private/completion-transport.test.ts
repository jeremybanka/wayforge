import { noOptions, required } from "../../src/cli"
import {
	completionResponse,
	completionScript,
} from "../../src/completion-transport"
import { argv } from "../fixtures/argv"

const definition = {
	cliName: `my-cli`,
	routes: required({ closed: null }),
	routeOptions: { closed: noOptions(`Closed pull requests`) },
}

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

test(`command names cannot inject code into scripts`, () => {
	expect(() => completionScript(`cli; touch bad`, `bash`)).toThrow(/name/i)
})

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
