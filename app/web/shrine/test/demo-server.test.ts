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

/*
CLIENT ACTS AND REPORTS
- input event fires
- event handler runs transaction
  - client store updates optimistically
- on success
  - client generates transactionId and optimistic TransactionUpdate
  - client pushes TransactionUpdate to TimelineData.history
  - client sets TransactionUpdate in optimisticTransactions map by transactionId
  - client emits TransactionRequest { key, params, transactionId }
*/

/*
SERVER VALIDATES, INTEGRATES, AND BROADCASTS
- server receives TransactionRequest { key, params, transactionId }
- server adds timestamp to TransactionRequest
  -> { key, params, transactionId, timestamp }
- server pushes TransactionRequest to queue
- check if client has used this transactionId before
  - if so, log error and BAIL
- server runs transaction, computing TransactionUpdate in the process
  - if failure, log error and BAIL
  - emit TransactionUpdate 
    -> { key, params, transactionId, timestamp, atomUpdates, output }
- server adds TransactionUpdate to TimelineData.history
*/

/*
CLIENT BEHOLDS AND REACTS
- client receives official TransactionUpdate
  - client retrieves its own TransactionUpdate from optimisticTransactions map
  - client compares official and optimistic TransactionUpdates
    - (stringify atomUpdates and compare strict)
  - if match, client removes TransactionUpdate from optimisticTransactions map
  - if mismatch
    - client undoes timeline until it finds its own TransactionUpdate
    - client replaces its own TransactionUpdate with official TransactionUpdate
    - client removes its own TransactionUpdate from optimisticTransactions map
    - client redoes timeline until it reaches the "HEAD"


*/

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
