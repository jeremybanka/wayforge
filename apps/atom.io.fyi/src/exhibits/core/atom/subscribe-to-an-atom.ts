import { subscribe } from "atom.io"
import { countState } from "./declare-an-atom"

subscribe(countState, (count) => {
	console.log(`count is now ${count}`)
})
