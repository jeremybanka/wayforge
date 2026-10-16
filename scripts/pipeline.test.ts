import {
	copyFileSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"

import { afterEach, expect, test } from "bun:test"

const root = resolve(import.meta.dir, `..`)
const fixtures: string[] = []

afterEach(() => {
	for (const fixture of fixtures.splice(0)) {
		rmSync(fixture, { recursive: true, force: true })
	}
})

function write(root: string, path: string, contents: string): void {
	const absolute = join(root, path)
	mkdirSync(dirname(absolute), { recursive: true })
	writeFileSync(absolute, contents)
}

function command(cwd: string, args: string[], extraEnv = {}): string {
	const env: Record<string, string | undefined> = { ...process.env, ...extraEnv }
	// Fixtures must not contact a configured remote cache or publish their logs.
	for (const key of Object.keys(env)) {
		if (key.startsWith(`PNPM_REMOTE_CACHE_`)) delete env[key]
	}
	const result = Bun.spawnSync(args, {
		cwd,
		env: {
			...env,
			PNPM_CONFIG_CACHE_DIR: join(cwd, `.cache`),
			XDG_CONFIG_HOME: join(cwd, `.config`),
		},
		stdout: `pipe`,
		stderr: `pipe`,
	})
	const output = result.stdout.toString() + result.stderr.toString()
	if (result.exitCode !== 0) throw new Error(`${args.join(` `)}\n${output}`)
	return output
}

function fixture(): string {
	const path = mkdtempSync(join(tmpdir(), `wayforge-pipeline-`))
	fixtures.push(path)
	write(path, `package.json`, JSON.stringify({ private: true }))
	write(
		path,
		`.gitignore`,
		`node_modules\n.cache\ndist\napp\nbin\nevents\n.breakage\n.release\n.env*\ngit.sha\n`,
	)
	const workspace = readFileSync(join(root, `pnpm-workspace.yaml`), `utf8`)
	write(
		path,
		`pnpm-workspace.yaml`,
		`packages: [packages/*, apps/*]\n` +
			workspace.slice(workspace.indexOf(`# Task ordering`)),
	)
	write(path, `scripts/.gitkeep`, ``)
	copyFileSync(
		join(root, `scripts/pipeline.bun.ts`),
		join(path, `scripts/pipeline.bun.ts`),
	)
	write(path, `config.json`, `original`)
	write(path, `.release`, `release-a`)
	const record = `import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
const event = (value) => appendFileSync("../../events", value + "\\n");\n`
	write(
		path,
		`packages/lib/package.json`,
		JSON.stringify({
			name: `lib`,
			scripts: { build: `bun build.ts` },
		}),
	)
	write(path, `packages/lib/source.txt`, `source-a`)
	write(
		path,
		`packages/lib/build.ts`,
		record +
			`
mkdirSync("dist", { recursive: true });
writeFileSync("dist/result.txt", readFileSync("source.txt"));
event("build");`,
	)
	write(
		path,
		`packages/comline/package.json`,
		JSON.stringify({
			name: `comline`,
			dependencies: { lib: `workspace:*` },
			scripts: {
				test: `bun test.ts`,
				cov: `bun coverage.ts`,
				"test:breakage:prelude": `bun prelude.ts`,
				"test:breakage": `bun breakage.ts`,
			},
		}),
	)
	write(
		path,
		`packages/comline/test.ts`,
		record +
			`
if (!readFileSync("../lib/dist/result.txt").length) throw Error("missing dependency build");
event("test");`,
	)
	write(
		path,
		`packages/comline/coverage.ts`,
		record +
			`
mkdirSync("coverage", { recursive: true });
writeFileSync("coverage/result.txt", "coverage");
event("test");`,
	)
	write(
		path,
		`packages/comline/prelude.ts`,
		record +
			`
mkdirSync(".breakage", { recursive: true });
writeFileSync(".breakage/baseline.json", readFileSync("../../.release"));
event("prelude");`,
	)
	write(
		path,
		`packages/comline/breakage.ts`,
		record +
			`
if (readFileSync(".breakage/baseline.json", "utf8") !== readFileSync("../../.release", "utf8")) throw Error("stale baseline");
event("breakage");`,
	)
	write(
		path,
		`apps/app/package.json`,
		JSON.stringify({
			name: `app`,
			scripts: { build: `bun bundle.ts` },
		}),
	)
	write(
		path,
		`apps/app/bundle.ts`,
		record +
			`
for (const dir of ["app", "bin"]) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(dir + "/result.bun.js", "bundle");
}
event("bundle");`,
	)
	command(path, [`git`, `init`, `--quiet`])
	command(path, [
		`pnpm`,
		`install`,
		`--lockfile-only`,
		`--offline`,
		`--ignore-scripts`,
	])
	return path
}

function pipeline(
	path: string,
	name: string,
	args: string[] = [],
	env = {},
): string {
	return command(
		path,
		[process.execPath, `scripts/pipeline.bun.ts`, name, ...args],
		env,
	)
}

function events(path: string): string[] {
	return readFileSync(join(path, `events`), `utf8`)
		.trim()
		.split(`\n`)
		.filter((event) => event !== `bundle`)
}

test(`pipelines order dependency builds, reuse results, and restore deleted outputs`, () => {
	const path = fixture()
	pipeline(path, `test`)
	expect(events(path)).toEqual([`build`, `test`])
	rmSync(join(path, `packages/lib/dist`), { recursive: true })
	pipeline(path, `test`)
	expect(events(path)).toEqual([`build`, `test`])
	expect(readFileSync(join(path, `packages/lib/dist/result.txt`), `utf8`)).toBe(
		`source-a`,
	)
	write(path, `packages/lib/source.txt`, `source-b`)
	pipeline(path, `test`)
	expect(events(path)).toEqual([`build`, `test`, `build`, `test`])
}, 30_000)

test(`shared configuration, environment files, and execution modes invalidate results`, () => {
	const path = fixture()
	pipeline(path, `test`)
	write(path, `config.json`, `updated`)
	pipeline(path, `test`)
	write(path, `.env`, `EXAMPLE=changed`)
	pipeline(path, `test`)
	write(path, `.env`, `EXAMPLE=changed\nEXAMPLE=changed\n`)
	pipeline(path, `test`)
	pipeline(path, `test`, [], { PREVIEW: `true` })
	pipeline(path, `test`, [], {
		PREVIEW: `true`,
		VITE_BACKEND_ORIGIN: `https://example.test`,
	})
	expect(events(path)).toEqual(
		Array.from({ length: 5 }, () => [`build`, `test`]).flat(),
	)
}, 30_000)

test(`coverage revisions invalidate cached results even though git.sha is ignored`, () => {
	const path = fixture()
	write(path, `git.sha`, `revision-a`)
	pipeline(path, `cov`)
	pipeline(path, `cov`)
	expect(events(path)).toEqual([`build`, `test`])
	write(path, `git.sha`, `revision-b`)
	pipeline(path, `cov`)
	expect(events(path)).toEqual([`build`, `test`, `test`])
}, 30_000)

test(`no-cache executes tasks again and failed builds block dependent tests`, () => {
	const path = fixture()
	pipeline(path, `test`)
	pipeline(path, `test`, [`--no-cache`])
	expect(events(path)).toEqual([`build`, `test`, `build`, `test`])
	write(path, `packages/lib/build.ts`, `process.exit(7)`)
	expect(() => pipeline(path, `test`)).toThrow()
	expect(events(path)).toEqual([`build`, `test`, `build`, `test`])
}, 30_000)

test(`Breakage refreshes its baseline before hashing and stops when the prelude fails`, () => {
	const path = fixture()
	pipeline(path, `test:breakage`)
	pipeline(path, `test:breakage`)
	expect(events(path)).toEqual([`prelude`, `build`, `breakage`, `prelude`])
	write(path, `.release`, `release-b`)
	pipeline(path, `test:breakage`)
	expect(events(path)).toEqual([
		`prelude`,
		`build`,
		`breakage`,
		`prelude`,
		`prelude`,
		`breakage`,
	])
	rmSync(join(path, `.release`))
	expect(() => pipeline(path, `test:breakage`)).toThrow()
	expect(events(path).at(-1)).toBe(`breakage`)
}, 30_000)

test(`application bundles restore both output directories`, () => {
	const path = fixture()
	pipeline(path, `build`)
	rmSync(join(path, `apps/app/app`), { recursive: true })
	rmSync(join(path, `apps/app/bin`), { recursive: true })
	pipeline(path, `build`)
	expect(
		readFileSync(join(path, `events`), `utf8`)
			.split(`\n`)
			.filter((event) => event === `bundle`),
	).toHaveLength(1)
	for (const dir of [`app`, `bin`]) {
		expect(
			readFileSync(join(path, `apps/app`, dir, `result.bun.js`), `utf8`),
		).toBe(`bundle`)
	}
}, 30_000)

test(`dry runs emit the graph without refreshing the release baseline`, () => {
	const path = fixture()
	const output = pipeline(path, `test:breakage`, [`--dry-run`, `--json`])
	expect(
		JSON.parse(output).tasks.some(
			(task: { script: string }) => task.script === `test:breakage`,
		),
	).toBe(true)
	expect(() => events(path)).toThrow()
}, 30_000)

test(`filtered runs use the selected dependency closure`, () => {
	const path = fixture()
	const args = [`--filter`, `comline...`]
	const graph = JSON.parse(
		pipeline(path, `test`, [...args, `--dry-run`, `--json`]),
	) as {
		tasks: { project: string }[]
	}
	expect([...new Set(graph.tasks.map((task) => task.project))].sort()).toEqual([
		`packages/comline`,
		`packages/lib`,
	])
	pipeline(path, `test`, args)
	expect(events(path)).toEqual([`build`, `test`])
	expect(readFileSync(join(path, `events`), `utf8`)).not.toContain(`bundle`)
}, 30_000)
