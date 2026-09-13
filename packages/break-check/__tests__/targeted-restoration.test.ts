import { existsSync, mkdtempSync, rmSync } from "node:fs"
import {
	chmod,
	lstat,
	mkdir,
	readdir,
	readFile,
	rm,
	writeFile,
} from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { setTimeout } from "node:timers/promises"

import { afterEach, beforeEach, expect, it } from "bun:test"
import simpleGit from "simple-git"

import { breakCheck } from "../src/break-check"

let temporaryDirectory: string
let repository: string

beforeEach(async () => {
	temporaryDirectory = mkdtempSync(path.join(tmpdir(), `break-check-targeted-`))
	repository = path.join(temporaryDirectory, `repository`)
	const remote = path.join(temporaryDirectory, `remote.git`)
	await mkdir(repository)
	await mkdir(remote)
	await simpleGit(remote).init([`--bare`])
	await simpleGit(repository)
		.init()
		.addConfig(`user.name`, `Break Check Test`)
		.addConfig(`user.email`, `break-check@example.invalid`)
		.addRemote(`origin`, remote)
})

afterEach(() => {
	rmSync(temporaryDirectory, { recursive: true, force: true })
})

async function write(relativePath: string, content: string): Promise<void> {
	const filename = path.join(repository, relativePath)
	await mkdir(path.dirname(filename), { recursive: true })
	await writeFile(filename, content)
}

async function release(): Promise<void> {
	await simpleGit(repository)
		.add(`.`)
		.commit(`Release`)
		.addTag(`example@1.0.0`)
		.push([`--tags`, `origin`])
}

