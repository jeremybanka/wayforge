import type { ReadonlySelectorToken, WritableToken } from "atom.io"
import { useI, useO } from "atom.io/react"
import type { FC } from "react"

import { fallback } from "~/packages/anvl/src/function"
import { isJson } from "~/packages/anvl/src/refinement"
import { ElasticInput } from "~/packages/hamr/react-elastic-input/src"
import { JsonEditor } from "~/packages/hamr/react-json-editor/src"

export const StateEditor: FC<{
	token: WritableToken<unknown>
}> = ({ token }) => {
	const set = useI(token)
	const data = useO(token)
	return isJson(data) ? (
		<JsonEditor data={data} set={set} schema={true} />
	) : (
		<div className="json_editor">
			<ElasticInput
				value={
					data !== null &&
					typeof data === `object` &&
					`toJson` in data &&
					typeof data.toJson === `function`
						? JSON.stringify(data.toJson())
						: data instanceof Set
						  ? `Set { ${JSON.stringify([...data]).slice(1, -1)} }`
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
