
import type { ReadonlySelectorToken, StateToken } from "atom.io"
import type { StoreHooks } from "atom.io/react"
import type { FC } from "react"

import { isPlainJson } from "~/packages/anvl/src/json"
import { ElasticInput } from "~/packages/hamr/src/react-elastic-input"
import { JsonEditor } from "~/packages/hamr/src/react-json-editor"

export const StateEditor: FC<{
	storeHooks: StoreHooks
	token: StateToken<unknown>
}> = ({ storeHooks, token }) => {
	const [data, set] = storeHooks.useIO(token)
	return isPlainJson(data) ? (
		<JsonEditor data={data} set={set} schema={true} />
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
						  JSON.stringify(data)
				}
				disabled={true}
			/>
		</div>
	)
}

export const ReadonlySelectorEditor: FC<{
	storeHooks: StoreHooks
	token: ReadonlySelectorToken<unknown>
}> = ({ storeHooks, token }) => {
	const data = storeHooks.useO(token)
	return isPlainJson(data) ? (
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
	storeHooks: StoreHooks
	token: ReadonlySelectorToken<unknown> | StateToken<unknown>
}> = ({ storeHooks, token }) => {
	if (token.type === `readonly_selector`) {
		return <ReadonlySelectorEditor storeHooks={storeHooks} token={token} />
	}
	return <StateEditor storeHooks={storeHooks} token={token} />
}
