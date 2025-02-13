#!/usr/bin/env bun

import { cli, required } from "comline"

import * as Recoverage from "./recoverage"

const parse = cli(
	{
		cliName: `recoverage`,
		routes: required({
			capture: null,
			diff: null,
		}),
		routeOptions: {
			capture: null,
			diff: null,
		},
	},
	// console,
)

const { inputs } = parse(process.argv)

switch (inputs.case) {
	case `capture`:
		await Recoverage.capture()
		break
	case `diff`:
		await Recoverage.diff()
		break
}
