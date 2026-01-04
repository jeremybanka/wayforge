import { findRelations, runTransaction } from "atom.io"
import { useO } from "atom.io/react"
import type { RoomKey } from "atom.io/realtime"
import { usersInRooms } from "atom.io/realtime"
import { myUserKeyAtom } from "atom.io/realtime-client"
import { RealtimeContext } from "atom.io/realtime-react"
import { nanoid } from "nanoid"
import { useContext } from "react"

import {
	spawnClassicDeckTX,
	spawnHandTX,
	spawnTrickTX,
} from "../../../../../library/topdeck"
import { addPlayerToGameTX } from "../../../../../library/topdeck/card-game-actions/add-player-to-game"
import { startGameTX } from "../../../../../library/topdeck/hearts"
import { h3 } from "../components/hX"
import { useRadial } from "../peripherals/radial"
import { Hearts } from "./Hearts"
import scss from "./Public.module.scss"

export function Public({ roomKey }: { roomKey: RoomKey }): React.ReactNode {
	const { socket } = useContext(RealtimeContext)
	const myUsername = useO(myUserKeyAtom)
	const addPlayerToGame = runTransaction(addPlayerToGameTX)
	const spawnHand = runTransaction(spawnHandTX)
	const spawnClassicDeck = runTransaction(spawnClassicDeckTX)
	const createTrick = runTransaction(spawnTrickTX)
	const cohorts = useO(findRelations(usersInRooms, roomKey).userKeysOfRoom)
	const startGame = runTransaction(startGameTX)
	const handlers = useRadial([
		{
			label: `Create Deck`,
			do: () => {
				const deckId = nanoid()
				const cardIds = Array.from({ length: 52 }).map(() => nanoid())
				spawnClassicDeck(deckId, cardIds)
			},
		},
		{
			label: `Join Game`,
			do: () => {
				if (!myUsername) {
					console.error(`Tried to join a game without being in a room.`)
					return
				}
				addPlayerToGame(myUsername)
			},
		},
		{
			label: `Spawn Hand`,
			do: () => {
				if (!myUsername) {
					console.error(`Tried to join a game without being in a room.`)
					return
				}
				const groupId = nanoid()
				spawnHand(myUsername, groupId)
			},
		},
		{
			label: `Create Trick`,
			do: () => {
				const trickId = nanoid()
				createTrick(trickId)
			},
		},
		{
			label: `Start Game`,
			do: () => {
				startGame({
					handIds: cohorts.map(() => nanoid(5)),
					trickId: nanoid(5),
					cardIds: Array.from({ length: 52 }).map(() => nanoid(5)),
					deckId: `DECK_ID`,
					txId: nanoid(5),
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
				<Hearts roomKey={roomKey} />
			</main>
		</div>
	)
}
