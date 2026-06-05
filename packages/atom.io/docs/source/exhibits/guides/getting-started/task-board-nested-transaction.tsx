import { atom, runTransaction, transaction } from "atom.io"
import { useO } from "atom.io/react"
import type { JSX } from "react/jsx-runtime"

const BLOCKED_TASK_IDS = new Set([`billing`])

const todoIdsAtom = atom<string[]>({
	key: `todoIds`,
	default: [`billing`, `docs`],
})

const doneIdsAtom = atom<string[]>({
	key: `doneIds`,
	default: [`setup`],
})

const taskBoardErrorAtom = atom<string | null>({
	key: `taskBoardError`,
	default: null,
})

const markDoneTX = transaction<(taskId: string) => void>({
	key: `markDone`,
	do: ({ get, set }, taskId) => {
		set(
			todoIdsAtom,
			get(todoIdsAtom).filter((id) => id !== taskId),
		)

		if (BLOCKED_TASK_IDS.has(taskId)) {
			throw new Error(`Blocked tasks need approval before they can move.`)
		}

		set(doneIdsAtom, [taskId, ...get(doneIdsAtom)])
	},
})

const tryMarkDoneTX = transaction<(taskId: string) => void>({
	key: `tryMarkDone`,
	do: ({ run, set }, taskId) => {
		try {
			set(taskBoardErrorAtom, null)
			run(markDoneTX)(taskId)
		} catch (thrown) {
			set(
				taskBoardErrorAtom,
				thrown instanceof Error ? thrown.message : `Could not move task.`,
			)
		}
	},
})

const markDone = runTransaction(tryMarkDoneTX)

export function TaskBoard(): JSX.Element {
	const todoIds = useO(todoIdsAtom)
	const doneIds = useO(doneIdsAtom)
	const error = useO(taskBoardErrorAtom)

	return (
		<section>
			{error ? <p role="alert">{error}</p> : null}

			<h2>To do</h2>
			<ul>
				{todoIds.map((taskId) => (
					<li key={taskId}>
						{taskId}
						<button
							type="button"
							onClick={() => {
								markDone(taskId)
							}}
						>
							Mark done
						</button>
					</li>
				))}
			</ul>

			<h2>Done</h2>
			<ul>
				{doneIds.map((taskId) => (
					<li key={taskId}>{taskId}</li>
				))}
			</ul>
		</section>
	)
}
