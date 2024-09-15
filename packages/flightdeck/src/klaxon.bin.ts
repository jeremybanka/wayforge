#!/usr/bin/env -S node --experimental-strip-types

import { cli, required } from "comline"
import { z } from "zod"

import * as Klaxon from "./klaxon.lib"

const changesetsPublishedPackagesSchema: z.ZodSchema<Klaxon.ScrambleOptions> =
	z.object({
		packageConfig: z.record(z.string(), z.object({ endpoint: z.string() })),
		secretsConfig: z.record(z.string(), z.string()),
		publishedPackages: z.array(
			z.object({
				name: z.string(),
				version: z.string(),
			}),
		),
	})

const deploy = cli({
	cliName: `deploy`,
	routes: required({
		scramble: null,
	}),
	routeOptions: {
		scramble: {
			options: {
				packageConfig: {
					description: `Package name to { endpoint } mappings.`,
					example: `packageConfig="{\"@wayforge/flightdeck\":{\"endpoint\":\"https://flightdeck.wayforge.dev\"}}"`,
					flag: `c`,
					parse: JSON.parse,
					required: true,
				},
				secretsConfig: {
					description: `Package name to secret mappings.`,
					example: `secretsConfig="{\"@wayforge/flightdeck\":\"XXXX-XXXX-XXXX\"}"`,
					flag: `s`,
					parse: JSON.parse,
					required: true,
				},
				publishedPackages: {
					description: `The result of the "Publish" step in Changesets.`,
					example: `publishedPackages="[{\"name\":\"@wayforge/flightdeck\",\"version\":\"0.0.0\"}]"`,
					flag: `p`,
					parse: JSON.parse,
					required: true,
				},
			},
			optionsSchema: changesetsPublishedPackagesSchema,
		},
	},
})

const { inputs } = deploy(process.argv)
await Klaxon.scramble(inputs.opts).then((scrambleResult) => {
	console.log(scrambleResult)
})
