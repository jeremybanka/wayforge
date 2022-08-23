import type { FC } from "react"
import { useEffect, useState } from "react"

import { css } from "@emotion/react"

import { EnergyList } from "./EnergyList"
import { OOPS, ErrorBoundary } from "./ErrorBoundary"
import { socket } from "./services/socket"
import "./App.css"

export const App: FC = () => {
  const [count, setCount] = useState(0)
  const [isConnected, setIsConnected] = useState(socket.connected)
  const [lastMessage, setLastMessage] = useState(null)

  useEffect(() => {
    socket.on(`connect`, () => {
      setIsConnected(true)
      console.log(`connect ${socket.id} on ${window.location.hostname}`)
      socket.emit(`authentication`, {
        token: `banka`,
      })
    })
    socket.on(`disconnect`, (reason) => {
      console.log(reason)
      setIsConnected(false)
    })
    socket.on(`unauthorized`, (reason) => {
      console.log(`Unauthorized:`, reason)

      socket.disconnect()
    })
    socket.on(`message`, (data) => {
      console.log(data)
      setLastMessage(data)
    })
    socket.on(`mouse`, (data) => {
      console.log(data)
      // setOtherPosition({ x: data, y: 0 })
    })
    return () => {
      socket.off(`connect`)
      socket.off(`disconnect`)
      socket.off(`message`)
    }
  })

  return (
    <div className="App">
      <i
        css={css`
          font-size: 200px;
        `}
      >
        w
      </i>
      <ErrorBoundary>
        <EnergyList />
      </ErrorBoundary>

      {/* <ErrorBoundary>
        <OOPS />
      </ErrorBoundary> */}
      {/* <div>
        <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
          <img src="/vite.svg" className="logo" alt="Vite logo" />
        </a>
        <a href="https://reactjs.org" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div> */}
      <h1>wayforge</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  )
}
