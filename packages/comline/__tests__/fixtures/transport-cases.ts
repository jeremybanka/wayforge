import { noOptions, required } from "../../src/cli"

export function createTransportDefinition() {
	const definition = {
		cliName: `my-cli`,
		routes: required({ closed: null }),
		routeOptions: { closed: noOptions(`Closed pull requests`) },
	}
	return definition
}

export const managementCompletions = [
	{ words: [`co`], values: [`completion`] },
	{
		words: [`completion`, ``],
		values: [`install`, `bash`, `zsh`, `fish`, `nushell`, `carapace`],
	},
	{ words: [`completion`, `install`, `b`], values: [`bash`] },
	{ words: [`completion`, `nu`], values: [`nushell`] },
	{ words: [`completion`, `install`, `unknown`], values: [] },
	{ words: [`completion`, `bash`, ``], values: [] },
]
