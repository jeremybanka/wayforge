import type { FC } from "react"
import { useEffect } from "react"
import { useRecoilState, useRecoilValue } from "recoil"

import { includesAny } from "~/packages/anvl/src/array/venn"
import { JsonEditor } from "~/packages/hamr/react-json-editor/src"
import { RecoverableErrorBoundary } from "~/packages/hamr/recoil-error-boundary/src"
import { RecoilEditor } from "~/packages/hamr/recoil-tools/src"
import type { RecoilEditorProps } from "~/packages/hamr/recoil-tools/src"
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
import { EnergyCardDataA } from "./EnergyCard_A"
import { EnergyCardDataB } from "./EnergyCard_B"
import { ReactionList } from "./EnergyFeatureReactionList"
import { EnergyIconSVG } from "./EnergyIcon"
import { PreviewCardSleeveSlot } from "./PreviewCardSleeve"

import "../styles/json-editor-skeletal.scss"
import scss from "./EnergyEditor.module.scss"

export const EnergyEditorInternal: FC<
	RecoilEditorProps<Energy & EnergyRelations>
> = ({ id, findState, useRemove }) => {
	const gitBranch = useRecoilValue(git.branch.state)
	useEffect(() => {
		git.branch()
	}, [])
	const energyState = findState(id)
	const [energy, setEnergy] = useRecoilState(energyState)
	const set = {
		name: (name: string) => {
			setEnergy((e) => ({ ...e, name }))
		},
	}
	const remove = useRemove()
	useSetTitle(energy.name)

	const energySchema = useRecoilValue(energySchemaState)

	return (
		<div className={scss.class}>
			<RecoverableErrorBoundary>
				<article>
					<EnergyIconSVG energyId={id} size={100} />
					<PreviewCardSleeveSlot hex="var(--bg-color)">
						<EnergyCardDataA energyId={id} />
					</PreviewCardSleeveSlot>
					<PreviewCardSleeveSlot hex="var(--bg-color)">
						<EnergyCardDataB energyId={id} />
					</PreviewCardSleeveSlot>
				</article>
			</RecoverableErrorBoundary>
			<JsonEditor
				schema={energySchema}
				data={energy}
				set={setEnergy}
				name={energy.name}
				rename={set.name}
				remove={() => {
					remove(id)
				}}
				isHidden={includesAny([`features`, `id`, `name`])}
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
		Editor={EnergyEditorInternal}
		findState={findEnergyWithRelationsState}
		useRemove={useRemoveEnergy}
	/>
)
