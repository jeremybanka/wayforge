import { runTransaction } from "atom.io"
import { useO } from "atom.io/react"
import { usersInRooms } from "atom.io/realtime"
import { myUsernameState } from "atom.io/realtime-client"
import { RealtimeContext, useServerAction } from "atom.io/realtime-react"
import { nanoid } from "nanoid"

import {
	spawnClassicDeckTX,
	spawnHandTX,
	spawnTrickTX,
} from "~/apps/node/lodge/src/store/game"
import { startGameTX } from "~/apps/node/lodge/src/store/game/hearts"

import { useContext } from "react"
import { h3 } from "wayfarer.quest/components/<hX>"
import { useRadial } from "wayfarer.quest/services/peripherals/radial"
import type { GameProps } from "../Game"
import { Hearts } from "./Hearts"
import scss from "./Public.module.scss"

export function Public({ roomId }: GameProps): JSX.Element {
	const { socket } = useContext(RealtimeContext)
	const myUsername = useO(myUsernameState)
	const addHand = useServerAction(spawnHandTX)
	const spawnClassicDeck = useServerAction(spawnClassicDeckTX)
	const createTrick = useServerAction(spawnTrickTX)
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
				const groupId = nanoid()
				addHand(myUsername, groupId)
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
