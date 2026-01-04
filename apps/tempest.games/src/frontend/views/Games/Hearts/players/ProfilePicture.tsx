import { getInternalRelations } from "atom.io"
import type { UserKey } from "atom.io/realtime"
import { usersInRooms } from "atom.io/realtime"
import { usePullMutableAtomFamilyMember } from "atom.io/realtime-react"
import { setCssVars } from "hamr/react-css-vars"
import * as React from "react"

import { stringToColor } from "../../../../../library/string-to-color"
import { Identity } from "../labels/Identity"
import scss from "./ProfilePicture.module.scss"

export const ProfilePicture: React.FC<{
	userKey: UserKey
	detailed?: boolean
}> = ({ userKey, detailed }) => {
	const roomOfUserState = getInternalRelations(usersInRooms)
	usePullMutableAtomFamilyMember(roomOfUserState, userKey)
	const bgColor = stringToColor(userKey)
	return (
		<span
			className={scss[`class`]}
			data-css="profile-picture"
			style={setCssVars({
				"--background-color": bgColor,
			})}
		>
			{detailed ? <Identity id={userKey} /> : null}
		</span>
	)
}
