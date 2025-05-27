import type { ArkErrors } from "arktype"
import type { ReadableToken, WritableToken } from "atom.io"
import { capitalize } from "atom.io/internal"
import { useI, useO } from "atom.io/react"
import * as React from "react"

import {
	oneTimeCodeInputAtom,
	oneTimeCodeNewEmailInputAtom,
	passwordInputAtom,
} from "../../services/socket-auth-service"
import type { AccountEditingState, AccountString } from "./account-state"
import {
	accountEditingAtom,
	buttonBlockActiveAtom,
	otcLoginFieldLabelSelector,
	otcVerifyFieldLabelSelector,
	useElement,
} from "./account-state"

export type FormProps = {
	label: AccountString
	inputToken: WritableToken<string>
	issuesToken: ReadableToken<ArkErrors | null>
	inputElementToken: WritableToken<HTMLInputElement | null>
	initialState: AccountEditingState
	onSubmit: (value: string) => Promise<Error | string>
	onOpen?: (() => Promise<void>) | (() => void)
	onCancel?: (() => Promise<void>) | (() => void)
	extraIssues?: React.ReactNode
}
export function Form({
	label,
	inputToken,
	issuesToken,
	inputElementToken,
	initialState,
	onSubmit,
	onOpen,
	onCancel,
	extraIssues,
}: FormProps): React.ReactNode {
	const input = useO(inputToken)
	const setInput = useI(inputToken)

	const otc = useO(oneTimeCodeInputAtom)
	const setOtc = useI(oneTimeCodeInputAtom)

	const otcEmailNew = useO(oneTimeCodeNewEmailInputAtom)
	const setOtcEmailNew = useI(oneTimeCodeNewEmailInputAtom)

	const password = useO(passwordInputAtom)
	const setPassword = useI(passwordInputAtom)

	const buttonBlockActive = useO(buttonBlockActiveAtom)
	const setButtonBlockActive = useI(buttonBlockActiveAtom)

	const editingState = useO(accountEditingAtom)
	const setEditing = useI(accountEditingAtom)

	const issues = useO(issuesToken)
	const otcLoginFieldLabel = useO(otcLoginFieldLabelSelector)
	const otcVerifyFieldLabel = useO(otcVerifyFieldLabelSelector)

	const elementRef = useElement(inputElementToken)

	const isUsingForm = editingState[0] === label
	const currentField = editingState.at(-1)
	const [_, ...nextSteps] = editingState

	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault()
				if (buttonBlockActive) {
					setButtonBlockActive(false)
					return
				}
				console.log(`submitted! changing ${label} to`, input)
				const result = await onSubmit(input)
				if (Error.isError(result)) {
					console.error(result)
				}
			}}
		>
			{isUsingForm ? (
				<button
					type="button"
					onClick={async () => {
						await onCancel?.()
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
					<span>
						{label === `new-password` ? `Password` : capitalize(label)}
					</span>
					<input
						id={label}
						type={label === `new-password` ? `password` : `text`}
						ref={elementRef}
						value={input}
						onChange={(e) => {
							setInput(e.target.value)
						}}
						autoComplete={label}
						autoCapitalize="none"
						disabled={currentField !== label}
					/>
				</label>
				{isUsingForm
					? nextSteps.map((field) => (
							<label key={`${label}-${field}`} htmlFor={`${label}-${field}`}>
								<span>
									{((): string => {
										switch (field) {
											case `otcLogin`:
												return otcLoginFieldLabel

											case `otcVerify`:
												return otcVerifyFieldLabel

											case `passwordLogin`:
												return `Password`
										}
									})()}
								</span>
								<input
									id={`${label}-otc`}
									type="text"
									ref={elementRef}
									value={(() => {
										switch (field) {
											case `otcLogin`:
												return otc
											case `otcVerify`:
												if (label === `email`) {
													return otcEmailNew
												}
												return otc
											case `passwordLogin`:
												return password
										}
									})()}
									onChange={(e) => {
										switch (field) {
											case `otcLogin`:
												setOtc(e.target.value)
												break
											case `otcVerify`:
												if (label === `email`) {
													setOtcEmailNew(e.target.value)
													break
												}
												setOtc(e.target.value)
												break
											case `passwordLogin`:
												setPassword(e.target.value)
										}
									}}
									autoComplete={
										label.includes(`otc`)
											? `one-time-code`
											: label.includes(`password`)
												? `password`
												: ``
									}
									autoCapitalize="none"
									disabled={field !== currentField}
								/>
							</label>
						))
					: null}
			</main>
			{editingState[0] === label ? (
				<button type="submit">{`->`}</button>
			) : (
				<button
					type="button"
					onMouseDown={async () => {
						setButtonBlockActive(true)
						await onOpen?.()
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
