import type { ChangeEvent, FC } from "react"
import { useRef } from "react"

import type { SerializedStyles } from "@emotion/react"

import { ElasticInput } from "./ElasticInput"

const textToValue = (input: string, allowDecimal: boolean): number => {
  let interpretation: number
  switch (input) {
    case ``:
      interpretation = 0
      break
    case `.`:
      interpretation = 0
      break
    case `-`:
      interpretation = 0
      break
    case `-.`:
      interpretation = 0
      break
    default:
      interpretation = allowDecimal
        ? parseFloat(input)
        : Math.round(parseFloat(input))
      break
  }
  return interpretation
}

const valueToText = (numericValue?: number | null): string =>
  numericValue === null || numericValue === undefined
    ? ``
    : numericValue.toString()

export type NumberInputProps = {
  value: number
  set?: (value: number) => void
  allowDecimal?: boolean
  min?: number
  max?: number
  label?: string
  placeholder?: string
  customCss?: SerializedStyles
  autoSize?: boolean
}

export const VALID_NON_NUMBERS = [``, `-`, `.`, `-.`, `0.`] as const
export type ValidNonNumber = (typeof VALID_NON_NUMBERS)[number]
export const isValidNonNumber = (input: string): input is ValidNonNumber =>
  VALID_NON_NUMBERS.includes(input as ValidNonNumber)

export const NumberInput: FC<NumberInputProps> = ({
  value,
  set,
  label,
  placeholder,
  customCss,
  allowDecimal = true,
  max,
  min,
  autoSize = false,
}) => {
  const temporaryEntry = useRef<ValidNonNumber | null>(null)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    // if (onChange) onChange(event)
    if (set === undefined) return
    const input = event.target.value
    if (isValidNonNumber(input)) {
      temporaryEntry.current = input
      const textInterpretation = min?.toString() ?? `0`
      const newValue = textToValue(textInterpretation, allowDecimal)
      set(newValue)
      return
    }
    temporaryEntry.current = null
    const inputIsNumeric =
      (!isNaN(Number(input)) && !input.includes(` `)) ||
      (allowDecimal && input === `.`) ||
      (allowDecimal && input === `-.`) ||
      input === `` ||
      input === `-`
    const numericValue = textToValue(input, allowDecimal)

    if (numericValue !== null && max !== undefined && numericValue > max) {
      window.alert(`Value must be less than or equal to ${max}`)
      return
    }
    if (numericValue !== null && min !== undefined && numericValue < min) {
      window.alert(`Value must be greater than or equal to ${min}`)
      return
    }
    if (inputIsNumeric) {
      set(textToValue(input, allowDecimal))
    }
  }
  const displayValue = temporaryEntry.current ?? valueToText(value)
  return (
    <span css={customCss}>
      <label>{label}</label>
      {autoSize ? (
        <ElasticInput
          type="text"
          value={displayValue}
          onChange={handleChange}
          disabled={set === undefined}
          placeholder={placeholder}
        />
      ) : (
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          disabled={set === undefined}
          placeholder={placeholder}
        />
      )}
    </span>
  )
}
