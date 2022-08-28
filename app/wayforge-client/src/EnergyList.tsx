import type { ChangeEvent, FC } from "react"
import { useRef, useState } from "react"

import type { SerializedStyles } from "@emotion/react"
import { css } from "@emotion/react"
import type { RecoilState } from "recoil"
import { useRecoilValue, useRecoilState } from "recoil"

import type { Filter, LuumCssRule, LuumSpec } from "~/luum"
import { luumToCss, hexToSpec } from "~/luum"
import { shade, tint } from "~/luum/src/mixers/lum"

import {
  findEnergyState,
  energyIndex,
  useAddEnergy,
  useRemoveEnergy,
  findEnergyColorState,
} from "./services/energy"
import type { Energy } from "./services/energy"

/* eslint-disable max-lines */

const filter: Filter = [{ hue: 1, sat: 200 }]

export type RecoilIndexProps<T> = {
  id: string
  findState: (key: string) => RecoilState<T>
  unlink: () => void
}

// export type NonInteractiveScheme = {
//   root?: Mix
//   filter?: Filter
//   attributes: Partial<Record<CssColorPropertyKeys, Mix>>
//   // children?: Record<string, Scheme>
// }

export type TextInputProps = {
  value: string
  set: (value: string) => void
  label?: string
  placeholder?: string
  customCss?: SerializedStyles
}

export const TextInput: FC<TextInputProps> = ({
  value,
  set,
  label,
  placeholder,
  customCss,
}) => {
  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        input {
          max-width: 200px;
          font-size: 24px;
          font-family: name;
          background: none;
          border: none;
          border-bottom: 1px solid;
          padding: none;
          padding-bottom: 5px;
          &:focus {
            background-color: #333;
            @media (prefers-color-scheme: light) {
              background-color: #eee;
            }
          }
        }
        label {
          font-size: 18px;
        }
        ${customCss}
      `}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => set(e.target.value)}
        placeholder={placeholder}
      />
      <label>{label}</label>
    </div>
  )
}

const textToValue = (input: string, allowDecimal: boolean): number => {
  let interpretation: number
  switch (input) {
    case ``:
      interpretation = 0
      break
    case `.`:
      interpretation = 0
      break
    case `-`:
      interpretation = 0
      break
    case `-.`:
      interpretation = 0
      break
    default:
      interpretation = allowDecimal
        ? parseFloat(input)
        : Math.round(parseFloat(input))
      break
  }
  return interpretation
}

const valueToText = (numericValue?: number | null): string =>
  numericValue === null || numericValue === undefined
    ? ``
    : numericValue.toString()

export type NumberInputProps = {
  value: number
  set: (value: number) => void
  allowDecimal?: boolean
  min?: number
  max?: number
  label?: string
  placeholder?: string
  customCss?: SerializedStyles
}

// export const interfaceCore = (transform: Transformer<number>) => {
//   ;(n: number) => string
// }

export const NumberInput: FC<NumberInputProps> = ({
  value,
  set,
  label,
  placeholder,
  customCss,
  allowDecimal = true,
  max,
  min,
}) => {
  const isEmpty = useRef<boolean>(false)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    // if (onChange) onChange(event)
    const input = event.target.value
    if (input === ``) {
      isEmpty.current = true
      const textInterpretation = min?.toString() ?? `0`
      const newValue = textToValue(textInterpretation, allowDecimal)
      set(newValue)
      return
    }
    isEmpty.current = false
    const inputIsNumeric =
      (!isNaN(Number(input)) && !input.includes(` `)) ||
      (allowDecimal && input === `.`) ||
      (allowDecimal && input === `-.`) ||
      input === `` ||
      input === `-`
    const numericValue = textToValue(input, allowDecimal)

    if (numericValue !== null && max !== undefined && numericValue > max) {
      window.alert(`Value must be less than or equal to ${max}`)
      return
    }
    if (numericValue !== null && min !== undefined && numericValue < min) {
      window.alert(`Value must be greater than or equal to ${min}`)
      return
    }
    if (inputIsNumeric) {
      set(textToValue(input, allowDecimal))
    }
  }
  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        input {
          max-width: 200px;
          font-size: 24px;
          font-family: name;
          background: none;
          border: none;
          border-bottom: 1px solid;
          padding: none;
          padding-bottom: 5px;
          &:focus {
            background-color: #333;
            @media (prefers-color-scheme: light) {
              background-color: #eee;
            }
          }
        }
        label {
          font-size: 18px;
        }
        ${customCss}
      `}
    >
      <input
        type="number"
        value={isEmpty.current ? `` : valueToText(value)}
        onChange={handleChange}
        placeholder={placeholder}
      />
      <label>{label}</label>
    </div>
  )
}

const DEFAULT_ENERGY_SPEC: LuumSpec = {
  hue: 0,
  sat: 0,
  lum: 1,
  prefer: `lum`,
}

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

export const EnergyListItem: FC<RecoilIndexProps<Energy>> = ({
  id,
  findState,
  unlink,
}) => {
  const energyState = findState(id)
  const [energy, setEnergy] = useRecoilState(energyState)
  const set = {
    id: (id: string) => setEnergy((e) => ({ ...e, id })),
    name: (name: string) => setEnergy((e) => ({ ...e, name })),
    icon: (icon: string) => setEnergy((e) => ({ ...e, icon })),
  }

  const colorScheme: LuumCssRule = {
    root: energy.colorA,
    attributes: [
      [[`--color-fg`], [tint(30)]],
      [[`--color-bg`], [shade(30)]],
    ],
  }

  const colorAState = findEnergyColorState({ id, colorKey: `colorA` })
  const colorBState = findEnergyColorState({ id, colorKey: `colorB` })

  const scss = luumToCss(colorScheme)
  // const schemeIsInteractive = isInteractiveScheme(colorScheme)
  // const palette = mixPaletteStatic(colorScheme)
  // const paletteIsInteractive = isInteractivePalette(palette)
  // const dec = paletteToScssDeclaration(palette, 0)
  console.log({ scss })

  return (
    <li
      css={css`
        display: flex;
        gap: 10px;
      `}
    >
      <span
        css={css`
          input {
            width: 100px;
            color: var(--color-fg);
            background-color: var(--color-bg);
            ${scss}
          }
        `}
      >
        <TextInput
          value={energy.icon}
          set={set.icon}
          placeholder="-"
          customCss={css`
            input {
              font-size: 54px;
              font-family: "|_'_|";
              text-align: center;
            }
          `}
        />

        <TextInput
          value={energy.icon}
          set={set.icon}
          placeholder="-"
          customCss={css`
            input {
              font-family: sudo;
              text-align: center;
            }
          `}
        />
      </span>
      <TextInput
        label="name"
        value={energy.name}
        set={set.name}
        placeholder="-"
      />
      <EnergyColorPicker state={colorAState} />
      <EnergyColorPicker state={colorBState} />

      <button onClick={unlink}>Unlink</button>
    </li>
  )
}

export const EnergyList: FC = () => {
  const ids = useRecoilValue(energyIndex)
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
