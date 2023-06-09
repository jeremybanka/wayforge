import type { FC } from "react"

import { css } from "@emotion/react"
import { useO } from "atom.io/react"
import { AnimatePresence } from "framer-motion"

import { valuesOfCardsState } from "~/app/node/lodge/src/store/game"

import { Div } from "../../containers/Div"

export const CardFace: FC<{ id: string }> = ({ id }) => {
  const value = useO(valuesOfCardsState).getRelatedId(id)
  return (
    <AnimatePresence>
      <Div.DropShadowDiagon
        css={css`
          padding: 5px;
        `}
      >
        {value}
      </Div.DropShadowDiagon>
    </AnimatePresence>
  )
}
export const CardBack: FC<{ id: string }> = () => {
  return (
    <AnimatePresence>
      <Div.DropShadowDiagon
        css={css`
          padding: 5px;
        `}
      ></Div.DropShadowDiagon>
    </AnimatePresence>
  )
}
