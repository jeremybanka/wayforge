import type { FC } from "react"

import { css } from "@emotion/react"
import { useRecoilState } from "recoil"

import type { RecoilEditorProps } from "~/app/wayforge-client/recoil-editor"
import { RecoilEditor } from "~/app/wayforge-client/recoil-editor"
import energySchema from "~/app/wayforge-server/projects/wayfarer/schema/energy.schema.json"
import { includesAny } from "~/lib/fp-tools/venn"
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
import { EnergyCard } from "./EnergyCard_SVG"
import { EnergyIcon } from "./EnergyIcon_SVG"

export const EnergyEditor_INTERNAL: FC<
  RecoilEditorProps<Energy & EnergyRelations>
> = ({ id, findState, useRemove }) => {
  const energyState = findState(id)
  const [energy, setEnergy] = useRecoilState(energyState)
  const set = {
    name: (name: string) => setEnergy((e) => ({ ...e, name })),
  }
  const remove = useRemove()
  useSetTitle(energy.name)

  return (
    <div
      css={css`
        border: 2px solid #333;
        padding: 20px;
      `}
    >
      <RecoverableErrorBoundary>
        <EnergyIcon energyId={id} size={100} />
        <EnergyCard energyId={id} size={100} />
      </RecoverableErrorBoundary>
      <JsonEditor
        schema={energySchema as JsonSchema}
        data={energy}
        set={setEnergy}
        name={energy.name}
        rename={set.name}
        remove={() => remove(id)}
        isHidden={includesAny([`features`, `id`, `name`])}
        customCss={skeletalJsonEditorCss}
      />
      <ReactionList
        ids={energy.features.map(({ id }) => id)}
        useCreate={() => useAddReactionAsEnergyFeature(id)}
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
