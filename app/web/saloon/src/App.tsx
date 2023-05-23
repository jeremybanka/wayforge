import type { FC } from "react"

import { atom } from "~/packages/atom.io/src"

import { ReactComponent as Connected } from "./assets/svg/connected.svg"
import { ReactComponent as Disconnected } from "./assets/svg/disconnected.svg"
import { connectionState } from "./services/socket"
import { useO } from "./services/store"

const a = atom({
  key: `a`,
  default: 0,
})

export const App: FC = () => {
  const connection = useO(a)
  // const connection = useO(connectionState)
  return (
    <main>
      <div>{connection === `Connected` ? <Connected /> : <Disconnected />}</div>
    </main>
  )
}
