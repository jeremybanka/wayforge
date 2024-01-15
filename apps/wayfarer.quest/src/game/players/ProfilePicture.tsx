import * as React from "react"

import { setCssVars } from "hamr/react-css-vars"
import { stringToColor } from "~/packages/anvl/src/string/string-to-color"

import { usePullMutableFamilyMember } from "atom.io/realtime-react"
import { playersInRooms } from "~/apps/node/lodge/src/store/rooms"
import { Identity } from "../labels/Identity"
import scss from "./ProfilePicture.module.scss"

export const ProfilePicture: React.FC<{ id: string; detailed?: boolean }> = ({
	id,
	detailed,
}) => {
	const roomsOfPlayerState = playersInRooms.core.findRelatedKeysState(id)
	usePullMutableFamilyMember(roomsOfPlayerState)
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
