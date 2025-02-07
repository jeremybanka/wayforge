#!/usr/bin/env node

import { cli, required } from "comline"
import { varmintWorkspaceManager } from "varmint"
import { z } from "zod"

const parse = cli({
	cliName: `varmint`,
	routes: required({
		track: null,
		clean: null,
	}),
	routeOptions: {
		track: { options: {}, optionsSchema: z.record(z.never()) },
		clean: {
			options: {
				"ci-flag": {
					flag: `c`,
					required: false,
					description: `Flag that, if present, indicates that the command is running in a CI environment`,
					example: `--ci-flag=CI`,
				},
			},
			optionsSchema: z.object({
				"ci-flag": z.string().optional(),
			}),
		},
	},
})

const { inputs } = parse(process.argv)

switch (inputs.case) {
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
