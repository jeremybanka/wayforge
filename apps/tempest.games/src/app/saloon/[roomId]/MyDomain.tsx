import { useO } from "atom.io/react"
import * as React from "react"

import { myHandsIndex } from "src/services/store/my-hands-index"
import { Hand } from "./Hand"

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
