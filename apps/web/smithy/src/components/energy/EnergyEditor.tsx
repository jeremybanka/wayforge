import { css } from "@emotion/react"
import type { FC, ReactNode } from "react"
import { useEffect } from "react"
import { useRecoilState, useRecoilValue } from "recoil"

import { includesAny } from "~/packages/anvl/src/array/venn"
import { JsonEditor } from "~/packages/hamr/src/react-json-editor"
import { RecoverableErrorBoundary } from "~/packages/hamr/src/recoil-error-boundary"
import { RecoilEditor } from "~/packages/hamr/src/recoil-tools/RecoilEditor"
import type { RecoilEditorProps } from "~/packages/hamr/src/recoil-tools/RecoilEditor"
import { isGitSocketError } from "~/packages/socket-io.git/src/socket-git-recoil"

import type { Energy, EnergyRelations } from "../../services/energy"
import {
	energySchemaState,
	findEnergyWithRelationsState,
	useRemoveEnergy,
} from "../../services/energy"
import { git } from "../../services/git"
import { useAddReactionAsEnergyFeature } from "../../services/reaction"
import { useSetTitle } from "../../services/view"
import { skeletalJsonEditorCss } from "../styles/skeletalJsonEditorCss"
import { Data_EnergyCard_A } from "./EnergyCard_A"
import { Data_EnergyCard_B } from "./EnergyCard_B"
import { ReactionList } from "./EnergyFeatureReactionList"
import { SVG_EnergyIcon } from "./EnergyIcon"

export const Slot_PreviewCardSleeve: FC<{
	children: ReactNode
	hex: string
}> = ({ children, hex }) => (
	<slot
		css={css`
      background: #0f0;
      width: 276px;
      height: 384px;
      display: block;
      position: relative;
      overflow: hidden;
      &:hover {
        .sleeve-bg {
          border-color: transparent;
        }
      }
      data {
        position: absolute;
        top: -0px;
        left: -0px;
      }
      .sleeve-bg {
        height: 100%;
        width: 100%;
        display: block;
        box-sizing: border-box;
        border: 12px solid ${hex};
        opacity: 0.95;
        position: absolute;
        top: 0px;
        left: 0px;
        pointer-events: none;
      }
    `}
	>
		{children}
		<span className="sleeve-bg" />
	</slot>
)

export const EnergyEditor_INTERNAL: FC<
	RecoilEditorProps<Energy & EnergyRelations>
> = ({ id, findState, useRemove }) => {
	const gitBranch = useRecoilValue(git.branch.state)
	useEffect(() => {
		git.branch()
	}, [])
	const energyState = findState(id)
	const [energy, setEnergy] = useRecoilState(energyState)
	const set = {
		name: (name: string) => setEnergy((e) => ({ ...e, name })),
	}
	const remove = useRemove()
	useSetTitle(energy.name)

	const energySchema = useRecoilValue(energySchemaState)

	return (
		<div
			css={css`
        border: 2px solid #333;
        padding: 20px;
      `}
		>
			<RecoverableErrorBoundary>
				<article
					css={css`
            display: flex;
            flex-direction: row;
            align-items: flex-end;
            gap: 30px;
          `}
				>
					<SVG_EnergyIcon energyId={id} size={100} />
					<Slot_PreviewCardSleeve hex="var(--bg-color)">
						<Data_EnergyCard_A energyId={id} />
					</Slot_PreviewCardSleeve>
					<Slot_PreviewCardSleeve hex="var(--bg-color)">
						<Data_EnergyCard_B energyId={id} />
					</Slot_PreviewCardSleeve>
				</article>
			</RecoverableErrorBoundary>
			<JsonEditor
				schema={energySchema}
				data={energy}
				set={setEnergy}
				name={energy.name}
				rename={set.name}
				remove={() => remove(id)}
				isHidden={includesAny([`features`, `id`, `name`])}
				customCss={skeletalJsonEditorCss}
				isReadonly={() =>
					isGitSocketError(gitBranch) || gitBranch.current === `main`
				}
			/>
			<ReactionList
				labels={energy.features}
				useCreate={() => useAddReactionAsEnergyFeature(id)}
			/>
		</div>
	)
}

export const EnergyEditor: FC = () => (
	<RecoilEditor.IdFromRoute
		Editor={EnergyEditor_INTERNAL}
		findState={findEnergyWithRelationsState}
		useRemove={useRemoveEnergy}
	/>
)
