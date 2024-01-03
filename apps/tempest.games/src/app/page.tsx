"use client"

import { useO } from "atom.io/react"
import { roomViewState } from "src/services/store/room-view-state"
import Lobby from "./Lobby"
import Room from "./Room"

import scss from "./page.module.scss"

export default function SPA(): JSX.Element {
	const roomView = useO(roomViewState)
	return (
		<main className={scss.class}>
			{roomView === null ? <Lobby /> : <Room roomId={roomView} />}
		</main>
	)
}
