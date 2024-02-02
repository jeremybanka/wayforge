import { usersInRooms } from "atom.io/realtime-server"
import { setCssVars } from "hamr/react-css-vars"
import * as React from "react"

import { stringToColor } from "~/packages/anvl/src/string/string-to-color"
import { setCssVars } from "~/packages/hamr/react-css-vars/src"

import { usePullMutableAtomFamilyMember } from "atom.io/realtime-react"
import { Identity } from "../labels/Identity"
import scss from "./ProfilePicture.module.scss"

export const ProfilePicture: React.FC<{ id: string; detailed?: boolean }> = ({
	id,
	detailed,
}) => {
	usePullMutableAtomFamilyMember(usersInRooms.core.findRelatedKeysState, id)
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
