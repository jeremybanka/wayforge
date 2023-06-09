import * as React from "react"

import { useO } from "atom.io/react"

import { Hand } from "./Hand"
import { myHandsIndex } from "./store/my-hands-index"

export const MyHands: React.FC = () => {
  const myHands = useO(myHandsIndex)
  return (
    <div className="my-hands">
      <h4>My Hands</h4>
      <div>
        {myHands.map((id) => (
          <Hand key={id} id={id} />
        ))}
      </div>
    </div>
  )
}
