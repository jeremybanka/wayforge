#!/usr/bin/env node

import { type } from "arktype"
import {
	cli,
	completionResponse,
	help,
	helpOption,
	logWarnings,
	optional,
	options,
} from "comline"

const parse = cli(
	{
		cliName: `varmint`,
		routes: optional({
			"": null,
			track: null,
			clean: null,
		}),
		routeOptions: {
			"": helpOption(),
			track: helpOption(
				`start tracking your workspace; see what varmint-managed files are touched`,
			),
			clean: options(
				`clean all files that varmint has tracked`,
				type({ "ci-flag?": `string`, "help?": `boolean` }),
				{
					...helpOption().optionConfigs,
					"ci-flag": {
						completion: { repeatable: false, choices: [`CI`] },
						flag: `c`,
						required: false,
						description: `Flag that, if present, indicates that the command is running in a CI environment`,
						example: `--ci-flag=CI`,
					},
				},
			),
		},
	},
	console,
)

async function main(): Promise<void> {
	const completion = await completionResponse(parse.definition, process.argv)
	if (completion !== undefined) {
		process.stdout.write(completion)
		return
	}

	const { varmintWorkspaceManager } = await import(`./varmint-workspace-manager`)

	const { inputs, warnings } = parse(process.argv)
	logWarnings(warnings)

	if (inputs.opts.help) {
		console.log(help(parse.definition))
		return
	}

	switch (inputs.case) {
		case ``:
			console.log(help(parse.definition))
			break
		case `track`: {
			varmintWorkspaceManager.startGlobalTracking()
			break
		}
		case `clean`: {
			{
				const ciFlag = inputs.opts[`ci-flag`]
				console.log(`ci flag detected`)
				if (ciFlag) {
					await varmintWorkspaceManager.prepareUploads(ciFlag)
				}
				varmintWorkspaceManager.endGlobalTrackingAndFlushUnusedFiles()
			}
			break
		}
	}
}

await main()
