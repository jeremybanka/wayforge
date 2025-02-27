import { createHash } from "node:crypto"
import path from "node:path"

import { file } from "bun"
import type { SimpleGit } from "simple-git"

import { env } from "./recoverage.env"

export async function getDefaultBranchHashRef(
	git: SimpleGit,
	defaultBranch: string,
	mark?: (text: string) => void,
): Promise<string> {
	if (env.CI) {
		await git.fetch(
			`origin`,
			defaultBranch,
			env.CI ? { "--depth": `1` } : undefined,
		)
		mark?.(`fetched origin/${defaultBranch}`)
		const sha = await git.revparse([`origin/${defaultBranch}`])
		return sha.slice(0, 7)
	}
	const sha = await git.revparse([defaultBranch])
	return sha.slice(0, 7)
}

export async function hashRepoState(
	git: SimpleGit,
	mark?: (text: string) => void,
): Promise<string> {
	const { current, branches } = await git.branch()
	const gitStatus = await git.status()
	const gitIsClean = gitStatus.isClean()
	mark?.(`git status is clean: ${gitIsClean}`)
	let currentGitRef = branches[current].commit.slice(0, 7)
	if (!gitIsClean) {
		const gitDiff = await git.diff()
		const gitRootFolder = await git.revparse(`--show-toplevel`)
		const gitStatusHash = createHash(`sha256`).update(gitDiff)
		const untrackedFileData = await Promise.all(
			gitStatus.files
				.filter((f) => f.index === `?`)
				.map(async (f) => {
					const fullPath = path.resolve(gitRootFolder, f.path)
					const fileText = await file(fullPath).text()
					return `UNTRACKED: ${fileText}`
				}),
		)
		for (const fileData of untrackedFileData) {
			gitStatusHash.update(fileData)
		}
		const diffHash = gitStatusHash.digest(`hex`).slice(0, currentGitRef.length)
		currentGitRef = `${currentGitRef}+${diffHash}`

		mark?.(`git status hash created: ${diffHash}`)
	}
	return currentGitRef
}
