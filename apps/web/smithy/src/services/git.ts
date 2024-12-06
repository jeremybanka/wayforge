import { atom, transaction } from "atom.io"

import {
	initGitAtomicTools,
	isGitSocketError,
} from "~/packages/socket-io.git/src/socket-git-atom-client"

import { socket } from "./socket"

export const git = initGitAtomicTools(socket)

export const commitMessageState = atom<string>({
	key: `commitMessage`,
	default: ``,
})

export const commitAllTX = transaction<() => void>({
	key: `commitAll`,
	do: (transactors) => {
		const branch = git.branch.getCurrentState(transactors)
		if (isGitSocketError(branch) || branch.current === `main`) return
		const message = transactors.get(commitMessageState)
		git.add(`.`)
		git.commit(message)
	},
})

export const newBranchNameState = atom<string>({
	key: `newBranchName`,
	default: ``,
})

export const makeNewBranchTX = transaction<() => void>({
	key: `makeNewBranch`,
	do: (transactors) => {
		const name = transactors.get(newBranchNameState)
		git.checkout([`-b`, name])
		git.branch()
	},
})
