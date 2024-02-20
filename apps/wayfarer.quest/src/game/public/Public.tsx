import { runTransaction } from "atom.io"
import { useO } from "atom.io/react"
import { usersInRooms } from "atom.io/realtime"
import { myUsernameState } from "atom.io/realtime-client"
import { RealtimeContext } from "atom.io/realtime-react"
import { nanoid } from "nanoid"
import { useContext } from "react"

import {
	spawnClassicDeckTX,
	spawnHandTX,
	spawnTrickTX,
} from "~/apps/core.wayfarer.quest/src/store/game"
import { startGameTX } from "~/apps/core.wayfarer.quest/src/store/game/hearts"

import { h3 } from "wayfarer.quest/components/<hX>"
import { useRadial } from "wayfarer.quest/services/peripherals/radial"
import type { GameProps } from "../Game"
import { Hearts } from "./Hearts"

import { addPlayerToGameTX } from "~/apps/core.wayfarer.quest/src/store/game/card-game-actions/add-player-to-game"
import scss from "./Public.module.scss"

export function Public({ roomId }: GameProps): JSX.Element {
	const { socket } = useContext(RealtimeContext)
	const myUsername = useO(myUsernameState)
	const addPlayerToGame = runTransaction(addPlayerToGameTX)
	const spawnHand = runTransaction(spawnHandTX)
	const spawnClassicDeck = runTransaction(spawnClassicDeckTX)
	const createTrick = runTransaction(spawnTrickTX)
	const cohorts = useO(usersInRooms.states.userKeysOfRoom, roomId)
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
				socket?.emit(`leave-room`, roomId)
			},
		},
	])
	return (
		<div className={scss.class}>
			<h3.Trapezoid {...handlers}>Game</h3.Trapezoid>
			<main>
				<Hearts roomId={roomId} />
			</main>
		</div>
	)
}
