import { runTransaction } from "atom.io"
import { findRelations } from "atom.io/data"
import { useO } from "atom.io/react"
import type { Alias } from "atom.io/realtime"
import { usersInRooms } from "atom.io/realtime"
import { myUsernameState } from "atom.io/realtime-client"
import { RealtimeContext } from "atom.io/realtime-react"
import { nanoid } from "nanoid"
import { useContext } from "react"
import { h3 } from "wayfarer.quest/components/<hX>"
import { useRadial } from "wayfarer.quest/services/peripherals/radial"

import { addPlayerToGameTX } from "~/apps/core.wayfarer.quest/src/store/game/card-game-actions/add-player-to-game"
import { spawnClassicDeckTX } from "~/apps/core.wayfarer.quest/src/store/game/card-game-actions/spawn-classic-deck"
import { spawnHandTX } from "~/apps/core.wayfarer.quest/src/store/game/card-game-actions/spawn-hand"
import { spawnTrickTX } from "~/apps/core.wayfarer.quest/src/store/game/card-game-actions/spawn-trick"
import type { CardKey } from "~/apps/core.wayfarer.quest/src/store/game/card-game-stores/cards-store"
import { startGameTX } from "~/apps/core.wayfarer.quest/src/store/game/hearts/hearts-actions"

import type { GameProps } from "../Game"
import { Hearts } from "./Hearts"
import scss from "./Public.module.scss"

export function Public({ roomId }: GameProps): React.ReactNode {
	const { socket } = useContext(RealtimeContext)
	const myUsername = useO(myUsernameState)
	const addPlayerToGame = runTransaction(addPlayerToGameTX)
	const spawnHand = runTransaction(spawnHandTX)
	const spawnClassicDeck = runTransaction(spawnClassicDeckTX)
	const createTrick = runTransaction(spawnTrickTX)
	const cohorts = useO(findRelations(usersInRooms, roomId).userKeysOfRoom)
	const startGame = runTransaction(startGameTX)
	const handlers = useRadial([
		{
			label: `Create Deck`,
			do: () => {
				const deckId = `card_group:deck::${nanoid()}` as const
				const cardIds = Array.from({ length: 52 }).map<CardKey<Alias>>(
					() => `card::$$${nanoid()}$$`,
				)
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
				const groupId = `card_group:hand::${nanoid()}` as const
				spawnHand(myUsername, groupId)
			},
		},
		{
			label: `Create Trick`,
			do: () => {
				const trickId = `card_group:trick::${nanoid()}` as const
				createTrick(trickId)
			},
		},
		{
			label: `Start Game`,
			do: () => {
				startGame({
					handIds: cohorts.map(() => `card_group:hand::${nanoid()}` as const),
					trickId: `card_group:trick::${nanoid()}` as const,
					cardIds: Array.from({ length: 52 }).map<CardKey<Alias>>(
						() => `card::$$${nanoid()}$$`,
					),
					deckId: `card_group:deck::DECK_ID` as const,
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
