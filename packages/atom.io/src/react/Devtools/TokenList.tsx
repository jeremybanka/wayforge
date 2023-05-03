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

export const TokenList: FC<{
  tokenIndex: StateTokenIndex<
    AtomToken<unknown> | ReadonlySelectorToken<unknown> | SelectorToken<unknown>
  >
}> = ({ tokenIndex }) => {
  return (
    <>
      {Object.entries(tokenIndex).map(([key, token]) => (
        <Fragment key={key}>
          {key.startsWith(`👁️‍🗨️_`) ? null : (
            <div className="node">
              {key}:
              {`type` in token ? (
                <StoreEditor token={token} />
              ) : (
                recordToEntries(token.familyMembers).map(([key, token]) => (
                  <div key={key} className="node">
                    {key}:<StoreEditor token={token} />
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
