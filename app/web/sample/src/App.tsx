import type { FC } from "react"

import { css } from "@emotion/react"

import { atom } from "~/packages/atom.io/src"

import { defaultStyles } from "./components/atom.io-devtools/default-styles"
import { DevTools } from "./components/atom.io-devtools/DevTools"
import { Colors } from "./components/Demos/Colors"
import { Division } from "./components/Demos/Division"
import { useStore } from "./services"

const DEMOS = [`colors`, `division`] as const
type Demo = (typeof DEMOS)[number]

const demoAtom = atom<Demo>({
  key: `demo`,
  default: DEMOS[0],
})

export const App: FC = () => {
  const [demo, setDemo] = useStore(demoAtom)
  return (
    <main
      css={css`
        display: flex;
        flex-flow: column;
      `}
    >
      <select value={demo} onChange={(e) => setDemo(e.target.value as Demo)}>
        {DEMOS.map((demo) => (
          <option key={demo} value={demo}>
            {demo}
          </option>
        ))}
      </select>
      {demo === `division` && <Division />}
      {demo === `colors` && <Colors />}
      <DevTools customCss={defaultStyles} />
    </main>
  )
}
