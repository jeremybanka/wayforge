import { useO } from "atom.io/react"
import * as React from "react"

import { myHandsIndex } from "src/services/store/my-hands-index"
import { Hand } from "./Hand"

import scss from "./MyDomain.module.scss"

export const MyDomain: React.FC = () => {
	const myHands = useO(myHandsIndex)
	return (
		<div className={scss.class} data-css="my-domain">
			<div data-css="my-hands">
				{myHands.map((id) => (
					<Hand key={id} id={id} />
				))}
			</div>
		</div>
	)
}
