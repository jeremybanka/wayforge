import type { FC } from "react"

import { atom } from "~/packages/atom.io/src"

import { Colors } from "./Colors"
import { Division } from "./Division"
import { ExplorerDemo } from "./Explorer"
import { useStore } from "../../services"

const DEMOS = [`explorer`, `colors`, `division`] as const
type Demo = (typeof DEMOS)[number]

const demoAtom = atom<Demo>({
  key: `demo`,
  default: DEMOS[0],
})

export const Demos: FC = () => {
  const [demo, setDemo] = useStore(demoAtom)
  return (
    <>
      <select value={demo} onChange={(e) => setDemo(e.target.value as Demo)}>
        {DEMOS.map((demo) => (
          <option key={demo} value={demo}>
            {demo}
          </option>
        ))}
      </select>
      {demo === `explorer` && <ExplorerDemo />}
      {demo === `division` && <Division />}
      {demo === `colors` && <Colors />}
    </>
  )
}
