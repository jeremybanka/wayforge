import { useO } from "atom.io/react"
import * as React from "react"

import { span } from "../components/span"
import { Hand } from "../game-pieces/Hand"
import { myHandsSelector } from "../hearts-client-store/my-hands"
import { Me } from "../my-domain/Me"
import scss from "./MyDomain.module.scss"

export const MyDomain: React.FC = () => {
	const myHandKeys = useO(myHandsSelector)
	return (
		<div className={scss[`class`]}>
			<section data-css="me">
				<Me />
			</section>
			<section data-css="my-hands">
				{myHandKeys.map((key) => (
					<Hand key={key} />
				))}
			</section>
			<span.chamferedTop data-css="tabletop" />
		</div>
	)
}
