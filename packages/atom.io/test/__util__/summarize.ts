import { prettyDOM } from "@testing-library/react"
import * as AtomIO from "atom.io"

export const summarize = (
  store: AtomIO.Store = AtomIO.__INTERNAL__.IMPLICIT.STORE
): void => {
  console.log(prettyDOM(document), {
    atoms: [store.atoms.count()],
  })
}
