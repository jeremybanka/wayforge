import type { FC } from "react"

import { css as style } from "@emotion/react"
import type { RecoilState } from "recoil"
import { useRecoilState } from "recoil"

import {
  findEnergyState,
  energyIndex,
  useAddEnergy,
  useRemoveEnergy,
} from "./services/energy"
import type { Energy } from "./services/energy"

export type RecoilIndexProps<T> = {
  id: number
  findState: (key: number) => RecoilState<T>
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
    id: (id: number) => setEnergy((e) => ({ ...e, id })),
    name: (name: string) => setEnergy((e) => ({ ...e, name })),
  }
  return (
    <li>
      <TextInput
        value={energy.name}
        set={set.name}
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
  const addEnergy = useAddEnergy()
  const removeEnergy = useRemoveEnergy()

  return (
    <>
      <ul>
        {[...ids].map((id) => (
          <EnergyListItem
            key={id}
            id={id}
            findState={findEnergyState}
            unlink={() => removeEnergy(id)}
          />
        ))}
      </ul>
      <button onClick={addEnergy}>Add</button>
    </>
  )
}
