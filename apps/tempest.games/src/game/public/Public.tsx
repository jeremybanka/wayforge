import { useO } from "atom.io/react"
import { useServerAction } from "atom.io/realtime-react"
import { nanoid } from "nanoid"

import { addHandTX, spawnClassicDeckTX } from "~/apps/node/lodge/src/store/game"

import { h3 } from "src/components/<hX>"
import { useRadial } from "src/services/peripherals/radial"
import { publicDeckIndex } from "src/services/store/public-deck-index"
import { publicTrickIndex } from "src/services/store/public-trick-index"
import type { GameProps } from "../Game"
import { Deck } from "../game-pieces/Deck"

import { myIdState } from "atom.io/realtime-client"
import scss from "./Public.module.scss"

export function Public({ roomId }: GameProps): JSX.Element {
	const myId = useO(myIdState)
	const addHand = useServerAction(addHandTX)
	const spawnClassicDeck = useServerAction(spawnClassicDeckTX)
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
	])
	return (
		<div className={scss.class}>
			<h3.Trapezoid {...handlers}>Game</h3.Trapezoid>
			<main>
				<Decks roomId={roomId} />
				<Tricks roomId={roomId} />
			</main>
		</div>
	)
}
function Decks({ roomId }: GameProps): JSX.Element {
	const publicDeckIds = useO(publicDeckIndex)
	return (
		<>
			{publicDeckIds.map((id) => (
				<Deck key={id} id={id} />
			))}
		</>
	)
}
function Tricks({ roomId }: GameProps): JSX.Element {
	const publicTrickIds = useO(publicTrickIndex)
	return (
		<>
			{publicTrickIds.map((id) => (
				<Deck key={id} id={id} />
			))}
		</>
	)
}
