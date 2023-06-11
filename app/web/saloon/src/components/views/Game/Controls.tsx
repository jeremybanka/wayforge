import type { FC } from "react"

import { useO } from "atom.io/react"
import { nanoid } from "nanoid"

import { addHandTx, spawnClassicDeckTX } from "~/app/node/lodge/src/store/game"

import { socketIdState, useRemoteTransaction } from "../../../services/store"
import { button } from "../../containers/<button>"

export const Controls: FC = () => {
  const mySocketId = useO(socketIdState)
  const addHand = useRemoteTransaction(addHandTx)
  const spawnClassicDeck = useRemoteTransaction(spawnClassicDeckTX)
  return (
    <div className="controls">
      <h4>Controls</h4>
      <button.flashFire
        onClick={() =>
          mySocketId
            ? addHand({ playerId: mySocketId, groupId: nanoid() })
            : null
        }
      >
        Add Hand
      </button.flashFire>
      <button.flashFire
        onClick={() =>
          spawnClassicDeck(nanoid(), Array.from({ length: 52 }).map(nanoid))
        }
      >
        Add Classic Deck
      </button.flashFire>
    </div>
  )
}
