import type { ReactElement } from "react"

import { NumberInput, TextInput } from "../../elastic-input"
import type { JsonEditorProps_INTERNAL } from "../json-editor-internal"

export const BooleanEditor = ({
	data,
	set,
	Components,
	testid,
}: JsonEditorProps_INTERNAL<boolean>): ReactElement => (
	<Components.BooleanWrapper>
		<input
			data-testid={`${testid}-boolean-input`}
			type="checkbox"
			checked={data}
			onChange={(event) => {
				set(event.target.checked)
			}}
		/>
	</Components.BooleanWrapper>
)

export const NullEditor = ({
	Components,
	testid,
}: JsonEditorProps_INTERNAL<null>): ReactElement => (
	<Components.Null testid={`${testid}-null`} />
)

export const NumberEditor = ({
	path = [],
	isReadonly = () => false,
	data,
	set,
	Components,
	testid,
}: JsonEditorProps_INTERNAL<number>): ReactElement => (
	<Components.NumberWrapper>
		<NumberInput
			testid={`${testid}-number-input`}
			value={data}
			set={
				isReadonly(path)
					? undefined
					: (newValue) => {
							set(Number(newValue))
						}
			}
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
	testid,
}: JsonEditorProps_INTERNAL<string>): ReactElement => {
	return (
		<Components.StringWrapper>
			<TextInput
				testid={`${testid}-string-input`}
				value={data}
				set={isReadonly(path) ? undefined : set}
				autoSize={true}
			/>
		</Components.StringWrapper>
	)
}
