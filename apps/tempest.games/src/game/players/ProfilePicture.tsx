import * as React from "react"

import { setCssVars } from "hamr/react-css-vars"
import { stringToColor } from "~/packages/anvl/src/string/string-to-color"

import scss from "./ProfilePicture.module.scss"

export const ProfilePicture: React.FC<{ id: string }> = ({ id }) => {
	const bgColor = stringToColor(id)
	return (
		<span
			className={scss.class}
			style={setCssVars({
				"--background-color": bgColor,
			})}
		/>
	)
}
