#!/usr/bin/env node

import { type } from "arktype"
import { cli, help, helpOption, noOptions, optional, options } from "comline"

import { varmintWorkspaceManager } from "./varmint-workspace-manager"

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
			track: noOptions(
				`start tracking your workspace; see what varmint-managed files are touched`,
			),
			clean: options(
				`clean all files that varmint has tracked`,
				type({ "ci-flag?": `string` }),
				{
					"ci-flag": {
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

const { inputs } = parse(process.argv)

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
