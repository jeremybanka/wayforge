#!/usr/bin/env node

import z from "zod"

import { cli, optional, options, required } from "../../src/cli"

const optionGroup = options(`probe`, z.object({ name: z.string().optional() }), {
	name: { description: `name`, example: ``, required: false },
})
const parse = cli({
	cliName: `mycli`,
	discoverConfigPath: () => undefined,
	routes: required({ foo: optional({ $value: null }) }),
	routeOptions: { foo: optionGroup, "foo/$value": optionGroup },
})

console.log(
	JSON.stringify({ argv: process.argv, inputs: parse(process.argv).inputs }),
)
