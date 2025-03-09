import { createHash } from "node:crypto"
import path from "node:path"

import { file } from "bun"
import { type SimpleGit, simpleGit } from "simple-git"

import { logger } from "./logger"
import { env } from "./recoverage.env"

export type GitToolkit = {
	_client: SimpleGit | undefined
	_baseRef: string | undefined
	_currentRef: string | undefined
	get client(): SimpleGit
}

export const gitToolkit: GitToolkit = {
	_client: undefined,
	_baseRef: undefined,
	_currentRef: undefined,
	get client(): SimpleGit {
		if (this._client) {
			return this._client
		}
		this._client = simpleGit(import.meta.dir)
		logger.mark?.(`spawn git`)
		return this._client
	},
}

export async function getBaseGitRef(defaultBranch: string): Promise<string> {
	if (gitToolkit._baseRef) {
		return gitToolkit._baseRef
	}
	const { client: git } = gitToolkit
	if (env.CI) {
		await git.fetch(
			`origin`,
			defaultBranch,
			env.CI ? { "--depth": `1` } : undefined,
		)
		logger.mark?.(`fetched origin/${defaultBranch}`)
		const sha = await git.revparse([`origin/${defaultBranch}`])
		return sha.slice(0, 7)
	}
	const sha = await git.revparse([defaultBranch])
	const baseGitRef = sha.slice(0, 7)
	logger.mark?.(`base git ref: ${baseGitRef}`)
	gitToolkit._baseRef = baseGitRef
	return baseGitRef
}

export async function getCurrentGitRef(): Promise<string> {
	if (gitToolkit._currentRef) {
		return gitToolkit._currentRef
	}
	const { client: git } = gitToolkit
	const { current, branches } = await git.branch()
	const gitStatus = await git.status()
	const gitIsClean = gitStatus.isClean()
	logger.mark?.(`git status is clean: ${gitIsClean}`)
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

		logger.mark?.(`git status hash created: ${diffHash}`)
	}
	logger.mark?.(`current git ref: ${currentGitRef}`)
	gitToolkit._currentRef = currentGitRef
	return currentGitRef
}
