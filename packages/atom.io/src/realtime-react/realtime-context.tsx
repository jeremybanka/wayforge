import * as React from "react"

import * as AR from "atom.io/react"
import type { Socket } from "socket.io-client"
import { io } from "socket.io-client"

import { myIdState__INTERNAL } from "./realtime-state"

export const RealtimeContext = React.createContext<{ socket: Socket }>({
  socket: io(),
})

export const RealtimeProvider: React.FC<{
  children: React.ReactNode
  socket: Socket
}> = ({ children, socket }) => {
  const setMyId = AR.useI(myIdState__INTERNAL)
  React.useEffect(() => {
    socket.on(`connect`, () => {
      setMyId(socket.id)
    })
    socket.on(`disconnect`, () => {
      setMyId(null)
    })
  }, [socket, setMyId])
  return (
    <RealtimeContext.Provider value={{ socket }}>
      {children}
    </RealtimeContext.Provider>
  )
}
