export interface TempestSocketServerSide {
	[event: string]: any
}

export interface TempestSocketUp {
	changeUsername: (username: string) => void
}

export interface TempestSocketDown {
	usernameChanged: (username: string) => void
}
