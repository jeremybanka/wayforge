import { useState, useEffect } from "react"

import { configure } from "~/packages/atom.io/src"
import { composeStoreHooks } from "~/packages/atom.io/src/react"

const { useStore } = composeStoreHooks({ useState, useEffect })

configure({
  logger: console,
})

export { useStore }
