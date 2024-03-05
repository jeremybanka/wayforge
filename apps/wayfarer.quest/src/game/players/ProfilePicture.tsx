import { usersInRooms } from "atom.io/realtime"
import { setCssVars } from "hamr/react-css-vars"
import * as React from "react"

import { stringToColor } from "~/packages/anvl/src/string/string-to-color"

import { getInternalRelations } from "atom.io/data"
import { usePullMutableAtomFamilyMember } from "atom.io/realtime-react"
import { Identity } from "../labels/Identity"
import scss from "./ProfilePicture.module.scss"

export const ProfilePicture: React.FC<{ id: string; detailed?: boolean }> = ({
	id,
	detailed,
}) => {
	const roomOfUserState = getInternalRelations(usersInRooms)
	usePullMutableAtomFamilyMember(roomOfUserState, id)
	const bgColor = stringToColor(id)
	return (
		<span
			className={scss.class}
			data-css="profile-picture"
			style={setCssVars({
				"--background-color": bgColor,
			})}
		>
			{detailed ? <Identity id={id} /> : null}
		</span>
	)
}
