import type { ReadonlySelectorToken, WritableToken } from "atom.io"
import { isJson } from "atom.io/json"
import { useI, useO } from "atom.io/react"
import type { FC } from "react"

import { ElasticInput } from "./elastic-input"
import { JsonEditor } from "./json-editor"

export const fallback = <T,>(fn: () => T, fallbackValue: T): T => {
	try {
		return fn()
	} catch (_) {
		return fallbackValue
	}
}

export const StateEditor: FC<{
	token: WritableToken<unknown>
}> = ({ token }) => {
	const set = useI(token)
	const data = useO(token)
	return isJson(data) ? (
		<JsonEditor data={data} set={set} />
	) : (
		<div className="json_editor">
			<ElasticInput
				value={
					data === undefined || data === null
						? ``
						: typeof data === `object` &&
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
		<JsonEditor data={data} set={() => null} isReadonly={() => true} />
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
