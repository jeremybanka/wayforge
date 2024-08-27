import type { FC } from "react"

import { ElasticInput } from "."

export type TextInputProps = {
	value: string
	set?: ((value: string) => void) | undefined
	label?: string
	placeholder?: string
	autoSize?: boolean
	readOnly?: boolean
	testid?: string
}

export const TextInput: FC<TextInputProps> = ({
	value,
	set,
	label,
	placeholder,
	autoSize = false,
	testid,
}) => {
	return (
		<span>
			<label>{label}</label>
			{autoSize ? (
				<ElasticInput
					type="text"
					value={value}
					onChange={(e) => set?.(e.target.value)}
					disabled={set === undefined}
					placeholder={placeholder}
					data-testid={testid}
				/>
			) : (
				<input
					type="text"
					value={value}
					onChange={(e) => set?.(e.target.value)}
					disabled={set === undefined}
					placeholder={placeholder}
					data-testid={testid}
				/>
			)}
		</span>
	)
}
