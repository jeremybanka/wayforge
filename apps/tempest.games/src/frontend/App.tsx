import "./App.css"

import { runTransaction } from "atom.io"
import { useO } from "atom.io/react"
import { useSyncContinuity } from "atom.io/realtime-react"
import { io } from "socket.io-client"

import { countAtom, countContinuity, incrementTX } from "../library/store"
import * as svg from "./<svg>"

function App(): JSX.Element {
	const count = useO(countAtom)
	const increment = runTransaction(incrementTX)
	useSyncContinuity(countContinuity)

	return (
		<>
			<div>
				<svg.tempest />
			</div>
			<div className="card">
				<button
					type="button"
					onClick={() => {
						increment()
					}}
				>
					count is {count}
				</button>
				<p>Let's see how high we can count!</p>
			</div>
		</>
	)
}

export default App
