#!/usr/bin/env node

import { type Type, type } from "arktype"
import { cli, options, required } from "comline"

import * as Klaxon from "./klaxon.lib.ts"

const changesetsPublishedPackagesSchema: Type<Klaxon.ScrambleOptions> = type({
	packageConfig: { "[string]": { endpoint: `string` } },
	secretsConfig: { "[string]": `string` },
	publishedPackages: [{ name: `string`, version: `string` }, `[]`],
})

const klaxon = cli({
	cliName: `klaxon`,
	routes: required({
		scramble: null,
	}),
	routeOptions: {
		scramble: options(``, changesetsPublishedPackagesSchema, {
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
		}),
	},
})

const { inputs } = klaxon(process.argv)
await Klaxon.scramble(inputs.opts).then((scrambleResult) => {
	console.log(scrambleResult)
})
