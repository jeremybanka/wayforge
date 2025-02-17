#!/usr/bin/env node

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

const klaxon = cli({
	cliName: `klaxon`,
	routes: required({
		scramble: null,
	}),
	routeOptions: {
		scramble: {
			options: {
				packageConfig: {
					description: `Maps the names of your packages to the endpoints that klaxon will POST to.`,
					example: `--packageConfig="{\\"my-app\\":{\\"endpoint\\":\\"https://my-app.com\\"}}"`,
					flag: `c`,
					parse: JSON.parse,
					required: true,
				},
				secretsConfig: {
					description: `Maps the names of your packages to the secrets that klaxon will use to authenticate with their respective endpoints.`,
					example: `--secretsConfig="{\\"my-app\\":\\"XXXX-XXXX-XXXX\\"}"`,
					flag: `s`,
					parse: JSON.parse,
					required: true,
				},
				publishedPackages: {
					description: `The output of the "Publish" step in Changesets.`,
					example: `--publishedPackages="[{\\"name\\":\\"my-app\\",\\"version\\":\\"0.0.0\\"}]"`,
					flag: `p`,
					parse: JSON.parse,
					required: true,
				},
			},
			optionsSchema: changesetsPublishedPackagesSchema,
		},
	},
})

const { inputs } = klaxon(process.argv)
await Klaxon.scramble(inputs.opts).then((scrambleResult) => {
	console.log(scrambleResult)
})
