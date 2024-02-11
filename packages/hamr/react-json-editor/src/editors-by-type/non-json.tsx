import { ElasticInput } from "hamr/react-elastic-input"

import type { JsonEditorProps } from "../developer-interface"

export const NonJsonEditor: React.FC<JsonEditorProps<never>> = ({ data }) => {
	return data === undefined ? (
		<ElasticInput disabled value="undefined" />
	) : (
		<ElasticInput
			disabled
			value={
				Object.getPrototypeOf(data).constructor.name + ` ` + JSON.stringify(data)
			}
		/>
	)
}
