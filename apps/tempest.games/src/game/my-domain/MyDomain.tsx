import { useO } from "atom.io/react"
import * as React from "react"

import { span } from "tempest.games/components/<span>"
import { myHandsIndex } from "tempest.games/services/store/my-hands-index"
import { Hand } from "../game-pieces/Hand"
import { Me } from "../my-domain/Me"

import scss from "./MyDomain.module.scss"

export const MyDomain: React.FC = () => {
	const myHands = useO(myHandsIndex)
	return (
		<div className={scss.class}>
			<section data-css="me">
				<Me />
			</section>
			<section data-css="my-hands">
				{myHands.map((id) => (
					<Hand key={id} id={id} />
				))}
			</section>
			<span.chamferedTop data-css="tabletop" />
		</div>
	)
}
