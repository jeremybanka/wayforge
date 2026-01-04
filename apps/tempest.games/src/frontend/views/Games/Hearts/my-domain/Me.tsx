import { useO } from "atom.io/react"
import { myUserKeyAtom } from "atom.io/realtime-client"

import { usernameAtoms } from "../../../../../library/username-state"
import { span } from "../components/span"
import { ProfilePicture } from "../players/ProfilePicture"
import scss from "./Me.module.scss"

export const Me: React.FC = () => {
	const myUserKey = useO(myUserKeyAtom)
	const myUsername = useO(usernameAtoms, myUserKey ?? `user::$_NONE_$`)
	return (
		<span.chamferedTop className={scss[`class`]}>
			<ProfilePicture userKey={myUserKey ?? `user::$_NONE_$`} detailed />
			<h3>{myUsername}</h3>
		</span.chamferedTop>
	)
}
