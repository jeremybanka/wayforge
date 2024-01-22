import * as RTS from "atom.io/realtime-server"
import { letterAtoms, letterIndex } from "./game-store"

process.stdout.write(`✨`)
process.stdin.on(`data`, (data) => {
	// const [index, letter] = data.toString().split(`:`)
	// RTS.setState(letterAtoms(index), letter)
	console.log(data.toString())
})
setInterval(
	() => {
		console.log(`This interval keeps the Node.js process running`)
	},
	1000 * 60 * 60,
) // For example, an interval of 1 hour

const socket = RTS.childIPC()

const exposeFamily = RTS.realtimeFamilyProvider({ socket })

exposeFamily(letterAtoms, letterIndex)
