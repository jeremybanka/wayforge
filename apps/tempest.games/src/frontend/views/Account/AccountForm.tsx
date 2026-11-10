import type { Children } from "@atom.io/spa"
import { useGetter, useRef, useSetter } from "@atom.io/spa"
import type { ArkErrors } from "arktype"
import type { ReadableToken, RegularAtomToken, WritableToken } from "atom.io"
import { capitalize } from "atom.io/internal"

import {
	oneTimeCodeInputAtom,
	oneTimeCodeNewEmailInputAtom,
	passwordInputAtom,
} from "../../services/socket-auth-service"
import type {
	AccountConfirmationField,
	AccountEditingState,
	AccountString,
} from "./account-state"
import {
	accountEditingAtom,
	buttonBlockActiveAtom,
	otcLoginFieldLabelSelector,
	otcVerifyFieldLabelSelector,
} from "./account-state"
import css from "./AccountForm.module.css"

export type FormProps = {
	label: AccountString
	inputToken: WritableToken<string>
	issuesToken: ReadableToken<ArkErrors | null>
	inputElementToken: RegularAtomToken<HTMLInputElement | null>
	initialState: AccountEditingState
	onSubmit: (value: string) => Promise<Error | string>
	onOpen?: (() => Promise<void>) | (() => void)
	onCancel?: (() => Promise<void>) | (() => void)
	extraIssues?: Children
}
export function AccountForm(props: FormProps): Children {
	const input = useGetter(props.inputToken)
	const setInput = useSetter(props.inputToken)

	const otc = useGetter(oneTimeCodeInputAtom)
	const setOtc = useSetter(oneTimeCodeInputAtom)

	const otcEmailNew = useGetter(oneTimeCodeNewEmailInputAtom)
	const setOtcEmailNew = useSetter(oneTimeCodeNewEmailInputAtom)

	const password = useGetter(passwordInputAtom)
	const setPassword = useSetter(passwordInputAtom)

	const buttonBlockActive = useGetter(buttonBlockActiveAtom)
	const setButtonBlockActive = useSetter(buttonBlockActiveAtom)

	const editingState = useGetter(accountEditingAtom)
	const setEditing = useSetter(accountEditingAtom)

	const issues = useGetter(props.issuesToken)
	const otcLoginFieldLabel = useGetter(otcLoginFieldLabelSelector)
	const otcVerifyFieldLabel = useGetter(otcVerifyFieldLabelSelector)

	const elementRef = useRef(props.inputElementToken)

	const isUsingForm = () => editingState()[0] === props.label
	const currentField = () => editingState().at(-1)
	const nextSteps = () => editingState().slice(1) as AccountConfirmationField[]

	return (
		<account-form className={css.class}>
			<form
				onSubmit={async (e) => {
					e.preventDefault()
					if (buttonBlockActive()) {
						setButtonBlockActive(false)
						return
					}
					console.log(`submitted! changing ${props.label} to`, input())
					const result = await props.onSubmit(input())
					if (Error.isError(result)) {
						console.error(result)
					}
				}}
			>
				{isUsingForm() ? (
					<button
						type="button"
						onClick={async () => {
							await props.onCancel?.()
							setEditing([])
						}}
					>
						x
					</button>
				) : null}
				<form-fields>
					<label htmlFor={props.label}>
						{issues() || props.extraIssues ? (
							<aside>
								{props.extraIssues}
								{issues()?.map((issue) => (
									<span key={issue.path.join(`.`)}>{issue.message}</span>
								))}
							</aside>
						) : null}
						<span>
							{props.label === `new-password`
								? `Password`
								: capitalize(props.label)}
						</span>
						<input
							id={props.label}
							type={props.label === `new-password` ? `password` : `text`}
							ref={elementRef}
							value={input()}
							onInput={(e) => {
								setInput(e.currentTarget.value)
							}}
							autoComplete={props.label}
							autoCapitalize="none"
							disabled={currentField() !== props.label}
						/>
					</label>
					{isUsingForm()
						? nextSteps().map((field) => (
								<label
									key={`${props.label}-${field}`}
									htmlFor={`${props.label}-${field}`}
								>
									<span>
										{((): string => {
											switch (field) {
												case `otcLogin`:
													return otcLoginFieldLabel()

												case `otcVerify`:
													return otcVerifyFieldLabel()

												case `passwordLogin`:
													return `Password`
											}
										})()}
									</span>
									<input
										id={`${props.label}-otc`}
										type="text"
										ref={elementRef}
										value={(() => {
											switch (field) {
												case `otcLogin`:
													return otc()
												case `otcVerify`:
													if (props.label === `email`) {
														return otcEmailNew()
													}
													return otc()
												case `passwordLogin`:
													return password()
											}
										})()}
										onInput={(e) => {
											switch (field) {
												case `otcLogin`:
													setOtc(e.currentTarget.value)
													break
												case `otcVerify`:
													if (props.label === `email`) {
														setOtcEmailNew(e.currentTarget.value)
														break
													}
													setOtc(e.currentTarget.value)
													break
												case `passwordLogin`:
													setPassword(e.currentTarget.value)
											}
										}}
										autoComplete={
											props.label.includes(`otc`)
												? `one-time-code`
												: props.label.includes(`password`)
													? `password`
													: ``
										}
										autoCapitalize="none"
										disabled={field !== currentField()}
									/>
								</label>
							))
						: null}
				</form-fields>
				{editingState()[0] === props.label ? (
					<button type="submit">{`->`}</button>
				) : (
					<button
						type="button"
						onMouseDown={async () => {
							setButtonBlockActive(true)
							await props.onOpen?.()
							setEditing(props.initialState)
						}}
						onMouseUp={() => {
							setButtonBlockActive(false)
						}}
					>
						/
					</button>
				)}
			</form>
		</account-form>
	)
}
