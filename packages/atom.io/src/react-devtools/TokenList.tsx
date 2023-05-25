import type { FC } from "react"
import { Fragment } from "react"

import { recordToEntries } from "~/packages/anvl/src/object"
import type {
  AtomToken,
  ReadonlySelectorToken,
  SelectorToken,
} from "~/packages/atom.io/src"
import type { StateTokenIndex } from "~/packages/atom.io/src/internal/meta/meta-state"

import { StoreEditor } from "./StateEditor"
import type { composeStoreHooks } from "../react"

export const TokenList: FC<{
  useStore: ReturnType<typeof composeStoreHooks>[`useStore`]
  tokenIndex: ReadonlySelectorToken<
    StateTokenIndex<
      | AtomToken<unknown>
      | ReadonlySelectorToken<unknown>
      | SelectorToken<unknown>
    >
  >
}> = ({ useStore, tokenIndex }) => {
  const tokenIds = useStore(tokenIndex)
  return (
    <>
      {Object.entries(tokenIds).map(([key, token]) => (
        <Fragment key={key}>
          {key.startsWith(`👁‍🗨_`) ? null : (
            <div className="node">
              {key}:
              {`type` in token ? (
                <StoreEditor useStore={useStore} token={token} />
              ) : (
                recordToEntries(token.familyMembers).map(([key, token]) => (
                  <div key={key} className="node">
                    {key}:<StoreEditor useStore={useStore} token={token} />
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
