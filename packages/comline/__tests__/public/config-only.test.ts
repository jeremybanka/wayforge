import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import path from "node:path"

import { expectTypeOf, vi } from "vitest"
import z from "zod"

import {
	cli,
	type ConfigInput,
	help,
	type OptionConfig,
	options,
	type OptionsSchema,
	parseBooleanOption,
	required,
} from "../../src/cli"
import { argv } from "../fixtures/argv"
import {
	hookCases,
	type Policy,
	type Resolver,
	zodHookOptions,
	zodHookSchema,
} from "../fixtures/config-only-cases"

let directory: string
let configPath: string
beforeEach(() => {
	directory = mkdtempSync(path.join(tmpdir(), `comline-hooks-`))
	configPath = path.join(directory, `config.cts`)
	writeFileSync(
		configPath,
		`
const config = {
  verbose: false,
  mode: "safe",
  count: 2,
  release: {
    resolveDelta: async (version: string) => { throw new Error("resolver invoked"); },
    policy: () => { throw new Error("policy invoked"); },
  },
  secret: "from config",
  created: new Date("2026-01-01"),
}
module.exports = config
`,
	)
})
afterEach(() => {
	rmSync(directory, { recursive: true, force: true })
})

describe.each(hookCases)(`$name config-only fields`, ({ group }) => {
	test.each([`sync`, `async`])(
		`loads %s hooks without invocation, preserving signatures and identity through CLI overrides`,
		(kind) => {
			if (kind === `sync`)
				writeFileSync(
					configPath,
					readFileSync(configPath, `utf8`).replace(`async (version`, `(version`),
				)
			const original: ConfigInput<typeof group> =
				createRequire(configPath)(configPath)
			const command = cli({
				cliName: `probe`,
				routeOptions: { "": group },
				discoverConfigPath: () => configPath,
			})
			const { inputs } = command(argv(`--verbose`, `--mode=fast`, `--count=3`))
			expect(inputs.opts).toMatchObject({
				verbose: true,
				mode: `fast`,
				count: 3,
				secret: `from config`,
			})
			expect(inputs.opts.release.resolveDelta).toBe(
				original.release.resolveDelta,
			)
			expect(inputs.opts.release.policy).toBe(original.release.policy)
			expect(inputs.opts.created).toEqual(original.created)
			expectTypeOf(inputs.opts.release.resolveDelta).toEqualTypeOf<Resolver>()
			expectTypeOf(inputs.opts.release.policy).toEqualTypeOf<Policy>()
			expectTypeOf(inputs.opts.verbose).toEqualTypeOf<boolean>()
			expectTypeOf(inputs.opts.mode).toEqualTypeOf<`safe` | `fast`>()
			expect(() => command(argv(`--count=invalid`))).toThrow(/count/)
		},
	)

	test.each([
		[`root typo`, `relase: {},`],
		[
			`nested typo`,
			`release: { resolveDelta: () => undefined, policy: () => false, polciy: () => false },`,
		],
		[
			`invalid resolver`,
			`release: { resolveDelta: "wrong", policy: () => false },`,
		],
		[`invalid policy`, `release: { resolveDelta: () => undefined, policy: 1 },`],
	])(`rejects %s in loaded configuration`, (_name, override) => {
		writeFileSync(
			configPath,
			readFileSync(configPath, `utf8`).replace(
				`module.exports = config`,
				`module.exports = { ...config, ${override} }`,
			),
		)
		const command = cli({
			cliName: `probe`,
			routeOptions: { "": group },
			discoverConfigPath: () => configPath,
		})
		expect(() => command(argv())).toThrow(/(relase|polciy|resolveDelta|policy)/)
	})

	test.each([
		`--release={}`,
		`--release`,
		`--release.policy=false`,
		`--secret=override`,
		`--created=2026-01-01`,
	])(`rejects %s before loading configuration`, (word) => {
		const discover = vi.fn(() => configPath)
		const command = cli({
			cliName: `probe`,
			routeOptions: { "": group },
			discoverConfigPath: discover,
		})
		expect(() => command(argv(word))).toThrow(/config-only/)
		expect(() => command(argv(`--label`, word))).toThrow(/config-only/)
		expect(discover).not.toHaveBeenCalled()
	})

	test(`respects literal values and the positional delimiter`, () => {
		const command = cli({
			cliName: `probe`,
			routeOptions: { "": group },
			discoverConfigPath: () => configPath,
		})
		expect(command(argv(`--label=--release`)).inputs.opts.label).toBe(
			`--release`,
		)
		const positional = cli({
			cliName: `probe`,
			routes: required({ $name: null }),
			routeOptions: { $name: group },
			discoverConfigPath: () => configPath,
		})
		expect(positional(argv(`--`, `--release`)).inputs.params.name).toBe(
			`--release`,
		)
	})

	test(`keeps help and completion metadata without loading or validating config`, async () => {
		const discover = vi.fn(() => configPath)
		const standard = group.optionsSchema[`~standard`]
		const validate = vi.fn(standard.validate)
		const command = cli({
			cliName: `probe`,
			routes: required({ $target: null }),
			routeOptions: {
				$target: {
					...group,
					optionsSchema: { "~standard": { ...standard, validate } },
				},
			},
			discoverConfigPath: discover,
		})
		const context = command.interpret({ words: [`--verbose`, `target`, ``] })
		expect(context.path).toEqual([`target`])
		expect(context.options).toMatchObject([{ key: `verbose`, value: `` }])
		const manual = help(command.definition, { forceColor: false })
		expect(manual).toContain(`boolean`)
		expect(manual).toContain(`--mode=safe`)
		for (const key of [`release`, `secret`, `created`]) {
			expect(manual).not.toContain(`--${key}`)
			expect(context.allOptions.map((option) => option.key)).not.toContain(key)
		}
		const values = await command.complete({ words: [`target`, `--mode=`] })
		expect(values.candidates.map((candidate) => candidate.value)).toEqual(
			expect.arrayContaining([`safe`, `fast`]),
		)
		expect(discover).not.toHaveBeenCalled()
		expect(validate).not.toHaveBeenCalled()
	})

	test(`full JSON Schema export diagnoses unsupported values`, () => {
		const command = cli({
			cliName: `probe`,
			routeOptions: { "": group },
			discoverConfigPath: () => configPath,
		})
		expect(() => {
			command(argv()).writeJsonSchema(directory)
		}).toThrow(/full configuration JSON Schema/)
	})
})

