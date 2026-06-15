import { type } from "arktype"
import { optional, required } from "treetrunks"

import { cli, options } from "../src/cli"
import { parseBooleanOption, parseStringOption } from "../src/option-parsers"

describe(`positional args from cli`, () => {
	const testCli = cli({
		cliName: `my-cli`,
		routes: required({
			hello: optional({
				world: null,
				$name: optional({ good: required({ morning: null }) }),
			}),
		}),
		routeOptions: {
			hello: null,
			"hello/world": null,
			"hello/$name": null,
			"hello/$name/good/morning": null,
		},
		options: {},
	})
	test(`happy: all positional args`, () => {
		const { inputs } = testCli([`--`, `hello`, `world`])
		expect(inputs.case).toEqual(`hello/world`)
		expect(inputs.path).toEqual([`hello`, `world`])
		expect(inputs.opts).toEqual({})
	})
	test(`happy: missing optional positional args`, () => {
		const { inputs } = testCli([`--`, `hello`])
		expect(inputs.case).toEqual(`hello`)
		expect(inputs.path).toEqual([`hello`])
		expect(inputs.opts).toEqual({})
	})
	test(`error: missing required positional args`, () => {
		expect(() => testCli([`--`])).toThrow()
	})
	test(`error: extra positional args`, () => {
		expect(() => testCli([`--`, `hello`, `world`, `extra`])).toThrow()
	})
	test(`happy: variable positional args`, () => {
		const { inputs } = testCli([`--`, `hello`, `jeff`, `good`, `morning`])
		expect(inputs.case).toEqual(`hello/$name/good/morning`)
		expect(inputs.path).toEqual([`hello`, `jeff`, `good`, `morning`])
		expect(inputs.opts).toEqual({})
	})
})

describe(`options and positional args from cli`, () => {
	const optionGroup = options(`blah`, type({ "foo?": `string` }), {
		foo: {
			description: `foo`,
			example: `--foo=hello`,
			flag: `f`,
			parse: parseStringOption,
			required: false,
		},
	})

	const testCli = cli({
		cliName: `my-cli`,
		routes: optional({ yo: null }),
		routeOptions: {
			"": optionGroup,
			yo: optionGroup,
		},
	})
	test(`happy: all options and positional args`, () => {
		const { inputs } = testCli([
			`/some-random-path/my-cli`,
			`--foo=hello`,
			`--`,
			`yo`,
		])
		expect(inputs.case).toEqual(`yo`)
		expect(inputs.opts).toEqual({ foo: `hello` })
		expect(inputs.path).toEqual([`yo`])
	})
	test(`happy: including optional options and missing optional positional args`, () => {
		const { inputs } = testCli([
			`/usr/bin/env/node`,
			`/some-random-path/my-cli`,
			`--foo=hello`,
			`--`,
		])
		expect(inputs.case).toEqual(``)
		expect(inputs.opts).toEqual({ foo: `hello` })
		expect(inputs.path).toEqual([])
	})
	test(`happy: missing optional options and including optional positional args`, () => {
		const { inputs } = testCli([`--`, `yo`])
		expect(inputs.case).toEqual(`yo`)
		expect(inputs.opts).toEqual({})
		expect(inputs.path).toEqual([`yo`])
	})
})

describe(`options without equals signs and positional args from cli`, () => {
	const optionGroup = options(`blah`, type({ "with-option": `string` }), {
		"with-option": {
			description: `with option`,
			example: `--with-option=so-and-so`,
			parse: parseStringOption,
			required: true,
		},
	})

	const testCli = cli({
		cliName: `my-cli`,
		routes: required({
			deploy: required({ $target: required({ $environment: null }) }),
			"do-thing": null,
		}),
		routeOptions: {
			"deploy/$target/$environment": optionGroup,
			"do-thing": optionGroup,
		},
	})
	test(`happy: positional args with option values separated by spaces`, () => {
		const { inputs } = testCli([
			`/some-random-path/my-cli`,
			`do-thing`,
			`--with-option`,
			`so-and-so`,
		])
		expect(inputs.case).toEqual(`do-thing`)
		expect(inputs.opts).toEqual({ "with-option": `so-and-so` })
		expect(inputs.path).toEqual([`do-thing`])
	})
	test(`happy: more positional args with option values separated by spaces`, () => {
		const { inputs } = testCli([
			`/some-random-path/my-cli`,
			`deploy`,
			`my-app`,
			`production`,
			`--with-option`,
			`so-and-so`,
		])
		expect(inputs.case).toEqual(`deploy/$target/$environment`)
		expect(inputs.opts).toEqual({ "with-option": `so-and-so` })
		expect(inputs.path).toEqual([`deploy`, `my-app`, `production`])
	})
	test(`happy: positional args with option values separated by equals signs`, () => {
		const { inputs } = testCli([
			`/some-random-path/my-cli`,
			`do-thing`,
			`--with-option=so-and-so`,
		])
		expect(inputs.case).toEqual(`do-thing`)
		expect(inputs.opts).toEqual({ "with-option": `so-and-so` })
		expect(inputs.path).toEqual([`do-thing`])
	})
})

describe(`options before positional args from cli`, () => {
	const switchOptionGroup = options(`blah`, type({ "dry-run?": `boolean` }), {
		"dry-run": {
			description: `dry run`,
			example: `--dry-run`,
			flag: `d`,
			parse: parseBooleanOption,
			required: false,
		},
	})
	const flagOptionGroup = options(`blah`, type({ "name?": `string` }), {
		name: {
			description: `name`,
			example: `--name=example`,
			flag: `n`,
			parse: parseStringOption,
			required: false,
		},
	})

	test(`happy: bare boolean switch before positional args`, () => {
		const testCli = cli({
			cliName: `my-cli`,
			routes: required({ set: required({ $enabled: null }) }),
			routeOptions: {
				"set/$enabled": switchOptionGroup,
			},
		})
		const { inputs } = testCli([
			`/some-random-path/my-cli`,
			`--dry-run`,
			`set`,
			`true`,
		])
		expect(inputs.case).toEqual(`set/$enabled`)
		expect(inputs.opts).toEqual({ "dry-run": true })
		expect(inputs.path).toEqual([`set`, `true`])
	})

	test(`happy: flag value before non-boolean positional args`, () => {
		const testCli = cli({
			cliName: `my-cli`,
			routes: required({ inspect: required({ $target: null }) }),
			routeOptions: {
				"inspect/$target": flagOptionGroup,
			},
		})
		const { inputs } = testCli([
			`/some-random-path/my-cli`,
			`-n`,
			`example`,
			`inspect`,
			`service-a`,
		])
		expect(inputs.case).toEqual(`inspect/$target`)
		expect(inputs.opts).toEqual({ name: `example` })
		expect(inputs.path).toEqual([`inspect`, `service-a`])
	})
})
