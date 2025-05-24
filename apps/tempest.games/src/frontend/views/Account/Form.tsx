import type { ArkErrors } from "arktype"
import type { ReadableToken, WritableToken } from "atom.io"
import { capitalize } from "atom.io/internal"
import { useI, useO } from "atom.io/react"
import * as React from "react"

import type { AccountEditingState, AccountString } from "./account-state"
import {
	accountEditingAtom,
	buttonBlockActiveAtom,
	useElement,
} from "./account-state"

export type FormProps = {
	label: AccountString
	inputToken: WritableToken<string>
	issuesToken: ReadableToken<ArkErrors | null>
	inputElementToken: WritableToken<HTMLInputElement | null>
	initialState: AccountEditingState
	onSubmit: (value: string) => Promise<Error | string>
	extraIssues?: React.ReactNode
}
export function Form({
	label,
	inputToken,
	issuesToken,
	inputElementToken,
	initialState,
	onSubmit,
	extraIssues,
}: FormProps): React.ReactNode {
	const input = useO(inputToken)
	const setInput = useI(inputToken)

	const buttonBlockActive = useO(buttonBlockActiveAtom)
	const setButtonBlockActive = useI(buttonBlockActiveAtom)

	const editingState = useO(accountEditingAtom)
	const setEditing = useI(accountEditingAtom)

	const issues = useO(issuesToken)

	const elementRef = useElement(inputElementToken)

	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault()
				if (buttonBlockActive) {
					setButtonBlockActive(false)
					return
				}
				console.log(`submitted! changing ${label} to`, input)
				setEditing([])
				await onSubmit(input)
			}}
		>
			{editingState[0] === label ? (
				<button
					type="button"
					onClick={() => {
						setEditing([])
					}}
				>
					x
				</button>
			) : null}
			<main>
				<label htmlFor={label}>
					{issues || extraIssues ? (
						<aside>
							{extraIssues}
							{issues?.map((issue) => (
								<span key={issue.path.join(`.`)}>{issue.message}</span>
							))}
						</aside>
					) : null}
					<span>{capitalize(label)}</span>
					<input
						id={label}
						type="text"
						ref={elementRef}
						value={input}
						onChange={(e) => {
							setInput(e.target.value)
						}}
						autoComplete={label}
						autoCapitalize="none"
						disabled={editingState[0] !== label}
					/>
				</label>
			</main>
			{editingState[0] === label ? (
				<button type="submit">{`->`}</button>
			) : (
				<button
					type="button"
					onMouseDown={() => {
						setButtonBlockActive(true)
						setEditing(initialState)
					}}
					onMouseUp={() => {
						setButtonBlockActive(false)
					}}
				>
					/
				</button>
			)}
		</form>
	)
}
