export interface TempestSocketServerSide {
	[event: string]: any
}

export interface TempestSocketUp {
	changeUsername: (username: string) => void
	createRoom: (roomId: string) => void
	joinRoom: (roomId: string) => void
	[leaveRoom: `leaveRoom:${string}`]: () => void
	[deleteRoom: `deleteRoom:${string}`]: () => void
}

export interface TempestSocketDown {
	usernameChanged: (username: string) => void
}
