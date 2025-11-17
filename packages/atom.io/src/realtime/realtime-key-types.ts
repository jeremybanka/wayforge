export type SocketKey = `socket::${string}`
export const isSocketKey = (key: string): key is SocketKey =>
	key.startsWith(`socket::`)

export type UserKey = `user::${string}`
export const isUserKey = (key: string): key is UserKey =>
	key.startsWith(`user::`)

export type RoomKey = `room::${string}`
export const isRoomKey = (key: string): key is RoomKey =>
	key.startsWith(`room::`)
