import { useState, useEffect } from "react"

import { configure } from "~/packages/atom.io/src"
import { composeStoreHook } from "~/packages/atom.io/src/react"

const { useStore } = composeStoreHook({ useState, useEffect })

configure({
  logger: console,
})

export { useStore }
