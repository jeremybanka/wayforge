import type { FC } from "react"
import { useRef } from "react"

import type { SerializedStyles } from "@emotion/react"
import { motion } from "framer-motion"

import { attachMetaState } from "~/packages/atom.io/src/internal/meta/attach-meta"

import { TokenList } from "./TokenList"
import { useStore } from "../../services"

const { atomTokenIndexState, selectorTokenIndexState } = attachMetaState()

export const DevTools: FC<{ customCss?: SerializedStyles }> = ({
  customCss,
}) => {
  const atomTokenIndex = useStore(atomTokenIndexState)
  const selectorTokenIndex = useStore(selectorTokenIndexState)
  const constraintsRef = useRef(null)

  return (
    <>
      <motion.span
        ref={constraintsRef}
        className="atom-io-devtools-constraints"
        style={{
          position: `absolute`,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: `none`,
        }}
      />
      <motion.main drag dragConstraints={constraintsRef} css={customCss}>
        <section>
          <h1>Atoms</h1>
          <TokenList tokenIndex={atomTokenIndex} />
        </section>
        <section>
          <h1>Selectors</h1>
          <TokenList tokenIndex={selectorTokenIndex} />
        </section>
      </motion.main>
    </>
  )
}
