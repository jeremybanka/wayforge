"use client"

import { useO } from "atom.io/react"
import dynamic from "next/dynamic"

import { roomViewState } from "wayfarer.quest/services/store/room-view-state"
import Lobby from "./Lobby"
import Room from "./Room"

import scss from "./page.module.scss"

// This function checks if the component should be loaded
const shouldLoadComponent = () => {
	// Replace `process.env.NODE_ENV !== 'production'` with any specific condition
	// based on your environment variables or other logic to determine if this
	// is a development or a preview environment
	return process.env.NODE_ENV !== `production`
}

// Dynamically import the component only if shouldLoadComponent returns true
const AtomIODevtools = dynamic(
	() =>
		shouldLoadComponent()
			? import(`atom.io/react-devtools`).then((mod) => mod.AtomIODevtools)
			: Promise.resolve(() => null),
	{
		ssr: false,
	},
)

export default function SPA(): JSX.Element {
	const roomView = useO(roomViewState)
	return (
		<main className={scss.class}>
			{roomView === null ? <Lobby /> : <Room roomId={roomView} />}
			<AtomIODevtools />
		</main>
	)
}
