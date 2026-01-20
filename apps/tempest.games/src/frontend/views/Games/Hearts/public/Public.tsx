import { runTransaction } from "atom.io"
import { useO } from "atom.io/react"
import type { RoomKey } from "atom.io/realtime"
import { myUserKeyAtom } from "atom.io/realtime-client"
import { RealtimeContext } from "atom.io/realtime-react"
import { useContext } from "react"

import {
	createClassicDeckTX,
	createHandTX,
} from "~library/game-systems/card-game-actions"
import { startGameTX } from "~library/game-systems/hearts-game-state"
import { spawnTrickTX } from "~library/game-systems/trick-taker-game-state"

import { h3 } from "../components/hX"
import { useRadial } from "../peripherals/radial"
import { Hearts } from "./HeartsBoard"
import scss from "./Public.module.scss"

export function Public({ roomKey }: { roomKey: RoomKey }): React.ReactNode {
	const { socket } = useContext(RealtimeContext)
	const myUsername = useO(myUserKeyAtom)
	const spawnHand = runTransaction(createHandTX)
	const spawnClassicDeck = runTransaction(createClassicDeckTX)
	const createTrick = runTransaction(spawnTrickTX)
	const startGame = runTransaction(startGameTX)
	const handlers = useRadial([
		{
			label: `Create Deck`,
			do: spawnClassicDeck,
		},
		{
			label: `Spawn Hand`,
			do: () => {
				if (!myUsername) {
					console.error(`Tried to join a game without being in a room.`)
					return
				}
				spawnHand(myUsername)
			},
		},
		{
			label: `Create Trick`,
			do: createTrick,
		},
		{
			label: `Start Game`,
			do: () => {
				startGame({
					shuffle: Math.random(),
				})
			},
		},
		{
			label: `Leave Game`,
			do: () => {
				socket?.emit(`leave-room`, roomKey)
			},
		},
	])
	return (
		<div className={scss[`class`]}>
			<h3.Trapezoid {...handlers}>Game</h3.Trapezoid>
			<main>
				<Hearts />
			</main>
		</div>
	)
}
