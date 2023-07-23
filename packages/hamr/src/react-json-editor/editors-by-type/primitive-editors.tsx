import type { ReactElement } from "react"

import { NumberInput, TextInput } from "../../react-elastic-input"
import type { JsonEditorProps_INTERNAL } from "../json-editor-internal"

export const BooleanEditor = ({
	data,
	set,
	Components,
}: JsonEditorProps_INTERNAL<boolean>): ReactElement => (
	<Components.BooleanWrapper>
		<input
			type="checkbox"
			checked={data}
			onChange={(event) => set(event.target.checked)}
		/>
	</Components.BooleanWrapper>
)

export const NullEditor = ({
	Components,
}: JsonEditorProps_INTERNAL<null>): ReactElement => (
	<Components.NullWrapper>
		<></>
	</Components.NullWrapper>
)

export const NumberEditor = ({
	path = [],
	isReadonly = () => false,
	data,
	set,
	Components,
}: JsonEditorProps_INTERNAL<number>): ReactElement => (
	<Components.NumberWrapper>
		<NumberInput
			value={data}
			set={isReadonly(path) ? undefined : (newValue) => set(Number(newValue))}
			autoSize={true}
		/>
	</Components.NumberWrapper>
)

export const StringEditor = ({
	path = [],
	isReadonly = () => false,
	data,
	set,
	Components,
}: JsonEditorProps_INTERNAL<string>): ReactElement => {
	return (
		<Components.StringWrapper>
			<TextInput
				value={data}
				set={isReadonly(path) ? undefined : set}
				autoSize={true}
			/>
		</Components.StringWrapper>
	)
}
