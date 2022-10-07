import type { FC } from "react"

import type { RecoilState } from "recoil"
import { useRecoilState } from "recoil"

import type { LuumSpec } from "~/lib/Luum"
import { NumberInput } from "~/lib/react-ui/number-input"

export type EnergyColorPickerProps = {
  state: RecoilState<LuumSpec>
}

export const EnergyColorPicker: FC<EnergyColorPickerProps> = ({ state }) => {
  const [color, setColor] = useRecoilState(state)
  const set = {
    hue: (hue: number) => setColor((c) => ({ ...c, hue })),
    sat: (sat: number) => setColor((c) => ({ ...c, sat })),
    lum: (lum: number) => setColor((c) => ({ ...c, lum })),
    prefer: (prefer: `lum` | `sat`) => setColor((c) => ({ ...c, prefer })),
  }
  return (
    <>
      <NumberInput label="hue" value={color.hue} set={set.hue} placeholder="-" />
      <NumberInput label="sat" value={color.sat} set={set.sat} placeholder="-" />
      <NumberInput label="lum" value={color.lum} set={set.lum} placeholder="-" />
      <input
        type="checkbox"
        checked={color.prefer === `lum`}
        onChange={() => set.prefer(color.prefer === `lum` ? `sat` : `lum`)}
      />
    </>
  )
}
