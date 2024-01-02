import { useO } from "atom.io/react"
import { myIdState } from "atom.io/realtime-client"

import { span } from "src/components/<span>"

import scss from "./Me.module.scss"

export const Me: React.FC = () => {
	const myId = useO(myIdState)
	return (
		<span.chamferedTop className={scss.class}>
			<h3>{myId}</h3>
		</span.chamferedTop>
	)
}
