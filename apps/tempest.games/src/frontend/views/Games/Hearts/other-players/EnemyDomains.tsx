import { useO } from "atom.io/react"
import { mutualUsersSelector } from "atom.io/realtime"
import { myUserKeyAtom } from "atom.io/realtime-client"
import { usePullAtom } from "atom.io/realtime-react"
import * as React from "react"

import { span } from "../components/span"
import { ProfilePicture } from "../players/ProfilePicture"
import scss from "./EnemyDomains.module.scss"
import { TheirStuff } from "./TheirStuff"

export const EnemyDomains: React.FC = () => {
	const myUserKey = usePullAtom(myUserKeyAtom)
	const enemyIds = useO(mutualUsersSelector, myUserKey ?? `user::$_NONE_$`)
	return (
		<div className={scss[`class`]}>
			<main>
				{enemyIds.map((key) => (
					<div key={key} data-css="enemy">
						<section data-css="their-pfp">
							<ProfilePicture userKey={key} detailed />
						</section>
						<section data-css="their-stuff">
							<TheirStuff playerId={key} />
						</section>
					</div>
				))}
			</main>
			<span.chamferedTop data-css="tabletop" />
		</div>
	)
}
