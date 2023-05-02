import type { FC } from "react"
import { useRef } from "react"

import { LayoutGroup, motion, spring } from "framer-motion"

import { atom } from "~/packages/atom.io/src"
import { attachMetaState } from "~/packages/atom.io/src/internal/meta/attach-meta"

import { TokenList } from "./TokenList"
import { useStore } from "../../services"

import "./devtools.scss"

const { atomTokenIndexState, selectorTokenIndexState } = attachMetaState()

const devtoolsAreOpenState = atom<boolean>({
  key: `👁️‍🗨️_devtools_are_open`,
  default: true,
})

export const DevTools: FC = () => {
  const atomTokenIndex = useStore(atomTokenIndexState)
  const selectorTokenIndex = useStore(selectorTokenIndexState)
  const constraintsRef = useRef(null)

  const [devtoolsAreOpen, setDevtoolsAreOpen] = useStore(devtoolsAreOpenState)

  const mouseHasMoved = useRef(false)

  return (
    <>
      <motion.span
        ref={constraintsRef}
        className="atom_io_devtools_zone"
        style={{
          position: `absolute`,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: `none`,
        }}
      />
      <motion.main
        drag
        dragConstraints={constraintsRef}
        className="atom_io_devtools"
        transition={spring}
        style={
          devtoolsAreOpen
            ? {}
            : {
                backgroundColor: `#0000`,
                borderColor: `#0000`,
                maxHeight: 28,
                maxWidth: 33,
              }
        }
      >
        {devtoolsAreOpen ? (
          <>
            <motion.header>
              <h1>atom.io</h1>
            </motion.header>
            <motion.main>
              <LayoutGroup>
                <section>
                  <h2>atoms</h2>
                  <TokenList tokenIndex={atomTokenIndex} />
                </section>
                <section>
                  <h2>selectors</h2>
                  <TokenList tokenIndex={selectorTokenIndex} />
                </section>
              </LayoutGroup>
            </motion.main>
          </>
        ) : null}
        <footer>
          <button
            onMouseDown={() => (mouseHasMoved.current = false)}
            onMouseMove={() => (mouseHasMoved.current = true)}
            onMouseUp={() => {
              if (!mouseHasMoved.current) {
                setDevtoolsAreOpen((open) => !open)
              }
            }}
          >
            👁️‍🗨️
          </button>
        </footer>
      </motion.main>
    </>
  )
}
