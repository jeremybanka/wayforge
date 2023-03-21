import { pipe } from "fp-ts/function"
import { Server as WebSocketServer } from "socket.io"
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

const PORT = 2063

/*
CLIENT ACTS AND REPORTS
- input event fires
- event handler calls zustand action
  - compute new state delta
  - apply state delta to zustand store optimistically
  - add optimistic event { id idPrev action targetIds redo undo } to event log
  - client emits event request { id action targetIds } to server
*/

/*
SERVER VALIDATES, INTEGRATES, AND BROADCASTS
- server receives event request
- make { timestamp }
- check if client has used this id before
  - if so, log error and BAIL
- decode virtual { id targetIds } into true { id targetIds }
- run action and computes { redo undo visibleTo }
  - if failure, add to error log and BAIL
- save true event { id timestamp action targetIds redo undo }
- for each client in visibleTo
  - encode true { id actorId } into virtual { id targetIds }
  - determine virtual { idPrev } from client's log
  - save client event { id idPrev action targetIds redo undo }
  - emit event { id idPrev timestamp action targetIds redo undo }
*/

/*
CLIENT BEHOLDS AND REACTS
- client receives client event { id timestamp action targetIds redo undo }
  - check if event is in event log
    - if so, check that they are internally equal
      - if so, BAIL -- you have an accurate copy of the event!
      - if not, delete the existing event from the event log
- add event to event log based on idPrev
  - as you iterate through the log, undo each event until you find idPrev
  - run redo on the new event
  - run redo on all events after the new event
*/

type Player = {
  x: number
  y: number
}

type GameState = {
  players: Record<string, Player>
  events: { timestamp: number; message: string }[]
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
