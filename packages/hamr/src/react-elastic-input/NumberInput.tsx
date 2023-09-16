import type { SerializedStyles } from "@emotion/react"
import { pipe } from "fp-ts/function"
import type { FC } from "react"
import { useId, useRef, useState } from "react"

import { clampInto } from "~/packages/anvl/src/number"

import { ElasticInput } from "."

function round(value: number, decimalPlaces?: number): number {
	if (decimalPlaces === undefined) return value
	const factor = 10 ** decimalPlaces
	return Math.round(value * factor) / factor
}
function roundAndPad(value: number, decimalPlaces?: number): string {
	const roundedValue = round(value, decimalPlaces)
	const paddedString = roundedValue.toFixed(decimalPlaces)
	return paddedString
}

export const VALID_NON_NUMBERS = [``, `-`, `.`, `-.`] as const
export type ValidNonNumber = typeof VALID_NON_NUMBERS[number]
export const isValidNonNumber = (input: string): input is ValidNonNumber =>
	VALID_NON_NUMBERS.includes(input as ValidNonNumber)
export const VALID_NON_NUMBER_INTERPRETATIONS: Readonly<
	Record<ValidNonNumber, number | null>
> = {
	"": null,
	"-": 0,
	".": 0,
	"-.": 0,
} as const
export type DecimalInProgress = `${number | ``}.${number}`
export const isDecimalInProgress = (input: string): input is DecimalInProgress =>
	input === `0` || (!isNaN(Number(input)) && input.includes(`.`))

const textToValue = (input: string, allowDecimal: boolean): number | null => {
	if (isValidNonNumber(input)) return VALID_NON_NUMBER_INTERPRETATIONS[input]
	return allowDecimal ? parseFloat(input) : Math.round(parseFloat(input))
}

export type NumberConstraints = {
	max: number
	min: number
	decimalPlaces: number
	nullable: boolean
}
export const DEFAULT_NUMBER_CONSTRAINTS: NumberConstraints = {
	max: Infinity,
	min: -Infinity,
	decimalPlaces: 100,
	nullable: true,
}

const initRefinery =
	<Constraints extends NumberConstraints>(
		constraints: { [K in keyof Constraints]?: Constraints[K] | undefined },
	) =>
	(
		input: number | null,
	): Constraints extends { nullable: true | undefined }
		? number | null
		: number => {
		if (input === null && constraints.nullable === true) {
			return null as Constraints extends { nullable: true }
				? number | null
				: number
		}
		const { max, min, decimalPlaces } = {
			...DEFAULT_NUMBER_CONSTRAINTS,
			...constraints,
		}
		const constrained = pipe(input ?? 0, clampInto(min, max), (n) =>
			decimalPlaces ? round(n, decimalPlaces) : n,
		)
		return constrained
	}

const valueToText = (numericValue: number | null): string => {
	if (numericValue === null || numericValue === undefined) {
		return ``
	}
	return numericValue.toString()
}

type NumberInputProps = Partial<NumberConstraints> & {
	autoSize?: boolean
	customCss?: SerializedStyles
	disabled?: boolean
	id?: string
	label?: string
	name?: string
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
	onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
	placeholder?: string
	set?: ((newValue: number | null) => void) | undefined
	testId?: string
	value?: number | null
}

export const NumberInput: FC<NumberInputProps> = ({
	autoSize = false,
	customCss,
	decimalPlaces,
	disabled = false,
	label,
	max,
	min,
	name,
	onChange,
	onClick,
	placeholder = ``,
	set = () => null,
	testId,
	value = null,
}) => {
	const id = useId()
	const [temporaryEntry, setTemporaryEntry] = useState<
		DecimalInProgress | ValidNonNumber | null
	>(null)
	const userHasMadeDeliberateChange = useRef<boolean>(false)

	const refine = initRefinery({ max, min, decimalPlaces, nullable: true })

	const allowDecimal = decimalPlaces === undefined || decimalPlaces > 0

	const handleBlur = () => {
		if (userHasMadeDeliberateChange.current) {
			set(refine(value ?? null))
			setTemporaryEntry(null)
		}
		userHasMadeDeliberateChange.current = false
	}

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (onChange) onChange(event)
		if (set === undefined) return
		userHasMadeDeliberateChange.current = true
		const input = event.target.value
		if (isValidNonNumber(input) || isDecimalInProgress(input)) {
			setTemporaryEntry(input)
			const textInterpretation = isDecimalInProgress(input)
				? input
				: min?.toString() ?? `0`
			const newValue = textToValue(textInterpretation, allowDecimal)
			set(refine(newValue))
			return
		}
		setTemporaryEntry(null)
		const inputIsNumeric =
			(!isNaN(Number(input)) && !input.includes(` `)) ||
			(allowDecimal && input === `.`) ||
			(allowDecimal && input === `-.`) ||
			input === `` ||
			input === `-`
		const numericValue = textToValue(input, allowDecimal)

		if (inputIsNumeric) {
			set(refine(numericValue))
		}
	}

	const displayValue =
		temporaryEntry ?? valueToText(value ? refine(value) : value)

	return (
		<span css={customCss}>
			{label && <label htmlFor={id}>{label}</label>}
			{autoSize ? (
				<ElasticInput
					type="text"
					value={displayValue}
					placeholder={placeholder ?? `-`}
					onChange={handleChange}
					onBlur={handleBlur}
					disabled={disabled}
					name={name ?? id}
					id={id}
					onClick={onClick}
					data-testid={`number-input-${testId ?? id}`}
				/>
			) : (
				<input
					type="text"
					value={displayValue}
					placeholder={placeholder ?? `-`}
					onChange={handleChange}
					onBlur={handleBlur}
					disabled={disabled}
					name={name ?? id}
					id={id}
					onClick={onClick}
					data-testid={`number-input-${testId ?? id}`}
				/>
			)}
		</span>
	)
}
