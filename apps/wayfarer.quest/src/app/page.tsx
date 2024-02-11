"use client"

import { useO } from "atom.io/react"
import { AtomIODevtools } from "atom.io/react-devtools"

import { roomViewState } from "wayfarer.quest/services/store/room-view-state"
import Lobby from "./Lobby"
import Room from "./Room"

import scss from "./page.module.scss"

export default function SPA(): JSX.Element {
	const roomView = useO(roomViewState)
	return (
		<main className={scss.class}>
			{roomView === null ? <Lobby /> : <Room roomId={roomView} />}
			<AtomIODevtools />
		</main>
	)
}
