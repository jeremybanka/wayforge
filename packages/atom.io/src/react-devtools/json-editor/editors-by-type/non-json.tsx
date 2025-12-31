import { ElasticInput } from "../../elastic-input"
import type { JsonEditorProps } from "../developer-interface"

export const NonJsonEditor: React.FC<JsonEditorProps<never>> = ({
	data,
	testid,
}) => {
	if (data === undefined) {
		return (
			<ElasticInput
				disabled
				value="undefined"
				data-testid={`${testid}-undefined`}
			/>
		)
	}
	let stringified: string
	try {
		stringified = JSON.stringify(data)
	} catch (_) {
		stringified = `?`
	}
	return (
		<ElasticInput
			disabled
			value={Object.getPrototypeOf(data).constructor.name + ` ` + stringified}
			data-testid={`${testid}-non-json-${Object.getPrototypeOf(data).constructor.name}`}
		/>
	)
}
