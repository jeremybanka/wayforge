#!/usr/bin/env bun

import { cli, help, helpOption, noOptions, optional } from "comline"

import * as Recoverage from "./recoverage"

const parse = cli({
	cliName: `recoverage`,
	routes: optional({
		"": null,
		capture: null,
		diff: null,
	}),
	routeOptions: {
		"": helpOption(),
		capture: noOptions(`capture the current state of your coverage.`),
		diff: noOptions(`diff the current state of your coverage.`),
	},
})

const { inputs } = parse(process.argv)

switch (inputs.case) {
	case ``:
		console.log(help(parse.definition))
		break
	case `capture`:
		await Recoverage.capture()
		break
	case `diff`:
		await Recoverage.diff()
		break
}
