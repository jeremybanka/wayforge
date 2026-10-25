import { cpSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"

import { expectTypeOf, vi } from "vitest"
import z from "zod"

import { cli, help, options, required } from "../../src/cli"
import { argv } from "../fixtures/argv"
import { hookCases, type Resolver } from "../fixtures/config-only-cases"

let directory: string
beforeEach(() => {
	directory = mkdtempSync(path.join(tmpdir(), `comline-async-`))
	cpSync(path.join(import.meta.dirname, `../fixtures/async-config`), directory, {
		recursive: true,
	})
})
afterEach(() => {
	rmSync(directory, { recursive: true, force: true })
})

const fooOptions = options(``, z.strictObject({ foo: z.string() }), {
	foo: { required: true, description: `Foo`, example: `--foo=value` },
})

// The authored modules include config-only values; this group selects foo for loader tests.
const moduleOptions = options(
	``,
	z.object({ foo: z.string() }),
	fooOptions.optionConfigs,
)

test.each([`sync`, `direct`, `transitive`])(
	`awaits %s module evaluation and preserves cached exports`,
	async (fixture) => {
		const configPath = path.join(directory, `${fixture}.mts`)
		const command = cli({
			cliName: `probe`,
			routeOptions: { "": moduleOptions },
			discoverConfigPath: () => configPath,
		})
		expect((await command.async(argv())).inputs.opts).toEqual({
			foo: `hello world`,
		})
		expect((await command.async(argv(`--foo=override`))).inputs.opts).toEqual({
			foo: `override`,
		})
		expect((await command.async(argv())).inputs.opts).toEqual({
			foo: `hello world`,
		})
		if (fixture === `sync`)
			expect(command(argv()).inputs.opts).toEqual({ foo: `hello world` })
	},
)

test.each([`ts`, `mts`, `cts`, `js`, `mjs`, `cjs`, `json`])(
	`shares synchronous .%s configs between entrypoints`,
	async (extension) => {
		const configPath = path.join(directory, `config.${extension}`)
		writeFileSync(path.join(directory, `package.json`), `{"type":"module"}`)
		const object = `{"foo":"original"}`
		writeFileSync(
			configPath,
			extension === `json`
				? object
				: [`cts`, `cjs`].includes(extension)
					? `module.exports = ${object}`
					: `export default ${object}`,
		)
		const command = cli({
			cliName: `probe`,
			routeOptions: { "": fooOptions },
			discoverConfigPath: () => path.relative(process.cwd(), configPath),
		})
		for (const args of [argv(), argv(`--foo=override`)]) {
			expect((await command.async(args)).inputs).toEqual(command(args).inputs)
		}
		if (extension === `json`) {
			writeFileSync(configPath, `{"foo":"changed"}`)
			expect((await command.async(argv())).inputs.opts.foo).toBe(`changed`)
		}
	},
)

test.each([`direct`, `transitive`])(
	`directs synchronous callers of %s async modules to parse.async`,
	(fixture) => {
		const command = cli({
			cliName: `probe`,
			routeOptions: { "": moduleOptions },
			discoverConfigPath: () => path.join(directory, `${fixture}.mts`),
		})
		expect(() => command(argv())).toThrow(/parse\.async/)
		try {
			command(argv())
		} catch (error) {
			expect(error).toMatchObject({
				cause: { code: `ERR_REQUIRE_ASYNC_MODULE` },
			})
		}
	},
)

test(`propagates rejected initialization even with a valid CLI override`, async () => {
	const command = cli({
		cliName: `probe`,
		routeOptions: { "": fooOptions },
		discoverConfigPath: () => path.join(directory, `rejected.mts`),
	})
	await expect(command.async(argv(`--foo=override`))).rejects.toThrow(
		/asynchronous config initialization failed/,
	)
})

test.each([
	`export default Promise.resolve({ foo: "value" })`,
	`export default () => ({ foo: "value" })`,
	`export const foo = "value"`,
	`import "./missing.mts"; export default { foo: "value" }`,
	`export default {`,
	`throw new Error("initialization failed")`,
])(`rejects invalid or unloadable exports: %s`, async (source) => {
	const configPath = path.join(directory, `invalid.mts`)
	writeFileSync(configPath, source)
	const command = cli({
		cliName: `probe`,
		routeOptions: { "": fooOptions },
		discoverConfigPath: () => configPath,
	})
	await expect(command.async(argv(`--foo=override`))).rejects.toThrow()
})

describe.each(hookCases)(`$name async config-only contracts`, ({ group }) => {
	test.each([`sync`, `direct`, `transitive`])(
		`preserves callback identity and inferred signatures from %s configs`,
		async (fixture) => {
			const configPath = path.join(directory, `hooks.mts`)
			writeFileSync(
				configPath,
				`import config from "./${fixture}.mts"; const { foo, ...hooks } = config; export default hooks`,
			)
			const original = (await import(pathToFileURL(configPath).href)).default
			const command = cli({
				cliName: `probe`,
				routeOptions: { "": group },
				discoverConfigPath: () => configPath,
			})
			const { inputs } = await command.async(
				argv(`--verbose`, `--mode=fast`, `--count=3`),
			)
			expect(inputs.opts).toMatchObject({
				verbose: true,
				mode: `fast`,
				count: 3,
				secret: `token`,
			})
			expect(inputs.opts.release.resolveDelta).toBe(
				original.release.resolveDelta,
			)
			expect(inputs.opts.release.policy).toBe(original.release.policy)
			expect(inputs.opts.created).toEqual(original.created)
			expectTypeOf(inputs.opts.release.resolveDelta).toEqualTypeOf<Resolver>()
		},
	)
	test.each([
		[`root typo`, `relase: {}`],
		[`nested typo`, `release: { ...hooks.release, polciy: () => false }`],
		[`invalid callback`, `release: { ...hooks.release, policy: 42 }`],
		[`invalid overridden field`, `count: "invalid"`],
	])(`validates %s before CLI overrides`, async (_name, override) => {
		const configPath = path.join(directory, `invalid.mts`)
		writeFileSync(
			configPath,
			`import config from "./direct.mts"; const { foo, ...hooks } = config; export default { ...hooks, ${override} }`,
		)
		const command = cli({
			cliName: `probe`,
			routeOptions: { "": group },
			discoverConfigPath: () => configPath,
		})
		await expect(command.async(argv(`--count=3`))).rejects.toThrow(
			/relase|polciy|policy|count/,
		)
	})
	test.each([
		`--release`,
		`--release={}`,
		`--release.policy=false`,
		`--secret=override`,
		`--created=2026-01-01`,
	])(`rejects %s before discovery`, async (word) => {
		const discover = vi.fn(() => path.join(directory, `rejected.mts`))
		const command = cli({
			cliName: `probe`,
			routeOptions: { "": group },
			discoverConfigPath: discover,
		})
		await expect(command.async(argv(word))).rejects.toThrow(/config-only/)
		await expect(command.async(argv(`--label`, word))).rejects.toThrow(
			/config-only/,
		)
		expect(discover).not.toHaveBeenCalled()
	})
})

test(`merges original schema input and retains route-discriminated output types`, async () => {
	const group = options(
		``,
		z.strictObject({
			secret: z.string().transform((value) => value.length),
			label: z.string().default(`default`),
		}),
		{
			secret: { configOnly: true },
			label: {
				required: false,
				description: `Label`,
				example: `--label=example`,
			},
		},
	)
	const configPath = path.join(directory, `transform.mts`)
	writeFileSync(
		configPath,
		`export default { secret: await Promise.resolve("token") }`,
	)
	const command = cli({
		cliName: `probe`,
		routes: required({ run: required({ $name: null }), other: null }),
		routeOptions: { "run/$name": group, other: null },
		discoverConfigPath: (segments) =>
			segments[0] === `run` ? configPath : undefined,
	})
	const result = await command.async(
		argv(`run`, `target`, `--label=override`, `--unknown=ignored`),
	)
	expectTypeOf(result).toEqualTypeOf<ReturnType<typeof command>>()
	if (result.inputs.case === `run/$name`) {
		expectTypeOf(result.inputs.opts.secret).toEqualTypeOf<number>()
		expectTypeOf(result.inputs.params.name).toEqualTypeOf<string>()
		expect(result.inputs.opts).toEqual({ secret: 5, label: `override` })
	} else throw new Error(`wrong route`)
	expect(result.warnings.length).toBeGreaterThan(0)
	result.writeJsonSchema(directory)
	expect((await command.async(argv(`other`))).inputs.opts).toEqual({})
})

test.each([undefined, () => undefined, () => `missing-config.mts`])(
	`skips configuration when unavailable: %s`,
	async (discoverConfigPath) => {
		const command = cli({
			cliName: `probe`,
			routeOptions: { "": fooOptions },
			...(discoverConfigPath ? { discoverConfigPath } : {}),
		})
		expect((await command.async(argv(`--foo=cli`))).inputs.opts).toEqual({
			foo: `cli`,
		})
	},
)

test(`keeps help, interpretation and completion independent of async config initialization`, async () => {
	const discover = vi.fn(() => path.join(directory, `rejected.mts`))
	const command = cli({
		cliName: `probe`,
		routeOptions: { "": fooOptions },
		discoverConfigPath: discover,
	})
	expect(help(command.definition, { forceColor: false })).toContain(`--foo`)
	command.interpret({ words: [``] })
	await command.complete({ words: [``] })
	expect(discover).not.toHaveBeenCalled()
})

test(`does not enable asynchronous schema validation`, async () => {
	const command = cli({
		cliName: `probe`,
		routeOptions: {
			"": options(
				``,
				z.object({ foo: z.string().refine(() => Promise.resolve(true)) }),
				fooOptions.optionConfigs,
			),
		},
	})
	await expect(command.async(argv(`--foo=value`))).rejects.toThrow(
		/async.*validation/i,
	)
})

test(`keeps concurrent async parses isolated`, async () => {
	const command = cli({
		cliName: `probe`,
		routeOptions: { "": moduleOptions },
		discoverConfigPath: () => path.join(directory, `direct.mts`),
	})
	const results = await Promise.all([
		command.async(argv(`--foo=first`)),
		command.async(argv(`--foo=second`)),
		command.async(argv()),
	])
	expect(results.map((result) => result.inputs.opts.foo)).toEqual([
		`first`,
		`second`,
		`hello world`,
	])
})
