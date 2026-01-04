export type Role = `backend` | `frontend`
export type Extension = `js` | `ts`
export type Runner = `bun` | `node`
export type RoomName = `${Role}.worker.${string}.${Runner}`
export const roomNames = [
	`backend.worker.bug-rangers.bun`,
	`backend.worker.hearts.bun`,
] as const satisfies RoomName[]
export type ActualRoomName = (typeof roomNames)[number]
