import type { FC } from "react"

import { isPlainJson } from "~/packages/anvl/src/json"
import type { ReadonlySelectorToken, StateToken } from "~/packages/atom.io/src"
import { ElasticInput } from "~/packages/hamr/src/react-elastic-input"
import { JsonEditor } from "~/packages/hamr/src/react-json-editor"

import type { composeStoreHooks } from "../react"

export const StateEditor: FC<{
  useStore: ReturnType<typeof composeStoreHooks>[`useStore`]
  token: StateToken<unknown>
}> = ({ useStore, token }) => {
  const [data, set] = useStore(token)
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
  useStore: ReturnType<typeof composeStoreHooks>[`useStore`]
  token: ReadonlySelectorToken<unknown>
}> = ({ useStore, token }) => {
  const data = useStore(token)
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
  useStore: ReturnType<typeof composeStoreHooks>[`useStore`]
  token: ReadonlySelectorToken<unknown> | StateToken<unknown>
}> = ({ useStore, token }) => {
  if (token.type === `readonly_selector`) {
    return <ReadonlySelectorEditor useStore={useStore} token={token} />
  }
  return <StateEditor useStore={useStore} token={token} />
}
