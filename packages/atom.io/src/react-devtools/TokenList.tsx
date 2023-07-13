import type { FC } from "react"
import { Fragment } from "react"

import type {
	AtomToken,
	ReadonlySelectorToken,
	SelectorToken,
	__INTERNAL__,
} from "atom.io"
import { getState } from "atom.io"
import type { StoreHooks } from "atom.io/react"

import { recordToEntries } from "~/packages/anvl/src/object"

import { StoreEditor } from "./StateEditor"

export const TokenList: FC<{
	storeHooks: StoreHooks
	tokenIndex: ReadonlySelectorToken<
		__INTERNAL__.META.StateTokenIndex<
			| AtomToken<unknown>
			| ReadonlySelectorToken<unknown>
			| SelectorToken<unknown>
		>
	>
}> = ({ storeHooks, tokenIndex }) => {
	const tokenIds = storeHooks.useO(tokenIndex)
	return (
		<>
			{Object.entries(tokenIds).map(([key, token]) => {
				let logState: () => void
				return (
					<Fragment key={key}>
						{key.startsWith(`👁‍🗨_`) ? null : (
							<div className="node">
								{`type` in token
									? ((logState = () => console.log(token, getState(token))),
									  (
											<>
												<label onClick={logState} onKeyUp={logState}>
													{key}
												</label>
												<StoreEditor storeHooks={storeHooks} token={token} />
											</>
									  ))
									: recordToEntries(token.familyMembers).map(([key, token]) => (
											<>
												<label>{key}</label>
												<div key={key} className="node">
													{key}:
													<StoreEditor storeHooks={storeHooks} token={token} />
												</div>
											</>
									  ))}
							</div>
						)}
					</Fragment>
				)
			})}
		</>
	)
}