function shellQuote(value: string): string {
	return `'${value.replaceAll(`'`, `'"'"'`)}'`
}

it.each([0, 1])(
	`restores only replaced tests when the command exits %i`,
	async (exitCode) => {
		const testFilename = `public tests/line\nbreak.test.js`
		await write(`package/${testFilename}`, `released`)
		await write(`package/public tests/removed.test.js`, `released`)
		await write(`package/notes.txt`, `original`)
		await release()
		await write(`package/${testFilename}`, `current`)
		await chmod(path.join(repository, `package/${testFilename}`), 0o755)
		await rm(path.join(repository, `package/public tests/removed.test.js`))
		const git = simpleGit(repository)
		await git.add(`.`).commit(`Current tests`)
		await write(`package/notes.txt`, `saved stash`)
		await git.stash([`push`, `-m`, `existing stash`])
		const stashBefore = await git.raw([`stash`, `list`])
		const indexBefore = await readFile(path.join(repository, `.git/index`))
		const headBefore = await git.revparse([`HEAD`])
		const modeBefore = (
			await lstat(path.join(repository, `package/${testFilename}`))
		).mode
		const command = path.join(temporaryDirectory, `test.ts`)
		await writeFile(
			command,
			`
import { strict as assert } from "node:assert";
assert.equal(process.cwd(), ${JSON.stringify(path.join(repository, `package`))});
assert.equal(await Bun.file(${JSON.stringify(testFilename)}).text(), "released");
assert.equal(await Bun.file("public tests/removed.test.js").text(), "released");
assert.equal(Bun.spawnSync(["git", "diff", "--cached", "--exit-code"]).exitCode, 0);
await Bun.write("notes.txt", "test command edit");
await Bun.write("artifact.txt", "test command output");
process.exit(${exitCode});
`,
		)
		const outcome = await breakCheck({
			baseDirname: path.join(repository, `package`),
			tagPattern: `example@`,
			testPattern: `public tests/*.test.js`,
			testCommand: `${shellQuote(process.execPath)} ${shellQuote(command)}`,
			certifyCommand: `exit 1`,
		})
		expect(outcome).toMatchObject({ breakingChangesFound: exitCode !== 0 })
		if (exitCode !== 0) expect(outcome).toMatchObject({ testResult: `` })
		expect(
			await readFile(path.join(repository, `package/${testFilename}`), `utf8`),
		).toBe(`current`)
		expect(
			(await lstat(path.join(repository, `package/${testFilename}`))).mode,
		).toBe(modeBefore)
		expect(
			existsSync(path.join(repository, `package/public tests/removed.test.js`)),
		).toBe(false)
		expect(
			await readFile(path.join(repository, `package/notes.txt`), `utf8`),
		).toBe(`test command edit`)
		expect(
			await readFile(path.join(repository, `package/artifact.txt`), `utf8`),
		).toBe(`test command output`)
		expect(await readFile(path.join(repository, `.git/index`))).toEqual(
			indexBefore,
		)
		expect(await git.revparse([`HEAD`])).toBe(headBefore)
		expect(await git.raw([`stash`, `list`])).toBe(stashBefore)
		expect(await readdir(path.join(repository, `.git/break-check`))).toEqual([])
	},
)

async function waitForFile(filename: string): Promise<void> {
	const deadline = Date.now() + 5000
	while (!existsSync(filename)) {
		if (Date.now() > deadline)
			throw new Error(`Timed out waiting for ${filename}`)
		await setTimeout(10)
	}
}

for (const fromRoot of [false, true]) {
	it(`runs package checks in parallel from ${fromRoot ? `the root` : `package directories`}`, async () => {
		await write(`a/public.test.js`, `released a`)
		await write(`b/public.test.js`, `released b`)
		await release()
		await write(`a/public.test.js`, `current a`)
		await write(`b/public.test.js`, `current b`)
		const git = simpleGit(repository)
		await git.add(`.`).commit(`Current tests`)
		const testCommand = path.join(temporaryDirectory, `test.ts`)
		await writeFile(
			testCommand,
			`
import { strict as assert } from "node:assert";
const name = process.argv[2];
const filename = ${JSON.stringify(repository)} + "/" + name + "/public.test.js";
assert.equal(process.cwd(), ${JSON.stringify(repository)} + ${fromRoot ? `""` : `"/" + name`});
assert.equal(await Bun.file(filename).text(), "released " + name);
assert.equal(Bun.spawnSync(["git", "diff", "--cached", "--exit-code"]).exitCode, 0);
await Bun.write(${JSON.stringify(temporaryDirectory)} + "/testing-" + name, "ready");
const deadline = Date.now() + 10000;
while (!(await Bun.file(${JSON.stringify(temporaryDirectory)} + "/release-" + name).exists())) {
  if (Date.now() > deadline) throw new Error("Timed out waiting for release");
  await Bun.sleep(10);
}
assert.equal(await Bun.file(filename).text(), "released " + name);
`,
		)
		const runner = path.join(temporaryDirectory, `runner.ts`)
		await writeFile(
			runner,
			`
import { breakCheck } from ${JSON.stringify(path.resolve(import.meta.dir, `../src/break-check.ts`))};
const name = process.argv[2];
const result = await breakCheck({
  baseDirname: ${JSON.stringify(repository)} + ${fromRoot ? `""` : `"/" + name`},
  tagPattern: "example@",
  testPattern: ${fromRoot ? `name + "/"` : `""`} + "*.test.js",
  testCommand: ${JSON.stringify(`${shellQuote(process.execPath)} ${shellQuote(testCommand)} `)} + name,
  certifyCommand: "exit 1",
});
console.log(JSON.stringify(result));
`,
		)
		const first = Bun.spawn([process.execPath, runner, `a`], {
			stdout: `pipe`,
			stderr: `pipe`,
		})
		let second: ReturnType<typeof Bun.spawn> | undefined
		try {
			await waitForFile(path.join(temporaryDirectory, `testing-a`))
			const options = {
				baseDirname: repository,
				tagPattern: `example@`,
				testPattern: `a/*.test.js`,
				testCommand: `exit 0`,
				certifyCommand: `exit 1`,
			}
			await rejects(
				breakCheck(options),
				/Concurrent checks must use disjoint test paths/,
			)
			await write(`unrelated.txt`, `uncommitted`)
			expect(
				await breakCheck({ ...options, testPattern: `b/*.test.js` }),
			).toMatchObject({ gitWasClean: false })
			await rm(path.join(repository, `unrelated.txt`))
			const next = Bun.spawn([process.execPath, runner, `b`], {
				stdout: `pipe`,
				stderr: `pipe`,
			})
			second = next
			await waitForFile(path.join(temporaryDirectory, `testing-b`))
			expect(
				await readFile(path.join(repository, `a/public.test.js`), `utf8`),
			).toBe(`released a`)
			expect(
				await readFile(path.join(repository, `b/public.test.js`), `utf8`),
			).toBe(`released b`)
			await writeFile(path.join(temporaryDirectory, `release-a`), `go`)
			expect(await first.exited).toBe(0)
			expect(
				await readFile(path.join(repository, `a/public.test.js`), `utf8`),
			).toBe(`current a`)
			expect(
				await readFile(path.join(repository, `b/public.test.js`), `utf8`),
			).toBe(`released b`)
			await writeFile(path.join(temporaryDirectory, `release-b`), `go`)
			for (const child of [first, next]) {
				const [exitCode, stdout, stderr] = await Promise.all([
					child.exited,
					new Response(child.stdout).text(),
					new Response(child.stderr).text(),
				])
				expect(stderr).toBe(``)
				expect(exitCode).toBe(0)
				expect(JSON.parse(stdout)).toMatchObject({ breakingChangesFound: false })
			}
			expect((await git.status()).isClean()).toBe(true)
			expect(await git.raw([`stash`, `list`])).toBe(``)
			expect(await readdir(path.join(repository, `.git/break-check`))).toEqual(
				[],
			)
		} finally {
			first.kill()
			second?.kill()
			await Promise.all([first.exited, second?.exited])
		}
	}, 15000)
}

it(`does not overwrite ignored files that occupy release-only test paths`, async () => {
	await write(`public.test.js`, `released`)
	await write(`.gitignore`, `public.test.js\n`)
	await simpleGit(repository).add([`-f`, `public.test.js`])
	await release()
	await simpleGit(repository).rm([`public.test.js`]).commit(`Remove test`)
	await write(`public.test.js`, `ignored local file`)
	await rejects(
		breakCheck({
			baseDirname: repository,
			tagPattern: `example@`,
			testPattern: `*.test.js`,
			testCommand: `exit 0`,
			certifyCommand: `exit 1`,
		}),
		/Cannot overwrite the existing untracked path/,
	)
	expect(await readFile(path.join(repository, `public.test.js`), `utf8`)).toBe(
		`ignored local file`,
	)
	expect(await readdir(path.join(repository, `.git/break-check`))).toEqual([])
})

it(`supports linked Git worktrees`, async () => {
	await write(`public.test.js`, `released`)
	await release()
	await write(`public.test.js`, `current`)
	const git = simpleGit(repository)
	await git.add(`.`).commit(`Current tests`)
	const linkedWorktree = path.join(temporaryDirectory, `linked-worktree`)
	await git.raw([`worktree`, `add`, `--detach`, linkedWorktree, `HEAD`])
	const outcome = await breakCheck({
		baseDirname: linkedWorktree,
		tagPattern: `example@`,
		testPattern: `*.test.js`,
		testCommand: `${shellQuote(process.execPath)} -e ${shellQuote(`if (await Bun.file("public.test.js").text() !== "released") process.exit(1)`)}`,
		certifyCommand: `exit 1`,
	})
	expect(outcome).toMatchObject({ breakingChangesFound: false })
	expect(
		await readFile(path.join(linkedWorktree, `public.test.js`), `utf8`),
	).toBe(`current`)
	expect(await readFile(path.join(repository, `public.test.js`), `utf8`)).toBe(
		`current`,
	)
	const linkedGitDirectory = await simpleGit(linkedWorktree).revparse([
		`--absolute-git-dir`,
	])
	expect(await readdir(path.join(linkedGitDirectory, `break-check`))).toEqual([])
})
import { rejects } from "node:assert/strict"
