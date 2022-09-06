import type { FC } from "react"

import { css } from "@emotion/react"
import Ajv from "ajv/dist/core"
import type { RecoilState } from "recoil"
import { useRecoilState } from "recoil"

import energySchema from "~/app/wayforge-server/projects/wayfarer/schema/energy.schema.json"
import type { LuumCssRule } from "~/lib/Luum"
import { luumToCss } from "~/lib/Luum"
import { JsonEditor } from "~/lib/react-ui/json-editor"
import { TextInput } from "~/lib/react-ui/text-input"

import { findEnergyColorState } from "../../services/energy"
import type { Energy } from "../../services/energy"
import { EnergyColorPicker } from "./EnergyColorPicker"

export type RecoilIndexProps<T> = {
  id: string
  findState: (key: string) => RecoilState<T>
  unlink: () => void
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
  /*
  const colorSchemeA: LuumCssRule = {
    root: energy.colorA,
    attributes: [`color`, []],
  }
  const colorSchemeB: LuumCssRule = {
    root: energy.colorB,
    attributes: [`background-color`, []],
  }

  const colorAState = findEnergyColorState({ id, colorKey: `colorA` })
  const colorBState = findEnergyColorState({ id, colorKey: `colorB` })

  const scssA = luumToCss(colorSchemeA)
  const scssB = luumToCss(colorSchemeB)
  const scss = css`
    ${scssA};
    ${scssB};
  `
  */
  // const schemeIsInteractive = isInteractiveScheme(colorScheme)
  // const palette = mixPaletteStatic(colorScheme)
  // const paletteIsInteractive = isInteractivePalette(palette)
  // const dec = paletteToScssDeclaration(palette, 0)
  // console.log({ scssA, scssB })

  return (
    <li
      css={css`
        /* display: flex;
        gap: 10px; */
      `}
    >
      <label>{energy.name}</label>
      <JsonEditor
        data={energy}
        set={setEnergy}
        schema={energySchema}
        isReadonly={(path) => path.includes(`id`)}
        customCss={css`
          input {
            font-size: 20px;
            font-family: theia;
          }
          .__JSON__unofficial {
            background-color: #f083;
          }
        `}
      />
      {/* <span
        css={css`
          input {
            width: 100px;
            ${scss};
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
      <span>
        <TextInput
          label="name"
          value={energy.name}
          set={set.name}
          placeholder="-"
        />
        <TextInput label="id" value={energy.id} placeholder="-" />
      </span>
      <span>
        <EnergyColorPicker state={colorAState} />
        <EnergyColorPicker state={colorBState} />
      </span> */}

      <button onClick={unlink}>Unlink</button>
    </li>
  )
}
