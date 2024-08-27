import type { ReadonlySelectorToken, WritableToken } from "atom.io"
import { useI, useO } from "atom.io/react"
import type { FC } from "react"

import { JsonEditor } from "./json-editor"

export const StateEditor: FC<{
	token: WritableToken<unknown>
}> = ({ token }) => {
	const set = useI(token)
	const data = useO(token)
	return (
		<JsonEditor testid={`${token.key}-state-editor`} data={data} set={set} />
	)
}

export const ReadonlySelectorViewer: FC<{
	token: ReadonlySelectorToken<unknown>
}> = ({ token }) => {
	const data = useO(token)
	return (
		<JsonEditor
			testid={`${token.key}-state-editor`}
			data={data}
			set={() => null}
			isReadonly={() => true}
		/>
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
