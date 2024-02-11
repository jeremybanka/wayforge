import type { ReadonlySelectorToken, WritableToken } from "atom.io"
import { useI, useO } from "atom.io/react"
import type { FC } from "react"

import { fallback } from "anvl/function"
import { Join } from "anvl/join"
import { isJson } from "anvl/refinement"
import { RelationEditor } from "hamr/react-data-designer"
import { ElasticInput } from "hamr/react-elastic-input"
import { JsonEditor } from "hamr/react-json-editor"

export const StateEditor: FC<{
	token: WritableToken<unknown>
}> = ({ token }) => {
	const set = useI(token)
	const data = useO(token)
	return isJson(data) ? (
		<JsonEditor data={data} set={set} schema={true} />
	) : data instanceof Join ? (
		<RelationEditor data={data} set={set} />
	) : (
		<div className="json_editor">
			<ElasticInput
				value={
					data instanceof Set
						? `Set { ${JSON.stringify([...data]).slice(1, -1)} }`
						: data instanceof Map
						  ? `Map ` + JSON.stringify([...data])
						  : Object.getPrototypeOf(data).constructor.name +
							  ` ` +
							  fallback(() => JSON.stringify(data), `?`)
				}
				disabled={true}
			/>
		</div>
	)
}

export const ReadonlySelectorViewer: FC<{
	token: ReadonlySelectorToken<unknown>
}> = ({ token }) => {
	const data = useO(token)
	return isJson(data) ? (
		<JsonEditor
			data={data}
			set={() => null}
			schema={true}
			isReadonly={() => true}
		/>
	) : (
		<div className="json_editor">
			<ElasticInput
				value={
					data instanceof Set
						? `Set ` + JSON.stringify([...data])
						: data instanceof Map
						  ? `Map ` + JSON.stringify([...data])
						  : Object.getPrototypeOf(data).constructor.name +
							  ` ` +
							  JSON.stringify(data)
				}
				disabled={true}
			/>
		</div>
	)
}

export const StoreEditor: FC<{
	token: ReadonlySelectorToken<unknown> | WritableToken<unknown>
}> = ({ token }) => {
	if (token.type === `readonly_selector`) {
		return <ReadonlySelectorViewer token={token} />
	}
	return <StateEditor token={token} />
}
