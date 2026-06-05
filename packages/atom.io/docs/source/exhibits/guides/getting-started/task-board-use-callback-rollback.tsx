import * as React from "react"
import type { JSX } from "react/jsx-runtime"

const BLOCKED_TASK_IDS = new Set([`billing`])

export function TaskBoard(): JSX.Element {
	const [todoIds, setTodoIds] = React.useState([`billing`, `docs`])
	const [doneIds, setDoneIds] = React.useState([`setup`])
	const [error, setError] = React.useState<string | null>(null)

	const markDone = React.useCallback(
		(taskId: string) => {
			const previousTodoIds = todoIds
			const previousDoneIds = doneIds

			try {
				setError(null)
				setTodoIds((current) => current.filter((id) => id !== taskId))

				if (BLOCKED_TASK_IDS.has(taskId)) {
					throw new Error(`Blocked tasks need approval before they can move.`)
				}

				setDoneIds((current) => [taskId, ...current])
			} catch (thrown) {
				setTodoIds(previousTodoIds)
				setDoneIds(previousDoneIds)
				setError(
					thrown instanceof Error ? thrown.message : `Could not move task.`,
				)
			}
		},
		[todoIds, doneIds],
	)

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
