import { createContext } from "react"

import { atom } from "recoil"
import { io } from "socket.io-client"

export const socket = io(`http://localhost:3333/`)
export const SocketContext = createContext(socket)
