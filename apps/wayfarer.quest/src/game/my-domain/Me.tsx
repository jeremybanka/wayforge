import { useO } from "atom.io/react"
import { myIdState, myUsernameState } from "atom.io/realtime-client"

import { span } from "wayfarer.quest/components/<span>"

import { ProfilePicture } from "../players/ProfilePicture"
import scss from "./Me.module.scss"

export const Me: React.FC = () => {
	const myId = useO(myIdState)
	const myUsername = useO(myUsernameState)
	return (
		<span.chamferedTop className={scss.class}>
			<ProfilePicture id={myId ?? ``} detailed />
			<h3>{myUsername}</h3>
		</span.chamferedTop>
	)
}
