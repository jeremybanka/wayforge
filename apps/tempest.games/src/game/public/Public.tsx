import { useO } from "atom.io/react"
import { myIdState } from "atom.io/realtime-client"
import { useServerAction, useSyncServerAction } from "atom.io/realtime-react"
import { nanoid } from "nanoid"

import {
	spawnClassicDeckTX,
	spawnHandTX,
	spawnTrickTX,
} from "~/apps/node/lodge/src/store/game"
import { startGameTX } from "~/apps/node/lodge/src/store/game/transactions/hearts"
import { playersInRooms } from "~/apps/node/lodge/src/store/rooms"

import { h3 } from "src/components/<hX>"
import { useRadial } from "src/services/peripherals/radial"
import type { GameProps } from "../Game"
import { Hearts } from "./Hearts"
import scss from "./Public.module.scss"

export function Public({ roomId }: GameProps): JSX.Element {
	const myId = useO(myIdState)
	const addHand = useServerAction(spawnHandTX)
	const spawnClassicDeck = useServerAction(spawnClassicDeckTX)
	const createTrick = useServerAction(spawnTrickTX)
	const playerIds = useO(playersInRooms.states.playerKeysOfRoom(roomId))
	const startGame = useSyncServerAction(startGameTX)
	const handlers = useRadial([
		{
			label: `Create Deck`,
			do: () => {
				const deckId = nanoid()
				const cardIds = Array.from({ length: 52 }).map(() => nanoid())
				spawnClassicDeck(roomId, deckId, cardIds)
			},
		},
		{
			label: `Join Game`,
			do: () => {
				if (!myId) {
					console.error(`Tried to join a game without being in a room.`)
					return
				}
				const groupId = nanoid()
				addHand(myId, groupId)
			},
		},
		{
			label: `Create Trick`,
			do: () => {
				const trickId = nanoid()
				createTrick(roomId, trickId)
			},
		},
		{
			label: `Start Game`,
			do: () => {
				startGame({
					gameId: roomId,
					handIds: playerIds.map(() => nanoid()),
					trickId: nanoid(),
					cardIds: Array.from({ length: 52 }).map(() => nanoid()),
					deckId: nanoid(),
				})
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