test(`derives config input separately from defaulted output and rejects unsafe declarations`, () => {
	type Input = ConfigInput<typeof zodHookOptions>
	const authored = {
		release: {
			resolveDelta: (version: string) => ({ previousVersion: version, version }),
			policy: () => false,
		},
		secret: `token`,
		created: new Date(),
	} satisfies Input
	expectTypeOf<Input[`verbose`]>().toEqualTypeOf<boolean | undefined>()
	expect(zodHookSchema.parse(authored).verbose).toBe(false)
	if (false) {
		// @ts-expect-error Root misspellings must fail excess-property checking.
		const rootTypo = { ...authored, relase: authored.release } satisfies Input
		const nestedTypo = {
			...authored,
			// @ts-expect-error Nested misspellings must fail excess-property checking.
			release: { ...authored.release, polciy: () => false },
		} satisfies Input
		const badPolicy: Input = {
			...authored,
			// @ts-expect-error Callback signatures remain precise.
			release: { ...authored.release, policy: () => `no` },
		}
		// @ts-expect-error Non-CLI values cannot be exposed as argv options.
		options(``, z.object({ hook: z.custom<Policy>() }), {
			hook: {
				required: false,
				description: ``,
				example: ``,
				parse: () => () => false,
			},
		})
		// @ts-expect-error A union containing a function cannot become an argv option.
		options(``, z.object({ value: z.custom<string | Policy>() }), {
			value: { required: false, description: ``, example: `` },
		})
		options(``, z.object({ secret: z.string() }), {
			// @ts-expect-error Config-only fields cannot carry parsers.
			secret: { configOnly: true, parse: (value: string) => value },
		})
		// @ts-expect-error Every field needs an explicit exposure decision.
		options(``, zodHookSchema, { verbose: zodHookOptions.optionConfigs.verbose })
		options(``, z.object({ count: z.number() }), {
			count: {
				required: false,
				description: ``,
				example: ``,
				// @ts-expect-error Metadata cannot widen the runtime schema's output type.
				parse: () => `wrong`,
			},
		})
		options(``, z.object({ count: z.number() }), {
			count: {
				required: false,
				description: ``,
				example: ``,
				parse: Number,
				// @ts-expect-error Metadata schema must describe the same value type.
				schema: z.string(),
			},
		})
		options(``, z.object({ count: z.number() }), {
			// @ts-expect-error Options metadata must not contain misspelled keys.
			count: { configOnly: true },
			cuont: { configOnly: true },
		})
		// @ts-expect-error Unknown values are only allowed in configuration.
		options(``, z.object({ value: z.unknown() }), {
			value: {
				required: false,
				description: ``,
				example: ``,
				parse: (value: string) => value,
			},
		})
		void [rootTypo, nestedTypo, badPolicy]
	}
})

