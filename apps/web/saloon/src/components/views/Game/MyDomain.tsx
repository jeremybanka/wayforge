import * as React from "react"

import { useO } from "atom.io/react"

import { Hand } from "./Hand"
import { myHandsIndex } from "./store/my-hands-index"

export const MyDomain: React.FC = () => {
	const myHands = useO(myHandsIndex)
	return (
		<div className="my-domain">
			<div className="my-hands">
				{myHands.map((id) => (
					<Hand key={id} id={id} />
				))}
			</div>
		</div>
	)
}
