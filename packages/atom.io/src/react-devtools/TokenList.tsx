import type {
	AtomToken,
	ReadonlySelectorToken,
	SelectorToken,
	__INTERNAL__,
} from "atom.io"
import { getState } from "atom.io"
import type { StoreHooks } from "atom.io/react"
import { Fragment } from "react"
import type { FC } from "react"

import { recordToEntries } from "~/packages/anvl/src/object"

import type { StateTokenIndex } from "./meta"
import { StoreEditor } from "./StateEditor"

export const TokenList: FC<{
	groupTitle: string
	storeHooks: StoreHooks
	tokenIndex: ReadonlySelectorToken<
		StateTokenIndex<
			| AtomToken<unknown>
			| ReadonlySelectorToken<unknown>
			| SelectorToken<unknown>
		>
	>
}> = ({ storeHooks, tokenIndex }) => {
	const tokenIds = storeHooks.useO(tokenIndex)
	return (
		<section>
			<h2>atoms</h2>
			{Object.entries(tokenIds).map(([key, token]) => {
				return (
					<Fragment key={key}>
						{key.startsWith(`👁‍🗨`) ? null : (
							<div className="node">
								{`type` in token ? (
									<>
										<label
											onClick={() => console.log(token, getState(token))}
											onKeyUp={() => console.log(token, getState(token))}
										>
											{key}
										</label>
										<StoreEditor storeHooks={storeHooks} token={token} />
									</>
								) : (
									<>
										<label>{key}</label>
										{recordToEntries(token.familyMembers).map(([key, token]) => (
											<div key={key} className="node">
												<label
													onClick={() => console.log(token, getState(token))}
													onKeyUp={() => console.log(token, getState(token))}
												>
													{key}
												</label>
												<StoreEditor storeHooks={storeHooks} token={token} />
											</div>
										))}
									</>
								)}
							</div>
						)}
					</Fragment>
				)
			})}
		</section>
	)
}
