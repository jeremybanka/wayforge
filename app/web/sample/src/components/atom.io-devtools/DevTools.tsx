import type { FC } from "react"
import { useRef } from "react"

import { motion } from "framer-motion"

import { atom } from "~/packages/atom.io/src"
import { attachMetaState } from "~/packages/atom.io/src/internal/meta/attach-meta"

import { TokenList } from "./TokenList"
import { useStore } from "../../services"

import "./devtools.scss"

const { atomTokenIndexState, selectorTokenIndexState } = attachMetaState()

const panelSizeState = atom({
  key: `👁️‍🗨️_panel_size`,
  default: { width: 300, height: 700 },
})

export const DevTools: FC = () => {
  const atomTokenIndex = useStore(atomTokenIndexState)
  const selectorTokenIndex = useStore(selectorTokenIndexState)
  const constraintsRef = useRef(null)

  const [panelSize, setPanelSize] = useStore(panelSizeState)

  return (
    <>
      <motion.span
        ref={constraintsRef}
        className="atom.io_devtools_zone"
        style={{
          position: `absolute`,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: `none`,
        }}
      />
      <motion.body
        drag
        dragConstraints={constraintsRef}
        className="atom_io_devtools_body"
      >
        <header>
          <h1>atom.io</h1>
        </header>
        <main>
          <section>
            <h2>Atoms</h2>
            <TokenList tokenIndex={atomTokenIndex} />
          </section>
          <section>
            <h2>Selectors</h2>
            <TokenList tokenIndex={selectorTokenIndex} />
          </section>
        </main>
        <footer>😃</footer>
      </motion.body>
    </>
  )
}
