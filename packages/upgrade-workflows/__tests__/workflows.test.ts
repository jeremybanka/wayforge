import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import * as releases from "../src/releases.ts"
import { upgradeWorkflows } from "../src/workflows.ts"

vi.mock(`../src/releases.ts`, async (importOriginal) => ({
	...(await importOriginal<typeof releases>()),
	latestRelease: vi.fn(),
}))

const old = `1`.repeat(40)
const next = `2`.repeat(40)
let root: string

beforeEach(async () => {
	root = await mkdtemp(path.join(os.tmpdir(), `upgrade-workflows-`))
	vi.mocked(releases.latestRelease)
		.mockReset()
		.mockResolvedValue({ version: `2.3.4`, commit: next })
})

afterEach(async () => {
	await rm(root, { recursive: true, force: true })
})

function workflow(steps: string): string {
	return `on: push\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n${steps}\n`
}

async function fixture(
	source: string,
	name = `.github/workflows/test.yml`,
): Promise<string> {
	const file = path.join(root, name)
	await mkdir(path.dirname(file), { recursive: true })
	await writeFile(file, source)
	return file
}

describe(`workflow upgrades`, () => {
	it(`preserves quotes, CRLF, comments, and all other bytes`, async () => {
		const source = workflow(
			`      - uses: "owner/action@${old}" # v1.0.0 reviewed: café\n      - run: echo unchanged`,
		).replaceAll(`\n`, `\r\n`)
		const file = await fixture(source)
		const result = await upgradeWorkflows({ cwd: root })
		expect(await readFile(file, `utf8`)).toBe(
			source.replace(old, next).replace(`# v1.0.0`, `# v2.3.4`),
		)
		expect(result.files).toEqual([file])
		expect(result.updates[0]?.changed).toBe(true)
	})

	it(`pins tags and preserves explanatory comments`, async () => {
		const file = await fixture(
			workflow(
				`      - uses: owner/action@v1 # reviewed\n      - uses: 'owner/action@v1.0.0'`,
			),
		)
		await upgradeWorkflows({ cwd: root })
		const source = await readFile(file, `utf8`)
		expect(source).toContain(`uses: owner/action@${next} # v2.3.4 reviewed`)
		expect(source).toContain(`uses: 'owner/action@${next}' # v2.3.4`)
		expect(releases.latestRelease).toHaveBeenCalledTimes(1)
	})

	it(`handles composite actions, subpaths, and reusable workflows with one lookup per repository`, async () => {
		const composite = await fixture(
			`runs:\n  using: composite\n  steps:\n    - uses: owner/actions/setup@v1\n      shell: bash\n`,
			`.github/actions/setup/action.yaml`,
		)
		const reusable = await fixture(
			`jobs:\n  check:\n    uses: owner/actions/.github/workflows/check.yml@v1\n`,
			`.github/workflows/reusable.yml`,
		)
		await upgradeWorkflows({ cwd: root })
		expect(await readFile(composite, `utf8`)).toContain(
			`owner/actions/setup@${next} # v2.3.4`,
		)
		expect(await readFile(reusable, `utf8`)).toContain(
			`owner/actions/.github/workflows/check.yml@${next} # v2.3.4`,
		)
		expect(releases.latestRelease).toHaveBeenCalledExactlyOnceWith(
			`owner/actions`,
		)
	})

	it(`updates mise only within its own with block, even if the action has a custom SHA`, async () => {
		vi.mocked(releases.latestRelease).mockImplementation((repository) =>
			Promise.resolve({
				version: repository === `jdx/mise` ? `2026.9.1` : `2.3.4`,
				commit: next,
			}),
		)
		const source = workflow(
			`      - uses: jdx/mise-action@${old}\n        with:\n          version: "2026.1.1" # pinned tool\n      - uses: jdx/mise-action@v1\n      - uses: owner/action@v1\n        with:\n          version: 2025.1.1`,
		)
		const file = await fixture(source)
		await upgradeWorkflows({ cwd: root })
		const updated = await readFile(file, `utf8`)
		expect(updated).toContain(`version: "2026.9.1" # pinned tool`)
		expect(updated).toContain(`version: 2025.1.1`)
		expect(updated).toContain(`jdx/mise-action@${old}`)
		expect(releases.latestRelease).toHaveBeenCalledWith(`jdx/mise`)
	})

	it(`ignores shell text, custom pins, YAML aliases, and unrelated files`, async () => {
		const source = workflow(
			`      - run: |\n          uses: owner/fake@v1\n      - uses: ./local/action\n      - uses: ./local/action@v1\n      - uses: docker://alpine:3\n      - uses: owner/action@main # v1\n      - uses: owner/action@${old}\n      - uses: &action owner/action@v1\n      - uses: *action\n      - { uses: owner/action@v1 }`,
		)
		const file = await fixture(source)
		await fixture(`uses: owner/action@v1\n`, `.github/dependabot.yml`)
		const result = await upgradeWorkflows({ cwd: root })
		expect(result.updates).toEqual([])
		expect(await readFile(file, `utf8`)).toBe(source)
		expect(releases.latestRelease).not.toHaveBeenCalled()
	})

	it(`dry runs plan exactly the same edits without writing`, async () => {
		const source = workflow(`      - uses: owner/action@v1`)
		const file = await fixture(source)
		const dry = await upgradeWorkflows({ cwd: root, dryRun: true })
		expect(await readFile(file, `utf8`)).toBe(source)
		const applied = await upgradeWorkflows({ cwd: root })
		expect(dry).toEqual(applied)
	})

	it(`does not downgrade newer stable or prerelease refs`, async () => {
		const source = workflow(
			`      - uses: owner/action@v3.0.0\n      - uses: owner/action@v3.0.0-beta.1`,
		)
		const file = await fixture(source)
		expect((await upgradeWorkflows({ cwd: root })).files).toEqual([])
		expect(await readFile(file, `utf8`)).toBe(source)
	})

	it(`compares each SHA separately even when version annotations agree`, async () => {
		const file = await fixture(
			workflow(
				`      - uses: owner/action@${next} # v2.3.4\n      - uses: owner/action@${old} # v2.3.4`,
			),
		)
		const result = await upgradeWorkflows({ cwd: root })
		expect(result.updates.map((update) => update.changed)).toEqual([false, true])
		expect(await readFile(file, `utf8`)).not.toContain(old)
	})

	it(`is idempotent and makes no lookup for an empty repository`, async () => {
		expect(await upgradeWorkflows({ cwd: root })).toEqual({
			files: [],
			updates: [],
		})
		expect(releases.latestRelease).not.toHaveBeenCalled()
		await fixture(workflow(`      - uses: owner/action@v1`))
		await upgradeWorkflows({ cwd: root })
		expect((await upgradeWorkflows({ cwd: root })).files).toEqual([])
	})

	it(`does not write any files if a remote lookup fails`, async () => {
		const source = workflow(`      - uses: owner/action@v1`)
		const file = await fixture(source)
		await fixture(
			workflow(`      - uses: owner/missing@v1`),
			`.github/workflows/other.yml`,
		)
		vi.mocked(releases.latestRelease).mockImplementation((repository) => {
			if (repository === `owner/missing`)
				return Promise.reject(new Error(`remote unavailable`))
			return Promise.resolve({ version: `2.3.4`, commit: next })
		})
		await expect(upgradeWorkflows({ cwd: root })).rejects.toThrow(
			`remote unavailable`,
		)
		expect(await readFile(file, `utf8`)).toBe(source)
	})

	it(`rejects invalid YAML before looking up tags or writing files`, async () => {
		await fixture(workflow(`      - uses: owner/action@v1`))
		await fixture(`jobs: [\n`, `.github/workflows/broken.yml`)
		await expect(upgradeWorkflows({ cwd: root })).rejects.toThrow(
			`Invalid workflow YAML`,
		)
		expect(releases.latestRelease).not.toHaveBeenCalled()
	})

	it(`refuses to overwrite a file edited during remote resolution`, async () => {
		const file = await fixture(workflow(`      - uses: owner/action@v1`))
		vi.mocked(releases.latestRelease).mockImplementationOnce(async () => {
			await writeFile(file, `# user edit\n`)
			return Promise.resolve({ version: `2.3.4`, commit: next })
		})
		await expect(upgradeWorkflows({ cwd: root })).rejects.toThrow(
			`Workflow changed while resolving upgrades`,
		)
		expect(await readFile(file, `utf8`)).toBe(`# user edit\n`)
	})
})
