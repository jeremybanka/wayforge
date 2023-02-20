import type { FC } from "react"

import type { SerializedStyles } from "@emotion/react"

import { ElasticInput } from "./ElasticInput"

export type TextInputProps = {
  value: string
  set?: (value: string) => void
  label?: string
  placeholder?: string
  customCss?: SerializedStyles
  autoSize?: boolean
}

export const TextInput: FC<TextInputProps> = ({
  value,
  set,
  label,
  placeholder,
  customCss,
  autoSize = false,
}) => {
  return (
    <span css={customCss}>
      <label>{label}</label>
      {autoSize ? (
        <ElasticInput
          type="text"
          value={value}
          onChange={(e) => set?.(e.target.value)}
          disabled={set === undefined}
          placeholder={placeholder}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => set?.(e.target.value)}
          disabled={set === undefined}
          placeholder={placeholder}
        />
      )}
    </span>
  )
}