test(`retains dynamic exposure types and catches CLI metadata misspellings`, () => {
	const declare = (config: OptionConfig<string>) =>
		options(``, z.object({ value: z.string() }), { value: config })
	expectTypeOf<
		ReturnType<typeof declare>[`optionConfigs`][`value`]
	>().toEqualTypeOf<OptionConfig<string>>()
	if (false) {
		options(``, z.object({ value: z.string() }), {
			// @ts-expect-error CLI metadata must retain excess-property checking.
			value: { description: ``, example: ``, required: false, flga: `v` },
		})
	}
})

test(`reserves config-only names per route and rejects alias collisions`, () => {
	const hidden = options(
		``,
		z.object({ "release.policy": z.string().default(`private`) }),
		{ "release.policy": { configOnly: true } },
	)
	const exposed = options(``, z.object({ "release.policy": z.string() }), {
		"release.policy": { description: ``, example: ``, required: true },
	})
	const command = cli({
		cliName: `probe`,
		routes: required({ hidden: null, exposed: null }),
		routeOptions: { hidden, exposed },
	})
	expect(() => command(argv(`hidden`, `--release.policy=no`))).toThrow(
		/config-only/,
	)
	expect(
		command(argv(`exposed`, `--release.policy=yes`)).inputs.opts[
			`release.policy`
		],
	).toBe(`yes`)
	const collision = cli({
		cliName: `probe`,
		routeOptions: {
			"": options(
				``,
				z.object({
					private: z.string().optional(),
					public: z.string().optional(),
				}),
				{
					private: { configOnly: true },
					public: {
						description: ``,
						example: ``,
						required: false,
						aliases: [`private`],
					},
				},
			),
		},
	})
	expect(() => collision(argv(`--private=value`))).toThrow(
		/conflicts.*config-only/,
	)
})

test(`preserves input types and applies transformations to merged input`, () => {
	const schema = z.strictObject({
		secret: z.string().transform((value) => value.length),
		label: z.string().default(`default`),
	})
	const group = options(``, schema, {
		secret: { configOnly: true },
		label: { required: false, description: ``, example: `` },
	})
	const config = { secret: `token` } satisfies ConfigInput<typeof group>
	expectTypeOf<ConfigInput<typeof group>[`secret`]>().toEqualTypeOf<string>()
	writeFileSync(configPath, `module.exports = ${JSON.stringify(config)}`)
	const command = cli({
		cliName: `probe`,
		routeOptions: { "": group },
		discoverConfigPath: () => configPath,
	})
	const result = command(argv(`--label=override`))
	expect(result.inputs.opts).toEqual({ secret: 5, label: `override` })
	expectTypeOf(result.inputs.opts.secret).toEqualTypeOf<number>()
})

