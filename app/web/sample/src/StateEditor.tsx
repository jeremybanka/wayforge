import type { FC } from "react"

import { isPlainJson } from "~/packages/anvl/src/json"
import type { StateToken } from "~/packages/atom.io/src"
import { ElasticInput } from "~/packages/hamr/src/react-elastic-input"
import { JsonEditor } from "~/packages/hamr/src/react-json-editor"

import { useStore } from "./services"
import { skeletalJsonEditorCss } from "../../smithy/src/components/styles/skeletalJsonEditorCss"

export const StateEditor: FC<{ token: StateToken<unknown> }> = ({ token }) => {
  const [data, set] = useStore(token)
  return isPlainJson(data) ? (
    <JsonEditor
      data={data}
      set={set}
      customCss={skeletalJsonEditorCss}
      schema={true}
    />
  ) : (
    <div css={skeletalJsonEditorCss}>
      <ElasticInput
        value={Object.getPrototypeOf(data).constructor.name}
        disabled={true}
      />
    </div>
  )
}
