import { ElasticInput } from "../../elastic-input"
import type { JsonEditorProps } from "../developer-interface"

export const NonJsonEditor: React.FC<JsonEditorProps<never>> = ({
	data,
	testid,
}) => {
	return data === undefined ? (
		<ElasticInput
			disabled
			value="undefined"
			data-testid={`${testid}-undefined`}
		/>
	) : (
		<ElasticInput
			disabled
			value={
				Object.getPrototypeOf(data).constructor.name + ` ` + JSON.stringify(data)
			}
			data-testid={`${testid}-non-json-${Object.getPrototypeOf(data).constructor.name}`}
		/>
	)
}
