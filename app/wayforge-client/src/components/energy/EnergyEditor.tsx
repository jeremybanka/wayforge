import type { FC } from "react"

import { css } from "@emotion/react"
import { useRecoilState } from "recoil"

import type { RecoilEditorProps } from "~/app/wayforge-client/recoil-editor"
import { RecoilEditor } from "~/app/wayforge-client/recoil-editor"
import energySchema from "~/app/wayforge-server/projects/wayfarer/schema/energy.schema.json"
import type { JsonSchema } from "~/lib/json/json-schema"
import { RecoverableErrorBoundary } from "~/lib/react-ui/error-boundary"
import { JsonEditor } from "~/lib/react-ui/json-editor"

import type { Energy, EnergyRelations } from "../../services/energy"
import {
  findEnergyWithRelationsState,
  useRemoveEnergy,
} from "../../services/energy"
import { useAddReactionAsEnergyFeature } from "../../services/reaction"
import { useSetTitle } from "../../services/view"
import { ReactionList } from "../reaction/ReactionList"
import { skeletalJsonEditorCss } from "../styles/skeletalJsonEditorCss"
import { EnergyIcon } from "./EnergyIcon_SVG"

export const EnergyEditor_INTERNAL: FC<
  RecoilEditorProps<Energy & { features: EnergyRelations[`features`] }>
> = ({ id, findState, useRemove }) => {
  const energyState = findState(id)
  const [energy, setEnergy] = useRecoilState(energyState)
  const set = {
    name: (name: string) => setEnergy((e) => ({ ...e, name })),
  }
  const remove = useRemove()
  useSetTitle(energy.name)
  const addFeature = useAddReactionAsEnergyFeature()

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
        isHidden={(path) => path.includes(`features`)}
        customCss={skeletalJsonEditorCss}
      />
      <ReactionList
        ids={energy.features.map(({ id }) => id)}
        createNew={() => (console.log(`create new feature`), addFeature(id))}
      />
    </div>
  )
}

export const EnergyEditor: FC = () => (
  <RecoilEditor.RouterAdaptor
    Editor={EnergyEditor_INTERNAL}
    findState={findEnergyWithRelationsState}
    useRemove={useRemoveEnergy}
  />
)
