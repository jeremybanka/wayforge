import type { FC } from "react"

import type { SerializedStyles } from "@emotion/react"
import { css } from "@emotion/react"

export type TextInputProps = {
  value: string
  set?: (value: string) => void
  label?: string
  placeholder?: string
  customCss?: SerializedStyles
}

export const TextInput: FC<TextInputProps> = ({
  value,
  set,
  label,
  placeholder,
  customCss,
}) => {
  return (
    <div
      css={css`
        /* display: flex;
        flex-direction: column;
        input {
          max-width: 200px;
          font-size: 24px;
          font-family: name;
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
        } */
        ${customCss}
      `}
    >
      <label>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => set?.(e.target.value)}
        disabled={set === undefined}
        placeholder={placeholder}
      />
    </div>
  )
}
