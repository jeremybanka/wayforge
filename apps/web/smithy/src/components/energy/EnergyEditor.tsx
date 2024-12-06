import "../styles/json-editor-skeletal.scss"

import type { FC } from "react"
import { useEffect } from "react"
import { useO, useI } from "atom.io/react"

import { includesAny } from "~/packages/anvl/src/array/venn"
import { JsonEditor } from "~/packages/hamr/react-json-editor/src"
import type { AtomEditorProps } from "~/packages/hamr/atom.io-tools/src"
import { AtomEditor } from "~/packages/hamr/atom.io-tools/src"
import { isGitSocketError } from "~/packages/socket-io.git/src/socket-git-atom-client"

import type { Energy, EnergyRelations } from "../../services/energy"
import {
	energyIndex,
	energySchemaState,
	energyWithRelationsSelectors,
} from "../../services/energy"
import { git } from "../../services/git"
import { useSetTitle } from "../../services/view"
import { Data_EnergyCard_A } from "./EnergyCard_A"
import { Data_EnergyCard_B } from "./EnergyCard_B"
import scss from "./EnergyEditor.module.scss"
import { ReactionList } from "./EnergyFeatureReactionList"
import { SVG_EnergyIcon } from "./EnergyIcon"
import { Slot_PreviewCardSleeve } from "./PreviewCardSleeve"
import { findState } from "atom.io/ephemeral"
import { RecoverableErrorBoundary } from "hamr/react-error-boundary"
import { runTransaction, setState } from "atom.io"
import { addReactionAsEnergyFeatureTX } from "../../services/reaction"

export const EnergyEditor_INTERNAL: FC<
	AtomEditorProps<Energy & EnergyRelations>
> = ({ id, family, useRemove }) => {
	const gitBranch = useO(git.branch.state)
	useEffect(() => {
		git.branch()
	}, [])
	const energyState = findState(family, id)
	const setEnergy = useI(energyState)
	const energy = useO(energyState)
	const set = {
		name: (name: string) => {
			setEnergy((e) => ({ ...e, name }))
		},
	}
	const remove = useRemove()
	useSetTitle(energy.name)

	const energySchema = useO(energySchemaState)

	return (
		<div className={scss.class}>
			<RecoverableErrorBoundary>
				<article>
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
				useCreate={() => () => runTransaction(addReactionAsEnergyFeatureTX)(id)}
			/>
		</div>
	)
}

export const EnergyEditor: FC = () => (
	<AtomEditor.IdFromRoute
		Editor={EnergyEditor_INTERNAL}
		family={energyWithRelationsSelectors}
		useRemove={() => (id) => {
			setState(energyIndex, (current) => {
				const next = new Set<string>(current)
				next.delete(id)
				return next
			})
		}}
	/>
)
