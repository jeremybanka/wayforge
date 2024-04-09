import type { FC } from "react"
import { useRecoilState, useRecoilValue } from "recoil"

import { isGitSocketError } from "~/packages/socket-io.git/src/socket-git-recoil"

import {
	commitMessageState,
	git,
	newBranchNameState,
	useCommitAll,
	useMakeNewBranch,
} from "./services/git"

import scss from "./Explorer.module.scss"

export const Explorer: FC = () => {
	const gitStatus = useRecoilValue(git.status.state)
	// const gitLog = useRecoilValue(git.log.state)
	const gitBranch = useRecoilValue(git.branch.state)
	const commitAll = useCommitAll()
	const makeNewBranch = useMakeNewBranch()
	const [commitMessage, setCommitMessage] = useRecoilState(commitMessageState)
	const [newBranchName, setNewBranchName] = useRecoilState(newBranchNameState)
	return (
		<div className={scss.class}>
			Explorer -{` `}
			{isGitSocketError(gitBranch) ? gitBranch.title : gitBranch.current}
			<div>
				{isGitSocketError(gitStatus) ? (
					gitStatus.title
				) : (
					<>
						<ul>
							{gitStatus.not_added.map((filename) => (
								<li key={filename}>{filename}</li>
							))}
						</ul>
						<ul data-css="staged">
							{gitStatus.staged.map((filename) => (
								<li key={filename}>{filename}</li>
							))}
						</ul>
					</>
				)}
				<button
					type="button"
					onClick={() => {
						git.status()
					}}
				>
					Refresh
				</button>
				{/* <button onClick={() => git.add(`.`)}>Add All</button> */}
				<div>
					<input
						value={newBranchName}
						onChange={(e) => {
							setNewBranchName(e.target.value)
						}}
					/>
					<button
						type="button"
						onClick={() => {
							makeNewBranch()
						}}
					>
						New Branch
					</button>
				</div>
				<div>
					<input
						value={commitMessage}
						onChange={(e) => {
							setCommitMessage(e.target.value)
						}}
					/>
					<button
						type="button"
						onClick={() => {
							commitAll()
						}}
					>
						Commit
					</button>
				</div>
				<button
					type="button"
					onClick={() => {
						git.reset([`--soft`, `HEAD^`])
					}}
				>
					Reset All
				</button>
				{/* <Combo
          options={recordToEntries(git)}
          selections={[]}
          setSelections={() => undefined}
          getName={(v) => v[0]}
          onSetSelections={(v) => v[1].action()}
        />
        {isGitSocketError(gitLog) ? (
          gitLog.title
        ) : (
          <ul>{JSON.stringify(gitLog)}</ul>
        )} */}
			</div>
		</div>
	)
}
