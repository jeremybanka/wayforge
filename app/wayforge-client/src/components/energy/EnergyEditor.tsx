import type { FC } from "react"

import { css } from "@emotion/react"
import { Link, useParams } from "react-router-dom"
import type { RecoilState } from "recoil"
import { useRecoilState } from "recoil"

import type { RecoilEditorProps } from "~/app/wayforge-client/recoil-editor"
import { RecoilEditor } from "~/app/wayforge-client/recoil-editor"
import energySchema from "~/app/wayforge-server/projects/wayfarer/schema/energy.schema.json"
import type { JsonSchema } from "~/lib/json/json-schema"
import { RecoverableErrorBoundary } from "~/lib/react-ui/error-boundary"
import type { JsxElements } from "~/lib/react-ui/json-editor"
import { JsonEditor } from "~/lib/react-ui/json-editor"

import type { Energy } from "../../services/energy"
import { findEnergyState, useRemoveEnergy } from "../../services/energy"
import { EnergyIcon } from "./EnergyIcon_SVG"

export const EnergyEditor_INTERNAL: FC<RecoilEditorProps<Energy>> = ({
  id,
  findState,
  useRemove,
}) => {
  const energyState = findState(id)
  const [energy, setEnergy] = useRecoilState(energyState)
  const set = {
    name: (name: string) => setEnergy((e) => ({ ...e, name })),
  }
  const remove = useRemove()

  return (
    <div
      css={css`
        border: 2px solid #333;
        padding: 20px;
      `}
    >
      <RecoverableErrorBoundary>
        <EnergyIcon energy={energy} size={100} />
      </RecoverableErrorBoundary>
      <JsonEditor
        schema={energySchema as JsonSchema}
        data={energy}
        set={setEnergy}
        name={energy.name}
        rename={set.name}
        remove={() => remove(id)}
        isReadonly={(path) => path.includes(`id`)}
        customCss={css`
          input {
            font-size: 20px;
            font-family: theia;
            border: none;
            border-bottom: 1px solid;
            background: none;
            &:disabled {
              border: none;
            }
          }
          button {
            background: none;
            margin-left: auto;
            color: #777;
            border: none;
            font-family: theia;
            font-size: 14px;
            margin: none;
            padding: 4px;
            padding-bottom: 6px;
            cursor: pointer;
            &:hover {
              color: #333;
              background-color: #aaa;
            }
          }
          select {
            font-family: theia;
            font-size: 14px;
            background: none;
            border: none;
            color: #777;
            @media (prefers-color-scheme: light) {
              color: #999;
            }
          }
          .json_editor_unofficial {
            background-color: #777;
            button {
              color: #333;
            }
          }
          .json_editor_missing {
            background-color: #f055;
          }
          .json_editor_key {
            input {
              color: #999;
              @media (prefers-color-scheme: light) {
                color: #777;
              }
            }
          }
          .json_editor_object {
            border-left: 2px solid #333;
            padding-left: 20px;
            @media (prefers-color-scheme: light) {
              border-color: #ccc;
            }
            .json_editor_properties {
              > * {
                border-bottom: 2px solid #333;
                margin-bottom: 2px;
              }
            }
          }
        `}
      />
    </div>
  )
}

export const EnergyEditor: FC = () => (
  <RecoilEditor.RouterAdaptor
    Editor={EnergyEditor_INTERNAL}
    findState={findEnergyState}
    useRemove={useRemoveEnergy}
  />
)
