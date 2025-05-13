import type {
	ReadonlySelectorToken,
	ReadonlyTransientSelectorToken,
	WritableToken,
} from "atom.io"
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
	switch (token.type) {
		case `readonly_transient_selector`:
		case `readonly_recyclable_selector`:
			return <ReadonlySelectorViewer token={token} />
		case `writable_transient_selector`:
		case `writable_recyclable_selector`:
		case `atom`:
		case `mutable_atom`:
			return <StateEditor token={token} />
	}
}
