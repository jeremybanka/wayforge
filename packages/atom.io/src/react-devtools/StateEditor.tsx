import type { ReadonlySelectorToken, WritableToken } from "atom.io"
import { useI, useO } from "atom.io/react"
import type { FC } from "react"

import { JsonEditor } from "./json-editor"

export const StateEditor: FC<{
	token: WritableToken<unknown>
}> = ({ token }) => {
	const set = useI(token)
	const data = useO(token)
	const metaPath = token.family
		? [token.family.key, token.family.subKey]
		: [token.key]
	return (
		<JsonEditor
			testid={`${token.key}-state-editor`}
			data={data}
			set={set}
			path={metaPath}
		/>
	)
}

export const ReadonlySelectorViewer: FC<{
	token: ReadonlySelectorToken<unknown>
}> = ({ token }) => {
	const data = useO(token)
	const metaPath = token.family
		? [token.family.key, token.family.subKey]
		: [token.key]
	return (
		<JsonEditor
			testid={`${token.key}-state-editor`}
			data={data}
			set={() => null}
			isReadonly={() => true}
			path={metaPath}
		/>
	)
}

export const StoreEditor: FC<{
	token: ReadonlySelectorToken<unknown> | WritableToken<unknown>
}> = ({ token }) => {
	switch (token.type) {
		case `readonly_pure_selector`:
		case `readonly_held_selector`:
			return <ReadonlySelectorViewer token={token} />
		case `writable_pure_selector`:
		case `writable_held_selector`:
		case `atom`:
		case `mutable_atom`:
			return <StateEditor token={token} />
	}
}
