import { randomUUID } from "node:crypto"
import {
	chmod,
	lstat,
	mkdir,
	readdir,
	readFile,
	realpath,
	rm,
	writeFile,
} from "node:fs/promises"
import path from "node:path"

import type { SimpleGit } from "simple-git"
import simpleGit from "simple-git"

import { withDirectoryLock } from "./directory-lock"

type ActiveCheck = {
	pid: number
	paths: string[]
	head: string
	recoveryRequired?: boolean
}

type TestFileState = {
	isClean: () => Promise<boolean>
	replaceTests: (
		release: string,
		files: string[],
	) => Promise<() => Promise<void>>
}

function assertContained(root: string, filename: string): void {
	const relative = path.relative(root, filename)
	if (
		relative === `..` ||
		relative.startsWith(`..${path.sep}`) ||
		path.isAbsolute(relative)
	) {
		throw new Error(`Cannot replace tests outside the worktree: ${filename}.`)
	}
}

async function validateParents(
	root: string,
	filenames: string[],
): Promise<void> {
	const checked = new Set<string>()
	for (const filename of filenames) {
		assertContained(root, filename)
		for (let parent = path.dirname(filename); ; parent = path.dirname(parent)) {
			if (checked.has(parent)) break
			const stats = await lstat(parent).catch(
				(thrown: NodeJS.ErrnoException) => {
					if (thrown.code !== `ENOENT`) throw thrown
				},
			)
			if (stats && !stats.isDirectory())
				throw new Error(`Cannot replace tests through ${parent}.`)
			checked.add(parent)
			if (parent === root) break
		}
	}
}

// This lock covers Git setup and restoration only. Commands run after it is released.
export async function withTestFileState<T>(
	git: SimpleGit,
	baseDirname: string,
	action: (state: TestFileState) => Promise<T>,
): Promise<T> {
	const root = await realpath(await git.revparse([`--show-toplevel`]))
	baseDirname = await realpath(baseDirname)
	assertContained(root, baseDirname)
	const stateDirectory = path.join(
		await git.revparse([`--absolute-git-dir`]),
		`break-check`,
	)
	await mkdir(stateDirectory, { recursive: true })
	const lock = path.join(stateDirectory, `lock`)
	return withDirectoryLock(lock, async () => {
		const activeChecks: ActiveCheck[] = []
		for (const entry of await readdir(stateDirectory)) {
			if (!entry.endsWith(`.json`)) continue
			const recordPath = path.join(stateDirectory, entry)
			const record = JSON.parse(
				await readFile(recordPath, `utf8`),
			) as ActiveCheck
			let interrupted = record.recoveryRequired
			try {
				process.kill(record.pid, 0)
			} catch (thrown) {
				if ((thrown as NodeJS.ErrnoException).code !== `EPERM`)
					interrupted = true
			}
			if (interrupted)
				throw new Error(
					`A break-check run needs recovery. Restore the test paths recorded in ${recordPath} before removing that record.`,
				)
			activeChecks.push(record)
		}
		const activePaths = activeChecks.flatMap((record) => record.paths)
		return action({
			isClean: async () =>
				!(await simpleGit(root).raw([
					`--no-optional-locks`,
					`status`,
					`--porcelain`,
					`--untracked-files=all`,
					`--`,
					`.`,
					...activePaths.map((file) => `:(top,literal,exclude)${file}`),
				])),
			replaceTests: async (release, files) => {
				const paths = files.map((file) =>
					path
						.relative(root, path.resolve(baseDirname, file))
						.split(path.sep)
						.join(`/`),
				)
				for (const file of paths) {
					if (
						activePaths.some(
							(active) =>
								file === active ||
								file.startsWith(`${active}/`) ||
								active.startsWith(`${file}/`),
						)
					) {
						throw new Error(
							`Another break-check run is using ${file}. Concurrent checks must use disjoint test paths.`,
						)
					}
				}
				const head = await git.revparse([`HEAD`])
				const currentFiles = new Set(
					(await git.raw([`ls-tree`, `-r`, `--name-only`, `-z`, head]))
						.split(`\0`)
						.filter(Boolean),
				)
				const existing = files.filter((file) => currentFiles.has(file))
				const absent = files.filter((file) => !currentFiles.has(file))
				const modes = new Map<string, number>()
				const filenames = files.map((file) => path.resolve(baseDirname, file))
				await validateParents(root, filenames)
				for (const file of files) {
					const filename = path.resolve(baseDirname, file)

					const stats = await lstat(filename).catch(
						(thrown: NodeJS.ErrnoException) => {
							if (thrown.code !== `ENOENT`) throw thrown
						},
					)
					if (!currentFiles.has(file) && stats)
						throw new Error(
							`Cannot overwrite the existing untracked path ${filename}.`,
						)
					if (stats?.isFile()) modes.set(filename, stats.mode)
				}
				const recordPath = path.join(stateDirectory, `${randomUUID()}.json`)
				const record: ActiveCheck = { pid: process.pid, paths, head }
				await writeFile(recordPath, JSON.stringify(record))
				const restore = async () => {
					await writeFile(
						recordPath,
						JSON.stringify({ ...record, recoveryRequired: true }),
					)
					await validateParents(root, filenames)
					if (existing.length)
						await git.raw([
							`--literal-pathspecs`,
							`restore`,
							`--source=${head}`,
							`--worktree`,
							`--`,
							...existing,
						])
					for (const file of absent)
						await rm(path.resolve(baseDirname, file), { force: true })
					for (const [filename, mode] of modes) await chmod(filename, mode)
					await rm(recordPath)
				}
				try {
					await git.raw([
						`--literal-pathspecs`,
						`restore`,
						`--source=${release}`,
						`--worktree`,
						`--`,
						...files,
					])
				} catch (thrown) {
					await restore()
					throw thrown
				}
				return () => withDirectoryLock(lock, restore, true)
			},
		})
	})
}
