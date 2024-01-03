import { useO } from "atom.io/react"
import { myIdState } from "atom.io/realtime-client"

import { span } from "src/components/<span>"

import { ProfilePicture } from "../players/ProfilePicture"
import scss from "./Me.module.scss"

export const Me: React.FC = () => {
	const myId = useO(myIdState)
	return (
		<span.chamferedTop className={scss.class}>
			<ProfilePicture id={myId ?? ``} detailed />
			<h3>username</h3>
		</span.chamferedTop>
	)
}
