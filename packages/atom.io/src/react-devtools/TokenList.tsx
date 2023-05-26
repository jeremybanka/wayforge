import type { FC } from "react"
import { Fragment } from "react"

import type {
  AtomToken,
  ReadonlySelectorToken,
  SelectorToken,
  __INTERNAL__,
} from "atom.io"
import type { StoreHooks } from "atom.io/react"

import { recordToEntries } from "~/packages/anvl/src/object"

import { StoreEditor } from "./StateEditor"

export const TokenList: FC<{
  storeHooks: StoreHooks
  tokenIndex: ReadonlySelectorToken<
    __INTERNAL__.Meta.StateTokenIndex<
      | AtomToken<unknown>
      | ReadonlySelectorToken<unknown>
      | SelectorToken<unknown>
    >
  >
}> = ({ storeHooks, tokenIndex }) => {
  const tokenIds = storeHooks.useO(tokenIndex)
  return (
    <>
      {Object.entries(tokenIds).map(([key, token]) => (
        <Fragment key={key}>
          {key.startsWith(`👁‍🗨_`) ? null : (
            <div className="node">
              {key}:
              {`type` in token ? (
                <StoreEditor storeHooks={storeHooks} token={token} />
              ) : (
                recordToEntries(token.familyMembers).map(([key, token]) => (
                  <div key={key} className="node">
                    {key}:<StoreEditor storeHooks={storeHooks} token={token} />
                  </div>
                ))
              )}
            </div>
          )}
        </Fragment>
      ))}
    </>
  )
}
