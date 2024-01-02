import { useO } from "atom.io/react"
import * as React from "react"

import { span } from "src/components/<span>"
import { otherPlayersIndex } from "src/services/store/other-players-index"

import { Id } from "hamr/react-id"
import { ProfilePicture } from "../players/ProfilePicture"
import scss from "./EnemyDomains.module.scss"
import { TheirStuff } from "./TheirStuff"

export const EnemyDomains: React.FC = () => {
	const enemyIds = useO(otherPlayersIndex)
	return (
		<div className={scss.class}>
			<main>
				{enemyIds.map((id) => (
					<div key={id} data-css="enemy">
						<section data-css="their-pfp">
							<ProfilePicture id={id} />
						</section>
						<section data-css="their-stuff">
							<TheirStuff playerId={id} />
						</section>
					</div>
				))}
			</main>
			<span.chamferedTop data-css="tabletop" />
		</div>
	)
}
