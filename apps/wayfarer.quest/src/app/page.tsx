"use client"

import { useO } from "atom.io/react"
import { myUsernameState } from "atom.io/realtime-client"
import dynamic from "next/dynamic"
import { roomViewState } from "wayfarer.quest/services/store/room-view-state"

import Lobby from "./Lobby"
import scss from "./page.module.scss"
import Room from "./Room"

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

export default function SPA(): React.ReactNode {
	const roomView = useO(roomViewState)
	const myUsername = useO(myUsernameState)
	return (
		<main className={scss.class}>
			{roomView === null || myUsername === null ? (
				<Lobby />
			) : (
				<Room roomId={roomView} myUsername={myUsername} />
			)}
			<AtomIODevtools />
		</main>
	)
}
