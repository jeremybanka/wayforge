import z from "zod"

import {
	cli,
	noOptions,
	optional,
	options,
	parseBooleanOption,
	required,
} from "../../src/cli"

export function createVariadicCli() {
	const pathOptions = options(
		`Promote one or more files`,
		z.object({ label: z.string().optional(), force: z.boolean().optional() }),
		{
			label: {
				description: `Label`,
				example: `--label=docs`,
				flag: `l`,
				aliases: [`tag`],
				required: false,
			},
			force: {
				description: `Force`,
				example: `--force`,
				flag: `f`,
				parse: parseBooleanOption,
				required: false,
			},
		},
	)
	return cli({
		cliName: `agents`,
		routes: optional({
			add: required({ "$...paths": null }),
			remove: optional({ "$...paths": null }),
			project: required({
				$name: required({ add: required({ "$...paths": null }) }),
			}),
			show: required({ $name: null }),
			version: null,
		}),
		routeOptions: {
			"": noOptions(`Choose an action`),
			"add/$...paths": pathOptions,
			remove: noOptions(`Choose files interactively`),
			"remove/$...paths": noOptions(`Remove files`),
			"project/$name/add/$...paths": pathOptions,
			"show/$name": noOptions(`Show a file`),
			version: noOptions(`Show version`),
		},
	})
}