test(`accepts a runtime-only Standard Schema and exports config-only JSON scalars when supported`, () => {
	const schema: OptionsSchema<{ value: string }> = {
		"~standard": {
			version: 1,
			vendor: `test`,
			validate: () => ({ value: { value: `validated` } }),
		},
	}
	const command = cli({
		cliName: `probe`,
		routeOptions: { "": options(``, schema, { value: { configOnly: true } }) },
	})
	expect(command(argv()).inputs.opts.value).toBe(`validated`)
	expect(() => {
		command(argv()).writeJsonSchema(directory)
	}).toThrow(/JSON Schema/)
	const scalar = cli({
		cliName: `scalar`,
		routeOptions: {
			"": options(``, z.object({ secret: z.string().default(`token`) }), {
				secret: { configOnly: true },
			}),
		},
	})
	scalar(argv()).writeJsonSchema(directory)
	expect(
		JSON.parse(
			readFileSync(path.join(directory, `scalar.main.schema.json`), `utf8`),
		).properties.secret.type,
	).toBe(`string`)
})

test(`merges raw configuration without interpreting prototype keys as inherited options`, () => {
	const jsonPath = path.join(directory, `config.json`)
	writeFileSync(jsonPath, `{"__proto__":{"admin":true}}`)
	const command = cli({
		cliName: `probe`,
		routeOptions: {
			"": options(``, z.object({ admin: z.boolean().default(false) }), {
				admin: {
					required: false,
					description: ``,
					example: ``,
					parse: parseBooleanOption,
				},
			}),
		},
		discoverConfigPath: () => jsonPath,
	})
	expect(command(argv()).inputs.opts.admin).toBe(false)
	expect(command(argv(`--admin`)).inputs.opts.admin).toBe(true)
	expect(command(argv(`--admin=false`)).inputs.opts.admin).toBe(false)
})

test(`keeps explicit hints and unrelated routes usable when field metadata cannot be exported`, async () => {
	const field = z.custom<string>((value) => typeof value === `string`)
	const command = cli({
		cliName: `probe`,
		routes: required({ run: null, other: null }),
		routeOptions: {
			run: options(``, z.object({ mode: field.optional() }), {
				mode: {
					required: false,
					description: `Run mode`,
					example: `--mode=safe`,
					schema: field,
					valueKind: `value`,
					completion: { choices: [`safe`, `fast`] },
				},
			}),
			other: null,
		},
	})
	expect(command(argv(`other`)).inputs.case).toBe(`other`)
	expect(command(argv(`run`, `--mode=safe`)).inputs.opts).toEqual({
		mode: `safe`,
	})
	expect(
		command.interpret({ words: [`run`, `--mode=safe`, ``] }).options,
	).toMatchObject([{ key: `mode`, value: `safe` }])
	expect(help(command.definition, { forceColor: false })).toContain(`Run mode`)
	const completion = await command.complete({ words: [`run`, `--mode=`] })
	expect(completion.candidates.map((candidate) => candidate.value)).toEqual(
		expect.arrayContaining([`safe`, `fast`]),
	)
	expect(() => {
		command(argv(`run`)).writeJsonSchema(directory)
	}).toThrow(/full configuration JSON Schema/)
})

test(`falls back to full-schema field metadata for boolean consumption, help, and enum completion`, async () => {
	const command = cli({
		cliName: `probe`,
		routes: required({ $target: null }),
		routeOptions: {
			$target: options(
				``,
				z.object({
					verbose: z.boolean().default(false),
					mode: z.enum([`safe`, `fast`]).default(`safe`),
				}),
				{
					verbose: {
						required: false,
						description: `Verbose output`,
						example: `--verbose`,
						parse: parseBooleanOption,
						schema: z.custom<boolean>((value) => typeof value === `boolean`),
					},
					mode: {
						required: false,
						description: `Run mode`,
						example: `--mode=safe`,
						schema: z.custom<`safe` | `fast`>(
							(value) => value === `safe` || value === `fast`,
						),
					},
				},
			),
		},
	})
	const result = command(argv(`--verbose`, `target`))
	expect(result.inputs.params.target).toBe(`target`)
	expect(result.inputs.opts.verbose).toBe(true)
	expect(help(command.definition, { forceColor: false })).toContain(`boolean`)
	const completion = await command.complete({ words: [`target`, `--mode=`] })
	expect(completion.candidates.map((candidate) => candidate.value)).toEqual(
		expect.arrayContaining([`safe`, `fast`]),
	)
})
