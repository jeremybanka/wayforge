import type { ReadonlySelectorToken, StateToken } from "atom.io"
import { useO, useIO } from "atom.io/react"
import type { FC } from "react"

import { fallback } from "~/packages/anvl/src/function"
import { Join } from "~/packages/anvl/src/join"
import { isJson } from "~/packages/anvl/src/json"
import { RelationEditor } from "~/packages/hamr/src/react-data-designer"
import { ElasticInput } from "~/packages/hamr/src/react-elastic-input"
import { JsonEditor } from "~/packages/hamr/src/react-json-editor"

export const StateEditor: FC<{
	token: StateToken<unknown>
}> = ({ token }) => {
	const [data, set] = useIO(token)
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
	token: ReadonlySelectorToken<unknown> | StateToken<unknown>
}> = ({ token }) => {
	if (token.type === `readonly_selector`) {
		return <ReadonlySelectorViewer token={token} />
	}
	return <StateEditor token={token} />
}
