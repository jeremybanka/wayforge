import { findState, setState } from "atom.io"
import * as RTS from "atom.io/realtime-server"

import { letterAtoms } from "./game-store"

process.stdout.write(`✨`)

const socket = new RTS.ParentSocket()

const provideAtom = RTS.realtimeStateProvider({ socket })

const letter0State = findState(letterAtoms, 0)

setState(letter0State, `A`)

provideAtom(letter0State)
