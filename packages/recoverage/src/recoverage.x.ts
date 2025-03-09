#!/usr/bin/env bun

import { cli, help, noOptions, optional } from "comline"
import { z } from "zod"

import { logger } from "./logger"
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
		{
			const captureCode = await Recoverage.capture()
			if (captureCode === 1) {
				logger.logMarks?.()
				process.exit(1)
			}
			try {
				const diffCode = await Recoverage.diff(
					inputs.opts[`default-branch`] ?? `main`,
				)
				logger.logMarks?.()
				if (diffCode === 1) {
					process.exit(1)
				}
			} catch (thrown) {
				logger.logMarks?.()
				console.error(thrown)
				process.exit(1)
			}
		}
		break
	case `capture`:
		{
			const captureCode = await Recoverage.capture()
			if (captureCode === 1) {
				process.exit(1)
			}
		}
		break
	case `diff`:
		try {
			const diffCode = await Recoverage.diff(
				inputs.opts[`default-branch`] ?? `main`,
			)
			if (diffCode === 1) {
				process.exit(1)
			}
		} catch (thrown) {
			console.error(thrown)
		}
		break
	case `help`:
		console.log(help(parse.definition))
		break
}
