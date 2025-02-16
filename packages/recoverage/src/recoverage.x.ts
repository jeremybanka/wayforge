#!/usr/bin/env bun

import { cli, help, helpOption, noOptions, optional } from "comline"
import { z } from "zod"

import * as Recoverage from "./recoverage"

const parse = cli({
	cliName: `recoverage`,
	routes: optional({
		"": null,
		capture: null,
		diff: null,
		help: null,
	}),
	routeOptions: {
		"": {
			description: `capture and diff the current state of your coverage.`,
			options: {
				"default-branch": {
					flag: `b`,
					required: false,
					description: `The default branch for the repository (default: "main").`,
					example: `--default-branch=trunk`,
				},
			},
			optionsSchema: z.object({
				defaultBranch: z.string().optional(),
			}),
		},
		capture: noOptions(`capture the current state of your coverage.`),
		diff: {
			description: `diff the current state of your coverage.`,
			options: {
				"default-branch": {
					flag: `b`,
					required: false,
					description: `The default branch for the repository (default: "main").`,
					example: `--default-branch=trunk`,
				},
			},
			optionsSchema: z.object({
				defaultBranch: z.string().optional(),
			}),
		},
		help: noOptions(`show this help text.`),
	},
})

const { inputs } = parse(process.argv)
switch (inputs.case) {
	case ``:
		await Recoverage.capture()
		try {
			await Recoverage.diff(inputs.opts[`default-branch`] ?? `main`)
		} catch (thrown) {
			console.error(thrown)
		}
		break
	case `capture`:
		await Recoverage.capture()
		break
	case `diff`:
		await Recoverage.diff(inputs.opts[`default-branch`] ?? `main`)
		break
	case `help`:
		console.log(help(parse.definition))
		break
}
