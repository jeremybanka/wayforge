import type { ChangeEvent, FC } from "react"
import React, { useRef } from "react"

import type { SerializedStyles } from "@emotion/react"
import { css } from "@emotion/react"

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
  set: (value: number) => void
  allowDecimal?: boolean
  min?: number
  max?: number
  label?: string
  placeholder?: string
  customCss?: SerializedStyles
}

export const NumberInput: FC<NumberInputProps> = ({
  value,
  set,
  label,
  placeholder,
  customCss,
  allowDecimal = true,
  max,
  min,
}) => {
  const isEmpty = useRef<boolean>(false)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    // if (onChange) onChange(event)
    const input = event.target.value
    if (input === ``) {
      isEmpty.current = true
      const textInterpretation = min?.toString() ?? `0`
      const newValue = textToValue(textInterpretation, allowDecimal)
      set(newValue)
      return
    }
    isEmpty.current = false
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
  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        input {
          max-width: 200px;
          font-size: 24px;
          font-family: name;
          background: none;
          border: none;
          border-bottom: 1px solid;
          padding: none;
          padding-bottom: 5px;
          &:focus {
            background-color: #333;
            @media (prefers-color-scheme: light) {
              background-color: #eee;
            }
          }
        }
        label {
          font-size: 18px;
        }
        ${customCss}
      `}
    >
      <input
        type="number"
        value={isEmpty.current ? `` : valueToText(value)}
        onChange={handleChange}
        placeholder={placeholder}
      />
      <label>{label}</label>
    </div>
  )
}
