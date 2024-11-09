import { atom, useRecoilTransaction_UNSTABLE } from "recoil"

import type { Transact } from "hamr/recoil-tools"
import { initGitClientTools, isGitSocketError } from "socket-io.git/recoil"

import { socket } from "./socket"

export const git = initGitClientTools(socket)

export const commitMessageState = atom<string>({
	key: `commitMessage`,
	default: ``,
})

export const transactCommitAll: Transact = (transactors) => {
	const branch = git.branch.getCurrentState(transactors)
	if (isGitSocketError(branch) || branch.current === `main`) return
	const message = transactors.get(commitMessageState)
	git.add(`.`)
	git.commit(message)
}
export const useCommitAll = (): (() => void) =>
	useRecoilTransaction_UNSTABLE((transactors) => () => {
		transactCommitAll(transactors)
	})

export const newBranchNameState = atom<string>({
	key: `newBranchName`,
	default: ``,
})

const transactMakeNewBranch: Transact = (transactors) => {
	const name = transactors.get(newBranchNameState)
	git.checkout([`-b`, name])
	git.branch()
}
export const useMakeNewBranch = (): (() => void) =>
	useRecoilTransaction_UNSTABLE((transactors) => () => {
		transactMakeNewBranch(transactors)
	})
