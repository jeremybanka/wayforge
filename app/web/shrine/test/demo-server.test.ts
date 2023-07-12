import { pipe } from "fp-ts/function"
import { Server as WebSocketServer } from "socket.io"
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

const PORT = 2063

type Player = {
  id: string
  name: string
}

type Character = {
  id: string
  name: string
}
type GameState = {
  players: Record<string, Player>
}

type State = {
  count: number
}

type Actions = {
  increment: (qty: number) => void
  decrement: (qty: number) => void
}

export const useCountStore = create(
  immer<Actions & State>((set) => ({
    count: 0,
    increment: (qty: number) =>
      set((state) => {
        state.count += qty
      }),
    decrement: (qty: number) =>
      set((state) => {
        state.count -= qty
      }),
  }))
)

const io = pipe(new WebSocketServer(PORT), (io) => {
  const store = useCountStore()
  return io.on(`connection`, (socket) => {
    console.log(`New client connected: ${socket.id}`)
  })
})
