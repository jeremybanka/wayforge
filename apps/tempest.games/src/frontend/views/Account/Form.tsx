import type { ArkErrors } from "arktype"
import type { ReadableToken, WritableToken } from "atom.io"
import { useI, useO } from "atom.io/react"
import * as React from "react"

import type { TempestSocketUp } from "../../../library/socket-interface"
import { socket } from "../../services/socket-auth-service"
import type { AccountString } from "./account-state"
import { buttonBlockActiveAtom, editingAtom, useElement } from "./account-state"

export type FormProps = {
	label: AccountString
	extraIssues?: React.ReactNode
	inputToken: WritableToken<string>
	issuesToken: ReadableToken<ArkErrors | null>
	inputElementToken: WritableToken<HTMLInputElement | null>
	signal: keyof TempestSocketUp
}
export function Form({
	label,
	inputToken,
	issuesToken,
	inputElementToken,
	signal,
	extraIssues,
}: FormProps): React.ReactNode {
	const input = useO(inputToken)
	const setInput = useI(inputToken)

	const buttonBlockActive = useO(buttonBlockActiveAtom)
	const setButtonBlockActive = useI(buttonBlockActiveAtom)

	const isEditing = useO(editingAtom)
	const setEditing = useI(editingAtom)

	const issues = useO(issuesToken)

	const elementRef = useElement(inputElementToken)

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault()
				if (buttonBlockActive) {
					setButtonBlockActive(false)
					return
				}
				console.log(`submitted! ${label} to`, input)
				socket.emit(signal, input)
				setEditing(null)
			}}
		>
			{isEditing === label ? (
				<button
					type="button"
					onClick={() => {
						setEditing(null)
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
					<span>{label}</span>
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
						disabled={isEditing !== label}
					/>
				</label>
			</main>
			{isEditing === label ? (
				<button type="submit">{`->`}</button>
			) : (
				<button
					type="button"
					onMouseDown={() => {
						setButtonBlockActive(true)
						setEditing(label)
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
