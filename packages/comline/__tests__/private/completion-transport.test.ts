import {
	completionResponse,
	completionScript,
} from "../../src/completion-transport"
import { argv } from "../fixtures/argv"
import {
	createTransportDefinition,
	managementCompletions,
} from "../fixtures/transport-cases"

const definition = createTransportDefinition()

test.each([`bash`, `zsh`, `fish`, `nushell`, `carapace`] as const)(
	`the completion command returns exact %s generator bytes`,
	async (target) => {
		expect(
			await completionResponse(definition, argv(`completion`, target)),
		).toBe(completionScript(`my-cli`, target))
	},
)

test(`an invalid setup target uses the usage error wording`, async () => {
	await expect(
		completionResponse(definition, argv(`completion`, `unknown`)),
	).rejects.toThrow(/Usage/)
})

test(`an unsafe executable uses the command-name error wording`, () => {
	expect(() => completionScript(`cli; touch bad`, `bash`)).toThrow(/name/i)
})

test.each(managementCompletions)(
	`completion management orders its suggestions: $words`,
	async ({ words, values }) => {
		const response = await completionResponse(
			definition,
			argv(`__completeNoDesc`, ...words),
		)
		expect(response!.trimEnd().split(`\n`).slice(0, -1)).toEqual(values)
	},
)
