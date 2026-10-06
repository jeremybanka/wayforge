import { randomUUID } from "node:crypto"
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import path from "node:path"

import type { SimpleGit } from "simple-git"
import { simpleGit } from "simple-git"

import { withDirectoryLock } from "./directory-lock"
import { latestReleaseTag } from "./release-tag"

export type BaselineOptions = {
	tagPattern?: string | undefined
	baseDirname?: string
}

export type BreakCheckPreludeOptions = BaselineOptions & { out: string }

export type BreakCheckBaseline = {
	version: 1
	tagPattern: string | null
	packageDirectory: string
	ref: string
	commit: string
}

const objectId = /^[a-f0-9]{40}(?:[a-f0-9]{24})?$/

function isBaseline(value: unknown): value is BreakCheckBaseline {
	if (typeof value !== `object` || value === null) return false
	const record = value as Partial<BreakCheckBaseline>
	return (
		record.version === 1 &&
		(record.tagPattern === null || typeof record.tagPattern === `string`) &&
		typeof record.packageDirectory === `string` &&
		typeof record.ref === `string` &&
		record.ref.startsWith(`refs/tags/`) &&
		typeof record.commit === `string` &&
		objectId.test(record.commit)
	)
}

/** Resolve and fetch a release without running tests or changing the worktree. */
export async function breakCheckPrelude({
	out,
	tagPattern,
	baseDirname = process.cwd(),
}: BreakCheckPreludeOptions): Promise<BreakCheckBaseline> {
	const filename = path.resolve(baseDirname, out)
	const temporaryPath = `${filename}.${randomUUID()}.tmp`
	let canInvalidate = false
	try {
		const git = simpleGit(baseDirname)
		// An ignored, untracked snapshot cannot make the compatibility check dirty.
		if (!(await git.raw([`check-ignore`, `--`, filename])).trim()) {
			throw new Error(`Baseline output must be gitignored: ${filename}.`)
		}
		canInvalidate = true
		const remoteTags = await git.listRemote([`--tags`, `origin`])
		const ref = latestReleaseTag(remoteTags, tagPattern)
		if (!ref) {
			throw new Error(`No tags found matching the pattern "${tagPattern}".`)
		}
		const refs = new Map(
			remoteTags
				.trim()
				.split(`\n`)
				.map((line) => {
					const [sha, name] = line.split(`\t`)
					return [name, sha]
				}),
		)
		// ls-remote supplies the peeled commit for annotated tags.
		const commit = refs.get(`${ref}^{}`) ?? refs.get(ref)
		if (!commit || !objectId.test(commit)) {
			throw new Error(`Could not resolve the release commit for ${ref}.`)
		}
		const commonGitDirectory = await git.revparse([
			`--path-format=absolute`,
			`--git-common-dir`,
		])
		await withDirectoryLock(
			path.join(commonGitDirectory, `break-check-fetch.lock`),
			() => git.fetch([`origin`, commit, `--no-tags`, `--no-write-fetch-head`]),
		)
		if ((await git.raw([`cat-file`, `-t`, commit])).trim() !== `commit`) {
			throw new Error(`Release ${ref} does not resolve to a commit.`)
		}
		const baseline: BreakCheckBaseline = {
			version: 1,
			tagPattern: tagPattern ?? null,
			packageDirectory: await git.revparse([`--show-prefix`]),
			ref,
			commit,
		}
		await mkdir(path.dirname(filename), { recursive: true })
		await writeFile(temporaryPath, `${JSON.stringify(baseline, null, 2)}\n`, {
			flag: `wx`,
		})
		await rename(temporaryPath, filename)
		return baseline
	} catch (cause) {
		// A failed refresh must never leave an older snapshot available as fallback.
		if (canInvalidate) await rm(filename, { force: true })
		throw new Error(`Failed to prepare baseline ${filename}.`, { cause })
	} finally {
		await rm(temporaryPath, { force: true })
	}
}

export async function readBaseline(
	git: SimpleGit,
	filename: string,
	{ tagPattern }: BaselineOptions,
): Promise<BreakCheckBaseline> {
	try {
		const baseline: unknown = JSON.parse(await readFile(filename, `utf8`))
		if (!isBaseline(baseline)) throw new Error(`Invalid baseline fields.`)
		if (
			baseline.tagPattern !== (tagPattern ?? null) ||
			baseline.packageDirectory !== (await git.revparse([`--show-prefix`]))
		) {
			throw new Error(`Baseline belongs to a different package or tag pattern.`)
		}
		if (
			(
				await git.raw([`check-ref-format`, `--normalize`, baseline.ref])
			).trim() !== baseline.ref
		) {
			throw new Error(`Invalid release ref.`)
		}
		if (
			(await git.raw([`cat-file`, `-t`, baseline.commit])).trim() !== `commit`
		) {
			throw new Error(`Pinned object is not a locally available commit.`)
		}
		return baseline
	} catch (cause) {
		throw new Error(
			`Missing, invalid, or unusable baseline ${filename}. Run break-check prelude again.`,
			{ cause },
		)
	}
}
