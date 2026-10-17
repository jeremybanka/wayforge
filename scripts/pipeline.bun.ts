#!/usr/bin/env bun

import { createHash } from "node:crypto"
import { existsSync, lstatSync, readFileSync, readlinkSync } from "node:fs"
import { basename, resolve } from "node:path"
import { parseEnv } from "node:util"

import { Glob } from "bun"

const root = resolve(import.meta.dir, `..`)
const [name, ...args] = process.argv.slice(2)
if (!name)
	throw new Error(`Usage: bun scripts/pipeline.bun.ts <pipeline> [options]`)

const dryRun = args.includes(`--dry-run`)
const env = { ...process.env }
// GitHub supplies unset secrets as empty strings; pnpm expects absent settings.
for (const key of Object.keys(env)) {
	if (key.startsWith(`PNPM_REMOTE_CACHE_`) && !env[key]) delete env[key]
}
const token = env[`PNPM_REMOTE_CACHE_TOKEN`]
const cacheUrl = env[`PNPM_REMOTE_CACHE_URL`]
if (token && cacheUrl) {
	const url = new URL(cacheUrl)
	const path = url.pathname.replace(/\/?$/, `/`)
	env[`pnpm_config_//${url.host}${path}:_authToken`] = token
}
delete env[`PNPM_REMOTE_CACHE_TOKEN`]

async function run(command: string[]): Promise<void> {
	const child = Bun.spawn(command, {
		cwd: root,
		env,
		stdin: `inherit`,
		stdout: `inherit`,
		stderr: `inherit`,
	})
	const interrupt = (): void => child.kill(`SIGINT`)
	const terminate = (): void => child.kill(`SIGTERM`)
	process.on(`SIGINT`, interrupt)
	process.on(`SIGTERM`, terminate)
	const status = await child.exited
	process.off(`SIGINT`, interrupt)
	process.off(`SIGTERM`, terminate)
	if (status !== 0) process.exit(status)
}

// pnpm hashes the graph before executing it, and cannot hash inputs outside a
// package or gitignored files. Refresh the release snapshot before that point.
if (name === `test:breakage` && !dryRun) {
	await run([`pnpm`, `-r`, `run`, `test:breakage:prelude`])
	env[`WAYFORGE_BREAKAGE_BASELINE`] = createHash(`sha256`)
		.update(
			readFileSync(resolve(root, `packages/comline/.breakage/baseline.json`)),
		)
		.digest(`hex`)
}

// Share root configuration and local environment files with every package's
// cache key. Package sources remain pnpm's inputs, so unrelated package edits
// do not invalidate the whole workspace.
const files = Bun.spawnSync(
	[
		`git`,
		`ls-files`,
		`-z`,
		`--cached`,
		`--others`,
		`--exclude-standard`,
		`--`,
		`.`,
		`:!apps`,
		`:!packages`,
	],
	{ cwd: root, stderr: `inherit` },
)
if (files.exitCode !== 0) process.exit(files.exitCode)
const paths = new Set(files.stdout.toString().split(`\0`).filter(Boolean))
for (const pattern of [`.env*`, `{apps,packages}/*/.env*`]) {
	for (const path of new Glob(pattern).scanSync({ cwd: root, dot: true })) {
		paths.add(path)
	}
}
const context = createHash(`sha256`).update(`bun:${Bun.version}\0`)
// Vite also accepts inherited VITE_* values, which override its env files.
for (const key of Object.keys(env)
	.filter((key) => key.startsWith(`VITE_`))
	.sort()) {
	context.update(`${key}\0${env[key]}\0`)
}
for (const path of [...paths].sort()) {
	const absolute = resolve(root, path)
	if (!existsSync(absolute)) continue
	context.update(`${path}\0`)
	// Tempest's environment setup can append an existing assignment. Fingerprint
	// effective values so repeated equivalent assignments do not defeat caching.
	if (basename(path).startsWith(`.env`)) {
		const values = parseEnv(readFileSync(absolute, `utf8`))
		context.update(JSON.stringify(Object.entries(values).sort()))
		context.update(`\0`)
		continue
	}
	context.update(
		lstatSync(absolute).isSymbolicLink()
			? `symlink:${readlinkSync(absolute)}`
			: readFileSync(absolute),
	)
	context.update(`\0`)
}
env[`WAYFORGE_PIPELINE_CONTEXT`] = context.digest(`hex`)
const revision = resolve(root, `git.sha`)
env[`WAYFORGE_COVERAGE_REVISION`] = existsSync(revision)
	? readFileSync(revision, `utf8`).trim()
	: ``

// The pipeline command currently ignores --filter. Delegate scoped runs to
// pnpm's recursive graph instead; it honors selectors but does not cache.
const scoped = args.some((arg) => /^--filter(?:-prod)?(?:=|$)|^-F/.test(arg))
await run(
	scoped
		? [
				`pnpm`,
				...(dryRun && args.includes(`--json`) ? [`--reporter=silent`] : []),
				`-r`,
				`run`,
				...args.filter((arg) => arg !== `--no-cache`),
				name,
			]
		: [`pnpm`, `pipeline`, name, `--full`, ...args],
)
