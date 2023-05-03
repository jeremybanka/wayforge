import type { FC } from "react"

import { isPlainJson } from "~/packages/anvl/src/json"
import type { ReadonlySelectorToken, StateToken } from "~/packages/atom.io/src"
import { ElasticInput } from "~/packages/hamr/src/react-elastic-input"
import { JsonEditor } from "~/packages/hamr/src/react-json-editor"

import { useStore } from "../../../../../app/web/sample/src/services"

export const StateEditor: FC<{ token: StateToken<unknown> }> = ({ token }) => {
  const [data, set] = useStore(token)
  return isPlainJson(data) ? (
    <JsonEditor data={data} set={set} schema={true} />
  ) : (
    <div className="json_editor">
      <ElasticInput
        value={
          Object.getPrototypeOf(data).constructor.name +
          ` ` +
          JSON.stringify(data)
        }
        disabled={true}
      />
    </div>
  )
}

export const ReadonlySelectorEditor: FC<{
  token: ReadonlySelectorToken<unknown>
}> = ({ token }) => {
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
          Object.getPrototypeOf(data).constructor.name +
          ` ` +
          JSON.stringify(data)
        }
        disabled={true}
      />
    </div>
  )
}

export const StoreEditor: FC<{
  token: ReadonlySelectorToken<unknown> | StateToken<unknown>
}> = ({ token }) => {
  if (token.type === `readonly_selector`) {
    return <ReadonlySelectorEditor token={token} />
  }
  return <StateEditor token={token} />
}
