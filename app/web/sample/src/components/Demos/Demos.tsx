import type { FC } from "react"

import { atom } from "~/packages/atom.io/src"

import { Colors } from "./Colors"
import { Division } from "./Division"
import { useStore } from "../../services"

const DEMOS = [`colors`, `division`] as const
type Demo = (typeof DEMOS)[number]

const demoAtom = atom<Demo>({
  key: `demo`,
  default: DEMOS[1],
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
      {demo === `division` && <Division />}
      {demo === `colors` && <Colors />}
    </>
  )
}
