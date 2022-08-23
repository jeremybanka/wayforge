import type { FC } from "react"

import { css as style } from "@emotion/react"
import type { RecoilState } from "recoil"
import { useRecoilState } from "recoil"

import { findEnergyState, energyIndex } from "./services/energy"
import type { Energy } from "./services/energy"

export type RecoilIndexProps<T> = {
  id: string
  findState: (key: string) => RecoilState<T>
  unlink: () => void
}

export type TextInputProps = {
  value: string
  set: (value: string) => void
  label?: string
  placeholder?: string
  css?: string
}

export const TextInput: FC<TextInputProps> = ({
  value,
  set,
  label,
  placeholder,
  css,
}) => {
  return (
    <div
      css={style`
        display: flex;
        flex-direction: column;
        ${css}
      `}
    >
      <label>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => set(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

export const EnergyListItem: FC<RecoilIndexProps<Energy>> = ({
  id,
  findState,
  unlink,
}) => {
  const energyState = findState(id)
  const [energy, setEnergy] = useRecoilState(energyState)
  const set = {
    id: (value: string) => setEnergy((e) => ({ ...e, id: value })),
    name: (value: string) => setEnergy((e) => ({ ...e, name: value })),
  }
  return (
    <li>
      <TextInput
        value={energy.id}
        set={set.id}
        label="Name"
        placeholder="Name"
      />
      <button onClick={unlink}>Unlink</button>
    </li>
  )
}

export const EnergyList: FC = () => {
  const [ids, setIds] = useRecoilState(energyIndex)
  console.log(ids)
  const unlink = (id: string) => setIds((ids) => ids.filter((i) => i !== id))
  return (
    <ul>
      {ids.map((id) => (
        <EnergyListItem
          key={id}
          id={id}
          findState={findEnergyState}
          unlink={() => unlink(id)}
        />
      ))}
    </ul>
  )
}
